// src/app/api/members/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: {
        state: { not: "PENDING" }, // Exclude pending users
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kakaoId: true,
        lineId: true,
        country: true,
        city: true,
        region: true,
        address: true,
        birthDate: true,
        gender: true,
        profileImage: true,
        churchId: true,
        position: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
