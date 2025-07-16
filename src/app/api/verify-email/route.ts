import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const locale = req.nextUrl.searchParams.get("locale") || "ko"; // 기본 로케일은 'ko'

  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // 사용자 상태를 PENDING로 변경하고 토큰 제거
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        state: "PENDING",
      },
    });

    // 로케일 포함 리다이렉트
    return NextResponse.redirect(
      new URL(`/${locale}/verify/complete`, process.env.NEXT_PUBLIC_APP_URL)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
