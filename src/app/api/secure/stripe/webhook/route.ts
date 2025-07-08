// src/app/api/secure/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil", // 요청된 API 버전 유지
});

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    console.log("Webhook - Stripe signature:", sig); // 디버깅 로그
    if (!sig) {
      return NextResponse.json(
        { error: "Stripe 서명이 없습니다." },
        { status: 400 }
      );
    }

    const body = await req.text();
    console.log("Webhook - Request body received"); // 디버깅 로그
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("Webhook - Event type:", event.type); // 디버깅 로그

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Webhook - Subscription ID:", subscription.id); // 디버깅 로그

      // stripeSubscriptionId로 레코드 조회
      const subscriptionRecord = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      console.log("Webhook - Subscription record:", subscriptionRecord); // 디버깅 로그

      if (!subscriptionRecord) {
        console.error(
          "Webhook - Subscription not found for stripeSubscriptionId:",
          subscription.id
        );
        return NextResponse.json(
          { error: "구독 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // subscriptionRecord.id로 업데이트
      await prisma.subscription.update({
        where: { id: subscriptionRecord.id },
        data: {
          status: subscription.status.toUpperCase() as
            | "ACTIVE"
            | "CANCELED"
            | "PAST_DUE"
            | "UNPAID",
          plan: subscription.status === "canceled" ? "FREE" : undefined,
        },
      });
      console.log(
        "Webhook - Subscription updated for ID:",
        subscriptionRecord.id
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
