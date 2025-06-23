// app/api/scores/[id]/comment/[commentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { allowedRoles } from "../../../allowedRoles";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
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

  const { id, commentId } = await context.params;

  // 악보 존재 여부 확인
  const score = await prisma.creation.findUnique({ where: { id } });
  if (!score || (!score.isPublic && score.churchId !== payload.churchId)) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 댓글 존재 여부 및 권한 확인
  const comment = await prisma.scoreComment.findUnique({
    where: { id: commentId },
    select: { userId: true, creationId: true },
  });

  if (!comment) {
    return NextResponse.json(
      { error: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (comment.creationId !== id) {
    return NextResponse.json(
      { error: "해당 악보의 댓글이 아닙니다." },
      { status: 400 }
    );
  }

  if (
    comment.userId !== payload.userId &&
    payload.role !== "ADMIN" &&
    payload.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "댓글을 삭제할 권한이 없습니다." },
      { status: 403 }
    );
  }

  await prisma.scoreComment.delete({
    where: { id: commentId },
  });

  return NextResponse.json(
    { message: "댓글이 삭제되었습니다." },
    { status: 200 }
  );
}
