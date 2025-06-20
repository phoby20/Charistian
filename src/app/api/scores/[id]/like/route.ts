// app/api/scores/[id]/like/route.ts
/** 악보 좋아요 API */

import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { allowedRoles } from "../../allowedRoles";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const score = await prisma.creation.findUnique({ where: { id: params.id } });
  if (!score || (!score.isPublic && score.churchId !== payload.churchId)) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const existingLike = await prisma.scoreLike.findUnique({
    where: {
      creationId_userId: { creationId: params.id, userId: payload.userId },
    },
  });

  if (existingLike) {
    await prisma.scoreLike.delete({ where: { id: existingLike.id } });
    return NextResponse.json({ message: "좋아요 취소" }, { status: 200 });
  } else {
    await prisma.scoreLike.create({
      data: { creationId: params.id, userId: payload.userId },
    });
    return NextResponse.json({ message: "좋아요 성공" }, { status: 201 });
  }
}
