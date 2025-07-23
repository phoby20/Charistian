// src/app/api/auth/kakao/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import { generateToken, TokenPayload } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code missing" },
        { status: 400 }
      );
    }

    // 카카오 액세스 토큰 요청
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // 카카오 사용자 정보 요청
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoUser = await userResponse.json();
    console.log("kakaoUser:", kakaoUser);

    const kakaoId = kakaoUser.id.toString();
    const email = kakaoUser.kakao_account?.email;
    const name = kakaoUser.properties?.nickname || "Kakao User";
    const profileImage = kakaoUser.properties?.profile_image || null;

    // 사용자 조회
    let user = await prisma.user.findUnique({
      where: { kakaoId }, // kakaoId에 @unique가 있다고 가정
    });

    // 이메일로 추가 조회
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        // 기존 이메일이 존재하면 kakaoId 업데이트
        user = await prisma.user.update({
          where: { email },
          data: { kakaoId },
        });
      }
    }

    // 사용자가 없으면 회원가입
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || `${kakaoId}@kakao.com`,
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
          name,
          birthDate: new Date(),
          gender: "Unknown",
          country: null,
          city: null,
          region: null,
          churchId: null, // churchId를 null로 설정
          position: null,
          profileImage,
          kakaoId,
          role: "GENERAL",
          state: "APPROVED",
          emailVerified: false,
        },
      });
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      churchId: user.churchId, // null일 수 있음
      role: user.role,
    } as TokenPayload);

    // 기본 로케일 설정 및 절대 URL로 리다이렉트
    const locale = req.nextUrl.locale || "ko"; // 기본 로케일: 'ko'
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://192.168.0.149:3001"; // 환경 변수에서 도메인 가져오기
    const redirectUrl = `${baseUrl}/${locale}/dashboard`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Kakao login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
