// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt";
import { uploadFile } from "@/lib/vercelBlob";

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

    const profileImage = (await formData.get("profileImage")) as File;
    if (profileImage && profileImage.size > 0) {
      data.profileImage = await uploadFile(
        profileImage,
        `profile_${data.email}_${Date.now()}.jpg`,
        "profile-images"
      );
    }

    await prisma.user.create({
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
      },
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
