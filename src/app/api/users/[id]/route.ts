import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { uploadFile } from "@/lib/vercelBlob";
import { Position } from "@/types/customUser";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, name: true, churchId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
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
        role: Role; // Role enum 사용
      };
    } catch (err) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다.", err },
        { status: 401 }
      );
    }

    // Role 변경 권한 정의
    const allowedRoles: { [key in Role]: Role[] } = {
      [Role.MASTER]: [
        Role.MASTER,
        Role.SUPER_ADMIN,
        Role.SUB_ADMIN,
        Role.ADMIN,
        Role.GENERAL,
        Role.VISITOR,
        Role.CHECKER,
      ],
      [Role.SUPER_ADMIN]: [
        Role.SUB_ADMIN,
        Role.ADMIN,
        Role.GENERAL,
        Role.VISITOR,
        Role.CHECKER,
      ],
      [Role.ADMIN]: [Role.SUB_ADMIN, Role.GENERAL, Role.VISITOR, Role.CHECKER],
      [Role.SUB_ADMIN]: [Role.GENERAL, Role.VISITOR, Role.CHECKER],
      [Role.GENERAL]: [],
      [Role.VISITOR]: [],
      [Role.CHECKER]: [],
    };

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
    const formData = await req.formData();
    // FormData에서 데이터 추출
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const birthDate = formData.get("birthDate") as string;
    const phone = formData.get("phone") as string | null;
    const kakaoId = formData.get("kakaoId") as string | null;
    const lineId = formData.get("lineId") as string | null;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string | null;
    const country = formData.get("country") as string | null;
    const city = formData.get("city") as string | null;
    const region = formData.get("region") as string | null;
    const positionId = formData.get("positionId") as string | null;
    const groupId = formData.get("groupId") as string | null;
    const subGroupId = formData.get("subGroupId") as string | null;
    const role = formData.get("role") as Role;
    const profileImage = formData.get("profileImage") as File | null;
    const profileImageUrl = formData.get("profileImageUrl") as string | null;

    // dutyIds와 teamIds 파싱
    const dutyIdsRaw = formData.get("dutyIds") as string;
    const teamIdsRaw = formData.get("teamIds") as string;
    let dutyIds: string[] = [];
    let teamIds: string[] = [];
    try {
      if (dutyIdsRaw) dutyIds = JSON.parse(dutyIdsRaw);
      if (teamIdsRaw) teamIds = JSON.parse(teamIdsRaw);
    } catch (err) {
      return NextResponse.json(
        { error: "dutyIds 또는 teamIds 파싱 오류입니다.", err },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!name || !email || !birthDate || !gender || !role) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Role이 제공된 경우, 요청된 Role이 현재 사용자의 권한 내에 있는지 검증
    if (role && !allowedRoles[decoded.role].includes(role)) {
      return NextResponse.json(
        { error: `허용되지 않은 Role: ${role}` },
        { status: 403 }
      );
    }

    let profileImagePath: string | null = profileImageUrl; // 기존 URL을 기본값으로 설정

    if (profileImage && profileImage.size > 0) {
      profileImagePath = await uploadFile(
        profileImage,
        `profile_${email}_${Date.now()}.jpg`
      );
    }

    console.log("profileImagePath:", profileImagePath);
    console.log("id:", id);

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
        profileImage: profileImagePath,
        role: role,
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

    let position: Position | null = null;
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
      role: updatedUser.role,
      profileImage: updatedUser.profileImage || undefined,
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
