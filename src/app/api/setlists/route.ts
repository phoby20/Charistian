// src/app/api/setlists/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Prisma 네임스페이스에서 타입 가져오기

// 요청 바디의 타입 정의
interface CreateSetlistRequest {
  title: string;
  date: string; // ISO 형식 문자열 (예: "2025-06-24T00:00:00.000Z")
  description?: string;
  scores: Array<{
    creationId: string;
    order: number;
  }>;
  shares: Array<{
    groupId?: string | null;
    teamId?: string | null;
    userId?: string | null;
  }>;
}

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

  const setlists = await prisma.setlist.findMany({
    where: {
      OR: [
        { creatorId: payload.userId },
        { shares: { some: { userId: payload.userId } } },
        {
          shares: {
            some: { groupId: { in: await getUserGroupIds(payload.userId) } },
          },
        },
        {
          shares: {
            some: { teamId: { in: await getUserTeamIds(payload.userId) } },
          },
        },
      ],
    },
    include: {
      creator: { select: { name: true, id: true } },
      church: { select: { name: true } },
      shares: {
        include: {
          group: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(setlists, { status: 200 });
}

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

  // churchId가 undefined인 경우 에러 처리
  if (!payload.churchId) {
    return NextResponse.json(
      { error: "churchId가 필요합니다." },
      { status: 400 }
    );
  }

  const { title, date, description, scores, shares }: CreateSetlistRequest =
    await req.json();

  // 입력 데이터 유효성 검사
  if (!title || !date) {
    return NextResponse.json(
      { error: "title과 date는 필수입니다." },
      { status: 400 }
    );
  }

  // scores와 shares의 기본 유효성 검사
  if (!Array.isArray(scores) || !Array.isArray(shares)) {
    return NextResponse.json(
      { error: "scores와 shares는 배열이어야 합니다." },
      { status: 400 }
    );
  }

  try {
    const setlist = await prisma.setlist.create({
      data: {
        title,
        date: new Date(date), // ISO 문자열을 Date 객체로 변환
        description,
        creator: {
          connect: { id: payload.userId }, // creator 관계 연결
        },
        church: {
          connect: { id: payload.churchId }, // church 관계 연결
        },
        scores: {
          create: scores.map((score) => ({
            creationId: score.creationId,
            order: score.order,
          })),
        },
        shares: {
          create: shares.map((share) => ({
            groupId: share.groupId ?? null,
            teamId: share.teamId ?? null,
            userId: share.userId ?? null,
          })),
        },
      } as Prisma.SetlistCreateInput, // 명시적 타입 캐스팅
    });
    return NextResponse.json(setlist, { status: 201 });
  } catch (error: unknown) {
    console.error("세트리스트 생성 오류:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "세트리스트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function getUserGroupIds(userId: string): Promise<string[]> {
  const groups = await prisma.group.findMany({
    where: { users: { some: { id: userId } } },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}

async function getUserTeamIds(userId: string): Promise<string[]> {
  const teams = await prisma.team.findMany({
    where: { users: { some: { id: userId } } },
    select: { id: true },
  });
  return teams.map((t) => t.id);
}
