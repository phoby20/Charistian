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
        groups: {
          select: {
            id: true,
            name: true,
          },
        },
        subGroups: {
          select: {
            id: true,
            name: true,
            groupId: true,
          },
        },
        duties: {
          select: {
            id: true,
            name: true,
          },
        },
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
          ...user,
          profileImage: user.profileImage,
          position, // position name
          group: user.groups[0] || null, // 단일 그룹
          subGroup: user.subGroups[0] || null, // 단일 서브그룹
          duties: user.duties || [], // 빈 배열로 대체
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
