// src/app/api/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pendingChurches = await prisma.churchApplication.findMany({
      where: { state: "PENDING" },
      select: {
        id: true,
        churchName: true,
        address: true,
        country: true,
        city: true,
        region: true,
        contactName: true,
        contactPhone: true,
        plan: true,
        buildingImage: true,
      },
    });

    const pendingUsers = await prisma.user.findMany({
      where: { state: "PENDING" },
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
        position: true, // positionId 필드 사용
        createdAt: true,
      },
    });

    // positionId를 기반으로 position 객체 생성
    const newPendingUsers = await Promise.all(
      pendingUsers.map(async (user) => {
        let position = null;
        if (user.position) {
          const positionData = await prisma.churchPosition.findUnique({
            where: { id: user.position },
            select: { name: true },
          });
          position = positionData ? positionData.name : "Unknown Position";
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

    return NextResponse.json(
      { pendingChurches, pendingUsers: newPendingUsers },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
