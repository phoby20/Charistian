import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // JWT 토큰 디코딩
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userId = decoded.userId as string;
    console.log("Decoded JWT Payload:", decoded);

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("input email:", email);

    if (email.endsWith("@kakao.com")) {
      return NextResponse.json(
        { error: "Cannot use another @kakao.com email" },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // 인증 토큰 생성
    const verificationToken = uuidv4();

    // 사용자 정보 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: email.toLowerCase(),
        emailVerificationToken: verificationToken,
        emailVerified: false,
      },
    });

    // Resend로 인증 이메일 전송
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email/confirm?token=${verificationToken}`;
    await resend.emails.send({
      from: `${process.env.RESEND_FROM}`,
      to: email,
      subject: "이메일 인증을 완료해 주세요",
      html: `
        <h1>이메일 인증</h1>
        <p>아래 링크를 클릭하여 이메일 인증을 완료해 주세요:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>링크는 24시간 동안 유효합니다.</p>
      `,
    });

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
