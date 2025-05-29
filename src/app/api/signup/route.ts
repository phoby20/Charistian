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
      phone: formData.get("phone") as string,
      kakaoId: formData.get("kakaoId") as string,
      lineId: formData.get("lineId") as string,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string,
      country: formData.get("country") as string,
      region: formData.get("region") as string,
      churchId: formData.get("churchId") as string,
      position: formData.get("position") as string,
      groupId: formData.get("groupId") as string,
      profileImage: undefined as string | undefined,
    };

    const profileImage = formData.get("profileImage") as File;
    if (profileImage) {
      data.profileImage = await uploadFile(
        profileImage,
        `profile_${data.email}.jpg`
      );
    }

    await prisma.user.create({
      data: {
        ...data,
        role: "GENERAL",
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
