// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import { uploadFile } from "@/lib/vercelBlob";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = {
      email: formData.get("email") as string,
      password: await bcrypt.hash(formData.get("password") as string, 10),
      name: formData.get("name") as string,
      birthDate: new Date(formData.get("birthDate") as string),
      phone: formData.get("phone") as string | undefined,
      kakaoId: formData.get("kakaoId") as string | undefined,
      lineId: formData.get("lineId") as string | undefined,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string | undefined,
      country: formData.get("country") as string,
      city: formData.get("city") as string,
      region: formData.get("region") as string,
      churchId: formData.get("churchId") as string,
      position: formData.get("position") as string,
      profileImage: undefined as string | undefined,
    };

    // 필수 필드 확인
    const missingFields = [];
    if (!data.email) missingFields.push("email");
    if (!data.password) missingFields.push("password");
    if (!data.name) missingFields.push("name");
    if (!data.birthDate) missingFields.push("birthDate");
    if (!data.gender) missingFields.push("gender");
    if (!data.country) missingFields.push("country");
    if (!data.city) missingFields.push("city");
    if (!data.region) missingFields.push("region");
    if (!data.position) missingFields.push("position");
    if (!data.churchId) missingFields.push("churchId");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "EmailAlreadyExists" },
        { status: 400 }
      );
    }

    // 교회 존재 확인
    const churchExists = await prisma.church.findUnique({
      where: { id: data.churchId },
    });
    if (!churchExists) {
      return NextResponse.json(
        { error: "Invalid church selected" },
        { status: 400 }
      );
    }

    // 인증 토큰 생성
    const verificationToken = uuidv4();

    // 프로필 이미지 업로드
    const profileImage = formData.get("profileImage") as File;
    if (profileImage && profileImage.size > 0) {
      data.profileImage = await uploadFile(
        profileImage,
        `profile_${data.email}_${Date.now()}.jpg`,
        "profile-images"
      );
    }

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        name: data.name,
        birthDate: data.birthDate,
        phone: data.phone || null,
        kakaoId: data.kakaoId || null,
        lineId: data.lineId || null,
        gender: data.gender,
        address: data.address || null,
        country: data.country,
        city: data.city,
        region: data.region,
        churchId: data.churchId,
        profileImage: data.profileImage || null,
        position: data.position,
        role: "GENERAL",
        state: "PENDING",
        emailVerificationToken: verificationToken,
        emailVerified: false,
      },
    });

    // Resend로 인증 이메일 전송
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}`;
    await resend.emails.send({
      from: `${process.env.RESEND_FROM}`, // Resend 대시보드에서 설정한 도메인
      to: data.email,
      subject: "이메일 인증을 완료해 주세요",
      html: `
        <h1>이메일 인증</h1>
        <p>아래 링크를 클릭하여 이메일 인증을 완료해 주세요:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>링크는 24시간 동안 유효합니다.</p>
      `,
    });

    return NextResponse.json(
      {
        message: "User created successfully. Please verify your email.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
