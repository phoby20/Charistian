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

    // positionId를 기반으로 position 객체 생성
    const newPendingUsers = await Promise.all(
      members.map(async (user) => {
        let position: { id: string; name: string } | null = null;
        if (user.position) {
          const positionData = await prisma.churchPosition.findUnique({
            where: { id: user.position },
            select: { id: true, name: true },
          });
          position = positionData ? positionData : null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          kakaoId: user.kakaoId,
          lineId: user.lineId,
          country: user.country,
          city: user.city,
          region: user.region,
          address: user.address,
          birthDate: user.birthDate,
          gender: user.gender,
          profileImage: user.profileImage,
          churchId: user.churchId,
          position, // position name
          createdAt: user.createdAt,
        };
      })
    );
    return NextResponse.json({ members: newPendingUsers });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
