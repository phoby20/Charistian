// src/app/api/secure/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getLocale } from "next-intl/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: Request) {
  console.log("Webhook - Start");
  const locale = await getLocale();
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Webhook - Missing stripe-signature header");
      return NextResponse.json(
        {
          error:
            locale === "ko"
              ? "Stripe 서명이 누락되었습니다."
              : "Stripe署名がありません。",
        },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string | null;
      const checkoutSessionId = session.id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      if (!subscriptionId || !customerId) {
        console.warn("Webhook - Missing subscription or customer ID:", {
          subscriptionId,
          customerId,
        });
        return NextResponse.json(
          {
            error:
              locale === "ko"
                ? "구독 또는 고객 ID가 누락되었습니다."
                : "サブスクリプションまたは顧客IDがありません。",
          },
          { status: 400 }
        );
      }

      const subscriptionRecord = await prisma.subscription.findFirst({
        where: { stripeCheckoutSessionId: checkoutSessionId },
      });

      if (subscriptionRecord) {
        if (subscriptionRecord.stripeSubscriptionId) {
          console.log("Webhook - Subscription already updated:", {
            checkoutSessionId,
            subscriptionId: subscriptionRecord.stripeSubscriptionId,
          });
          return NextResponse.json({ received: true });
        }

        const statusMap: Record<
          string,
          "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID"
        > = {
          active: "ACTIVE",
          incomplete: "ACTIVE",
          canceled: "CANCELED",
          past_due: "PAST_DUE",
          unpaid: "UNPAID",
        };
        const stripeSubscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const prismaStatus: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" =
          statusMap[stripeSubscription.status] || "UNPAID";

        await prisma.subscription.update({
          where: { id: subscriptionRecord.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: prismaStatus,
          },
        });
        console.log("Webhook - Updated subscription:", {
          checkoutSessionId,
          subscriptionId,
          status: prismaStatus,
        });
      } else {
        console.warn(
          "Webhook - No subscription found for checkout session:",
          checkoutSessionId
        );
        return NextResponse.json(
          {
            error:
              locale === "ko"
                ? "해당 세션에 대한 구독이 없습니다."
                : "該当セッションに対するサブスクリプションがありません。",
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook - Error:", error);
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "웹훅 처리 중 오류가 발생했습니다."
            : "ウェブフック処理中にエラーが発生しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
