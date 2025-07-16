// src/app/api/secure/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { checkErrors } from "./checkErrors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

interface ResponseData {
  plan: "FREE" | "SMART" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
  currentPeriodEnd?: number;
  stripeSubscriptionId: string | null;
}

export async function GET() {
  console.log("GET - Subscriptions API start");
  const locale = await getLocale();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        {
          error:
            locale === "ko" ? "인증되지 않았습니다." : "認証されていません。",
        },
        { status: 401 }
      );
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      console.error("GET - Token verification error:", error);
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "유효하지 않은 토큰입니다."
              : "無効なトークンです。",
          details: error,
        },
        { status: 401 }
      );
    }

    if (!payload.churchId) {
      return NextResponse.json(
        {
          error:
            locale === "ko" ? "교회 ID가 없습니다." : "教会IDがありません。",
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { churchId: payload.churchId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }, // 최신 데이터 보장
    });

    const responseData: ResponseData = {
      plan: subscription?.plan || "FREE",
      status: subscription?.status || "ACTIVE",
      stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
    };

    if (subscription?.stripeSubscriptionId) {
      try {
        // stripeSubscriptionId가 Checkout 세션 ID인지 확인
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          subscription.stripeSubscriptionId,
          { expand: ["subscription"] }
        );
        if (checkoutSession.subscription) {
          const stripeSubscription =
            checkoutSession.subscription as Stripe.Subscription;
          responseData.plan = subscription.plan;
          responseData.status =
            stripeSubscription.status === "active" ? "ACTIVE" : "CANCELED";
          responseData.currentPeriodEnd =
            stripeSubscription.items.data[0].current_period_end;
        } else {
          console.warn(
            "GET - No subscription found for checkout session:",
            subscription.stripeSubscriptionId
          );
        }
      } catch (error) {
        console.error("GET - Error retrieving checkout session:", error);
        // Checkout 세션이 만료되었거나 유효하지 않은 경우, 구독 ID로 직접 조회 시도
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
          );
          responseData.plan = subscription.plan;
          responseData.status =
            stripeSubscription.status === "active" ? "ACTIVE" : "CANCELED";
          responseData.currentPeriodEnd =
            stripeSubscription.items.data[0].current_period_end;
        } catch (subError) {
          console.error("GET - Error retrieving subscription:", subError);
        }
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET - Subscription fetch error:", error);
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "구독 정보를 가져오지 못했습니다."
            : "サブスクリプション情報を取得できませんでした。",
        details: error,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { plan }: { plan: "SMART" | "ENTERPRISE" } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          error:
            locale === "ko" ? "인증되지 않았습니다." : "認証されていません。",
        },
        { status: 401 }
      );
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch (error: unknown) {
      console.error("POST - Token verification error:", error);
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "유효하지 않은 토큰입니다."
              : "無効なトークンです。",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 401 }
      );
    }

    const church = await prisma.church.findUnique({
      where: { id: payload.churchId },
    });
    if (!church) {
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "교회를 찾을 수 없습니다."
              : "教会が見つかりません。",
        },
        { status: 404 }
      );
    }

    await checkErrors({ payload, plan, locale });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, churchId: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Stripe 고객 생성
    const customer: Stripe.Customer = await stripe.customers.create({
      metadata: {
        church_id: String(payload.churchId),
        user_id: payload.userId,
      },
      email: user.email,
      name: user.name,
    });

    // 가격 ID 확인
    const priceId: string =
      plan === "SMART"
        ? process.env.STRIPE_SMART_PRICE_ID!
        : process.env.STRIPE_ENTERPRISE_PRICE_ID!;
    if (!priceId) {
      console.error("POST - Missing priceId for plan:", plan);
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "Stripe 가격 ID가 설정되지 않았습니다."
              : "Stripe価格IDが設定されていません。",
        },
        { status: 500 }
      );
    }

    // 구독 생성
    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/plans/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/plans`,
    });

    console.log("sessionCheckout: ", sessionCheckout);

    // Prisma에 구독 정보 저장
    const statusMap: Record<string, "ACTIVE" | "CANCELED"> = {
      active: "ACTIVE",
      incomplete: "ACTIVE",
      canceled: "CANCELED",
    };
    const prismaStatus: "ACTIVE" | "CANCELED" | "UNPAID" =
      statusMap[sessionCheckout.status ?? ""] || "UNPAID";

    await prisma.subscription.create({
      data: {
        churchId: church.id,
        stripeCustomerId: customer.id,
        stripeCheckoutSessionId: sessionCheckout.id,
        plan,
        status: prismaStatus,
      },
    });

    return NextResponse.json({
      url: sessionCheckout.url,
    });
  } catch (error: unknown) {
    console.error("POST - Subscription creation error:", error);
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "구독 생성 중 오류가 발생했습니다."
            : "サブスクリプション作成中にエラーが発生しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  console.log("DELETE - Subscriptions API start");
  const locale = await getLocale();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("DELETE - Token received:", token);
    if (!token) {
      return NextResponse.json(
        {
          error:
            locale === "ko" ? "인증되지 않았습니다." : "認証されていません。",
        },
        { status: 401 }
      );
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
      console.log("DELETE - Token payload:", payload);
    } catch (error: unknown) {
      console.error("DELETE - Token verification error:", error);
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "유효하지 않은 토큰입니다."
              : "無効なトークンです。",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 401 }
      );
    }

    if (payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "SuperAdmin만 구독을 취소할 수 있습니다."
              : "SuperAdminのみがサブスクリプションをキャンセルできます。",
        },
        { status: 403 }
      );
    }

    if (!payload.churchId) {
      return NextResponse.json(
        {
          error:
            locale === "ko" ? "교회 ID가 없습니다." : "教会IDがありません。",
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { churchId: payload.churchId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }, // 최신 데이터 보장
    });
    console.log("DELETE - Subscription:", subscription);

    if (!subscription || !subscription.stripeSubscriptionId) {
      console.log("구독이 존재하지 않습니다.");
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "구독이 존재하지 않습니다."
              : "サブスクリプションが存在しません。",
        },
        { status: 404 }
      );
    }

    // stripeSubscriptionId는 Checkout 세션 ID임
    const subscriptionIdToCancel = subscription.stripeSubscriptionId;
    try {
      const subscriptionCanceled = await stripe.subscriptions.cancel(
        subscriptionIdToCancel
      );

      console.log("DELETE - subscriptionCanceled:", subscriptionCanceled);

      // Prisma의 stripeSubscriptionId를 실제 구독 ID로 업데이트
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionId: subscriptionIdToCancel,
          status: "CANCELED",
          plan: "FREE",
        },
      });
    } catch (error: unknown) {
      console.error("DELETE - Error retrieving checkout session:", error);
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "구독 취소 중 오류가 발생했습니다."
              : "サブスクリプションキャンセル中にエラーが発生しました。",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    console.log(
      "DELETE - Subscription canceled for churchId:",
      payload.churchId
    );
    return NextResponse.json({
      message:
        locale === "ko"
          ? "구독이 취소되었습니다."
          : "サブスクリプションがキャンセルされました。",
    });
  } catch (error: unknown) {
    console.error("DELETE - Subscription cancellation error:", error);
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "구독 취소 중 오류가 발생했습니다."
            : "サブスクリプションキャンセル中にエラーが発生しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
