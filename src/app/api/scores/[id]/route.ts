// src/app/api/scores/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { allowedRoles } from "../allowedRoles";
import { getLocalIpAddress } from "@/utils/getLocalIpAddress";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  if (!allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;

  const score = await prisma.creation.findUnique({
    where: { id: id, isOpen: true },
    include: {
      creator: { select: { name: true } },
      likes: { where: { userId: payload.userId }, select: { id: true } },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!score || (!score.isPublic && score.churchId !== payload.churchId)) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const ip = getLocalIpAddress();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ip}:3001`;

  // 현재 사용자가 좋아요했는지 여부 추가
  const isLiked = score.likes.length > 0;

  return NextResponse.json(
    {
      ...score,
      isLiked, // 현재 사용자의 좋아요 여부
      appUrl,
    },
    { status: 200 }
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;

  const score = await prisma.creation.findUnique({
    where: { id },
    select: { creatorId: true, churchId: true, isOpen: true },
  });

  if (!score) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 작성자 또는 SUPER_ADMIN, ADMIN만 수정 가능
  const isAuthorized =
    payload.userId === score.creatorId ||
    ["SUPER_ADMIN", "ADMIN"].includes(payload.role);

  if (!isAuthorized) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!score.isOpen) {
    return NextResponse.json(
      { error: "이미 비공개된 악보입니다." },
      { status: 400 }
    );
  }

  try {
    const updatedScore = await prisma.creation.update({
      where: { id },
      data: { isOpen: false },
      include: {
        creator: { select: { name: true } },
        likes: { where: { userId: payload.userId }, select: { id: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const isLiked = updatedScore.likes.length > 0;

    return NextResponse.json(
      {
        ...updatedScore,
        isLiked,
        message: "악보가 성공적으로 비공개 처리되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("악보 비공개 처리 오류:", error);
    return NextResponse.json(
      { error: "악보 비공개 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
