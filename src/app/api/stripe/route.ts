// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

// 환경 변수에서 Stripe 비밀 키 확인
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // 최신 API 버전 사용
});

// 입력 데이터 스키마 정의
const checkoutSchema = z.object({
  churchId: z.string().uuid(),
  plan: z.enum(["SMART", "ENTERPRISE"]),
});

export async function POST(req: NextRequest) {
  try {
    // 입력 데이터 파싱 및 유효성 검증
    const { churchId, plan } = checkoutSchema.parse(await req.json());

    // 가격 ID 설정 (Stripe 대시보드에서 확인)
    const priceId =
      plan === "SMART"
        ? process.env.STRIPE_SMART_PLAN_PRICE_ID!
        : process.env.STRIPE_ENTERPRISE_PLAN_PRICE_ID!;

    // Stripe 체크아웃 세션 생성
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
      metadata: { churchId },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "잘못된 입력 데이터", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
