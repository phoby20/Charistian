// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "인증 토큰이 없습니다." },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
    } catch (err) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다.", err },
        { status: 401 }
      );
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const {
      name,
      email,
      phone,
      kakaoId,
      lineId,
      country,
      city,
      region,
      address,
      birthDate,
      gender,
      positionId,
    } = data;

    if (!name || !email || !birthDate || !gender) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        kakaoId: kakaoId || null,
        lineId: lineId || null,
        country: country || null,
        city: city || null,
        region: region || null,
        address: address || null,
        birthDate: new Date(birthDate), // YYYY-MM-DD 또는 ISO 문자열 처리
        gender,
        position: positionId,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("사용자 업데이트 오류:", error);
    return NextResponse.json(
      { error: "사용자 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}
