// src/pages/api/church/verify-email.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface VerifyEmailRequest {
  email: string;
  code: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = (await req.json()) as VerifyEmailRequest;

    if (!email || !code) {
      return NextResponse.json(
        { error: "이메일과 인증번호가 필요합니다." },
        { status: 400 }
      );
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "해당 이메일로 발송된 인증번호가 없습니다." },
        { status: 404 }
      );
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "인증번호가 만료되었습니다." },
        { status: 400 }
      );
    }

    if (verification.verificationCode !== code) {
      return NextResponse.json(
        { error: "잘못된 인증번호입니다." },
        { status: 400 }
      );
    }

    // 인증 성공 시 EmailVerification 레코드 삭제 (선택 사항)
    await prisma.emailVerification.delete({
      where: { email },
    });

    return NextResponse.json(
      { message: "이메일 인증이 완료되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("이메일 인증 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
