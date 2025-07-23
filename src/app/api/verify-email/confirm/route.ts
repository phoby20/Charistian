import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = req.nextUrl.searchParams.get("locale") || "ko"; // 기본 로케일은 'ko'
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // 이메일 인증 완료
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null, // 토큰 제거
      },
    });

    // 인증 완료 후 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
