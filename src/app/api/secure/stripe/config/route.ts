// src/app/api/secure/stripe/config/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("GET - Stripe config API start"); // 디버깅 로그
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("GET - Stripe publishable key not found");
      return NextResponse.json(
        { error: "Stripe 설정 오류: 공개 키가 없습니다." },
        { status: 500 }
      );
    }
    return NextResponse.json({ publishableKey });
  } catch (error) {
    console.error("GET - Stripe config error:", error);
    return NextResponse.json(
      { error: "Stripe 설정을 가져오지 못했습니다." },
      { status: 500 }
    );
  }
}
