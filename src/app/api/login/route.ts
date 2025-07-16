// src/app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import { generateToken, TokenPayload } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.error(`User not found: ${normalizedEmail}`);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error(`Password mismatch for user: ${normalizedEmail}`);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 이메일 인증이 완료되지 않은 사용자는 로그인하지 못하도록 한다
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified; 이메일 인증" },
        { status: 403 }
      );
    }

    const token = generateToken({
      userId: user.id, // userId로 변경하여 /api/duties와 일치
      churchId: user.churchId, // churchId 추가
      role: user.role,
    } as TokenPayload);

    console.log(`Generated token for user ${user.id}: ${token}`); // 디버깅 로그

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        churchId: user.churchId,
      }, // 클라이언트에 사용자 정보 반환
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 로컬에서는 Secure 비활성화
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: "/", // 모든 경로에서 쿠키 사용 가능
    });

    console.log(`Set auth_token cookie for user ${user.id}`); // 디버깅 로그

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
