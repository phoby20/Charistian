// src/app/api/set-church/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { generateToken, TokenPayload } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      userId,
      churchId,
      position,
    }: { userId: string; churchId: string; position: string } =
      await req.json();

    if (!userId || !churchId || !position) {
      return NextResponse.json(
        { error: "Missing userId, churchId, or position" },
        { status: 400 }
      );
    }

    console.log("position: ", position);

    // 교회 존재 확인
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });
    if (!church) {
      return NextResponse.json({ error: "Invalid churchId" }, { status: 400 });
    }

    // 사용자 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        churchId,
        position,
        country: church.country,
        city: church.city,
        region: church.region,
      },
    });

    const newToken = generateToken({
      userId: updatedUser.id, // userId로 변경하여 /api/duties와 일치
      churchId: updatedUser.churchId, // churchId 추가
      role: updatedUser.role,
    } as TokenPayload);

    const response = NextResponse.json({
      message: "Church and position updated successfully",
      user: updatedUser,
    });

    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 로컬에서는 Secure 비활성화
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: "/", // 모든 경로에서 쿠키 사용 가능
    });

    return response;
  } catch (error) {
    console.error("Error updating church and position:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
