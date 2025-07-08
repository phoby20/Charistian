// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { uploadFile } from "@/lib/vercelBlob";
import * as bcrypt from "bcrypt";

// GET 핸들러는 그대로 유지
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        churchId: true,
        church: {
          select: {
            id: true,
            name: true,
            subscriptions: {
              select: {
                plan: true,
              },
              take: 1, // 가장 최근 구독 정보 가져오기
              orderBy: { createdAt: "desc" },
            },
          },
        },
        profileImage: true,
        birthDate: true,
        phone: true,
        kakaoId: true,
        lineId: true,
        gender: true,
        address: true,
        country: true,
        city: true,
        region: true,
        position: true,
        groups: { select: { id: true, name: true } },
        subGroups: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
        duties: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // 토큰 추출 및 검증
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    const userId = payload.userId;

    // 기존 사용자 정보 조회
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        phone: true,
        kakaoId: true,
        lineId: true,
        gender: true,
        address: true,
        country: true,
        city: true,
        region: true,
        position: true,
        profileImage: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const passwordInput = formData.get("password") as string | null;

    // FormData에서 받은 데이터
    const inputData = {
      email: formData.get("email") as string,
      password: passwordInput
        ? await bcrypt.hash(passwordInput, 10)
        : undefined,
      name: formData.get("name") as string,
      birthDate: formData.get("birthDate")
        ? new Date(formData.get("birthDate") as string)
        : undefined,
      phone: formData.get("phone") as string | undefined,
      kakaoId: formData.get("kakaoId") as string | undefined,
      lineId: formData.get("lineId") as string | undefined,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string | undefined,
      country: formData.get("country") as string,
      city: formData.get("city") as string,
      region: formData.get("region") as string,
      position: formData.get("position") as string,
      profileImage: undefined as string | undefined,
    };

    // 필수 필드 확인
    const missingFields = [];
    if (!inputData.email) missingFields.push("email");
    if (!inputData.name) missingFields.push("name");
    if (!inputData.birthDate) missingFields.push("birthDate");
    if (!inputData.gender) missingFields.push("gender");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // 이메일 중복 확인 (본인 제외)
    const emailDuplicate = await prisma.user.findFirst({
      where: {
        email: inputData.email.toLowerCase(),
        id: { not: userId },
      },
    });
    if (emailDuplicate) {
      return NextResponse.json(
        { error: "EmailAlreadyExists" },
        { status: 400 }
      );
    }

    // 프로필 이미지 처리
    const profileImage = formData.get("profileImage") as File;
    if (profileImage && profileImage.size > 0) {
      inputData.profileImage = await uploadFile(
        profileImage,
        `profile_${inputData.email}_${Date.now()}.jpg`,
        "profile-images"
      );
    }

    // 변경된 필드만 추출
    const updateData: Partial<typeof inputData> = {};
    if (inputData.email.toLowerCase() !== existingUser.email.toLowerCase()) {
      updateData.email = inputData.email.toLowerCase();
    }
    if (inputData.password) {
      updateData.password = inputData.password;
    }
    if (inputData.name !== existingUser.name) {
      updateData.name = inputData.name;
    }
    if (
      inputData.birthDate &&
      (!existingUser.birthDate ||
        inputData.birthDate.getTime() !==
          new Date(existingUser.birthDate).getTime())
    ) {
      updateData.birthDate = inputData.birthDate;
    }
    if (inputData.phone !== (existingUser.phone || undefined)) {
      updateData.phone = inputData.phone || undefined;
    }
    if (inputData.kakaoId !== (existingUser.kakaoId || undefined)) {
      updateData.kakaoId = inputData.kakaoId || undefined;
    }
    if (inputData.lineId !== (existingUser.lineId || undefined)) {
      updateData.lineId = inputData.lineId || undefined;
    }
    if (inputData.gender !== existingUser.gender) {
      updateData.gender = inputData.gender;
    }
    if (inputData.address !== (existingUser.address || undefined)) {
      updateData.address = inputData.address || undefined;
    }
    if (inputData.country !== existingUser.country) {
      updateData.country = inputData.country;
    }
    if (inputData.city !== existingUser.city) {
      updateData.city = inputData.city;
    }
    if (inputData.region !== existingUser.region) {
      updateData.region = inputData.region;
    }
    if (inputData.position !== existingUser.position) {
      updateData.position = inputData.position;
    }
    if (
      inputData.profileImage &&
      inputData.profileImage !== existingUser.profileImage
    ) {
      updateData.profileImage = inputData.profileImage || undefined;
    }

    // 변경사항 없으면 업데이트 생략
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No changes to update" },
        { status: 200 }
      );
    }

    // 사용자 정보 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
