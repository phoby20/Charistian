// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

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

    // Role 변경 권한 정의
    const allowedRoles: { [key: string]: string[] } = {
      MASTER: [
        "MASTER",
        "SUPER_ADMIN",
        "SUB_ADMIN",
        "ADMIN",
        "GENERAL",
        "VISITOR",
      ],
      SUPER_ADMIN: ["SUB_ADMIN", "ADMIN", "GENERAL", "VISITOR"],
      SUB_ADMIN: ["ADMIN", "GENERAL", "VISITOR"],
      ADMIN: ["GENERAL", "VISITOR"],
      GENERAL: [],
      VISITOR: [],
    };

    // 현재 사용자의 Role이 허용된 Role 변경 권한이 있는지 확인
    if (
      !allowedRoles[decoded.role] ||
      allowedRoles[decoded.role].length === 0
    ) {
      return NextResponse.json(
        { error: "Role 변경 권한이 없습니다." },
        { status: 403 }
      );
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
      groupId,
      subGroupId,
      dutyIds,
      teamIds,
      role,
    } = data;

    // 필수 필드 검증 (role 추가)
    if (!name || !email || !birthDate || !gender || !role) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 요청된 Role이 현재 사용자의 권한 내에 있는지 검증
    if (role && !allowedRoles[decoded.role].includes(role)) {
      return NextResponse.json(
        { error: `허용되지 않은 Role: ${role}` },
        { status: 403 }
      );
    }

    // 유효한 Role 값인지 검증
    const validRoles = [
      "MASTER",
      "SUPER_ADMIN",
      "SUB_ADMIN",
      "ADMIN",
      "GENERAL",
      "VISITOR",
    ] as const;

    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "유효하지 않은 Role 값입니다." },
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
        birthDate: new Date(birthDate),
        gender,
        position: positionId,
        role: role as Role, // Role 업데이트 (Prisma Enum 처리)
        groups: groupId
          ? {
              set: [{ id: groupId }],
            }
          : { set: [] },
        subGroups: subGroupId
          ? {
              set: [{ id: subGroupId }],
            }
          : { set: [] },
        duties: dutyIds
          ? {
              set: dutyIds.map((dutyId: string) => ({ id: dutyId })),
            }
          : { set: [] },
        teams: teamIds
          ? {
              set: teamIds.map((teamId: string) => ({ id: teamId })),
            }
          : { set: [] },
      },
      include: {
        groups: { select: { id: true, name: true } },
        subGroups: { select: { id: true, name: true, groupId: true } },
        duties: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
      },
    });

    let position: { id: string; name: string } | null = null;
    if (updatedUser.position) {
      const positionData = await prisma.churchPosition.findUnique({
        where: { id: updatedUser.position },
        select: { id: true, name: true },
      });
      position = positionData ? positionData : null;
    }

    const formattedUser = {
      ...updatedUser,
      birthDate: updatedUser.birthDate.toISOString(),
      createdAt: updatedUser.createdAt.toISOString(),
      group: updatedUser.groups[0] || null,
      subGroup: updatedUser.subGroups[0] || null,
      duties: updatedUser.duties,
      teams: updatedUser.teams,
      position: position,
      role: updatedUser.role, // role 필드 포함
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("사용자 업데이트 오류:", error);
    return NextResponse.json(
      { error: "사용자 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}
