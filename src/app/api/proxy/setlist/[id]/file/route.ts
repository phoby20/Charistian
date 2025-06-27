// src/app/api/proxy/setlist/[id]/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/authenticateRequest";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/utils/handleApiError";

async function checkAccess(
  userId: string,
  setlistId: string
): Promise<boolean> {
  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
    include: {
      creator: { select: { id: true } },
      shares: {
        include: {
          group: { include: { users: { where: { id: userId } } } },
          team: { include: { users: { where: { id: userId } } } },
          user: { where: { id: userId } },
        },
      },
    },
  });

  if (!setlist) return false;
  if (setlist.creator.id === userId) return true;

  return setlist.shares.some((share) => {
    return (
      share.userId === userId ||
      (share.group?.users?.length ?? 0) > 0 ||
      (share.team?.users?.length ?? 0) > 0
    );
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 인증 확인
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { id } = await context.params;

  try {
    // 세트리스트 조회
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      select: { fileUrl: true, creatorId: true },
    });

    if (!setlist || !setlist.fileUrl) {
      return NextResponse.json(
        { error: "세트리스트 또는 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    const hasAccess = await checkAccess(authResult.payload.userId, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // PDF 파일 가져오기
    const response = await fetch(setlist.fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "PDF 파일을 가져오는 데 실패했습니다." },
        { status: 500 }
      );
    }

    // PDF 파일 스트리밍
    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="setlist_${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "PDF 파일 프록시");
  }
}
