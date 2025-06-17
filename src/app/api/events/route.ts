import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken, TokenPayload } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true,
      churchId: true,
      groups: { select: { id: true } },
      subGroups: { select: { id: true } },
      teams: { select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { churchId: user.churchId ?? "" },
        { groupId: { in: user.groups.map((g) => g.id) } },
        { subGroupId: { in: user.subGroups.map((sg) => sg.id) } },
        { teamId: { in: user.teams.map((t) => t.id) } },
      ],
      roles: { has: user.role },
    },
    include: {
      church: true,
      group: true,
      subGroup: true,
      team: true,
      creator: true,
      attendees: { include: { user: true } },
    },
  });

  return NextResponse.json(events);
}

/**
 * 일정 추가
 * @param req
 * @returns
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      role: true,
      churchId: true,
      groups: { select: { id: true } },
      subGroups: { select: { id: true } },
    },
  });

  if (
    !user ||
    !["ADMIN", "SUB_ADMIN", "SUPER_ADMIN", "GENERAL"].includes(user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const {
    title,
    description,
    startDate,
    endDate,
    churchId,
    teamId,
    roles,
    status,
    recurrence,
    notifyBefore,
    label,
  } = await req.json();

  if (
    !title ||
    !startDate ||
    !endDate ||
    !churchId ||
    !roles ||
    roles.length === 0
  ) {
    return NextResponse.json(
      { error: "필수 필드가 누락되었습니다." },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      churchId,
      groupId: user.groups[0]?.id ?? null, // 클라이언트에서 제공된 값 사용
      subGroupId: user.subGroups[0]?.id ?? null, // 클라이언트에서 제공된 값 사용
      teamId,
      roles,
      status: status || "SCHEDULED",
      recurrence,
      notifyBefore,
      label, // 스키마에 추가된 필드
      creatorId: payload.userId,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (
    !user ||
    !["ADMIN", "SUB_ADMIN", "SUPER_ADMIN", "GENERAL"].includes(user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const {
    id,
    title,
    description,
    startDate,
    endDate,
    churchId,
    groupId,
    subGroupId,
    teamId,
    roles,
    status,
    recurrence,
    notifyBefore,
    label,
  } = await req.json();

  const event = await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      churchId,
      groupId,
      subGroupId,
      teamId,
      roles,
      status,
      recurrence,
      notifyBefore,
      label,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (
    !user ||
    !["ADMIN", "SUB_ADMIN", "SUPER_ADMIN", "GENERAL"].includes(user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await req.json();

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ message: "일정이 삭제되었습니다." });
}

export async function POST_ATTENDANCE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  const { eventId } = await req.json();

  const eventAttendance = await prisma.eventAttendance.create({
    data: {
      eventId,
      userId: payload.userId,
    },
  });

  return NextResponse.json(eventAttendance, { status: 201 });
}
