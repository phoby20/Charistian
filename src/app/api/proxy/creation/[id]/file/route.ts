// src/app/api/proxy/creation/[id]/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/authenticateRequest";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/utils/handleApiError";

async function checkAccess(
  userId: string,
  creationId: string
): Promise<boolean> {
  // Creation과 User 정보 조회
  const creation = await prisma.creation.findUnique({
    where: { id: creationId },
    select: { churchId: true },
  });

  if (!creation) {
    console.error(`Creation not found for creationId: ${creationId}`);
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });

  if (!user) {
    console.error(`User not found for userId: ${userId}`);
    return false;
  }

  // churchId 비교
  if (user.churchId && creation.churchId === user.churchId) {
    console.log(
      `Access granted: User churchId (${user.churchId}) matches Creation churchId (${creation.churchId})`
    );
    return true;
  }

  // 기존 Setlist 기반 권한 확인
  const setlists = await prisma.setlist.findMany({
    where: {
      scores: {
        some: {
          creationId: creationId,
        },
      },
    },
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

  const hasSetlistAccess = setlists.some((setlist) => {
    if (setlist.creator.id === userId) return true;
    return setlist.shares.some((share) => {
      return (
        share.userId === userId ||
        (share.group?.users?.length ?? 0) > 0 ||
        (share.team?.users?.length ?? 0) > 0
      );
    });
  });

  console.log(
    `Setlist-based access: ${hasSetlistAccess} for userId: ${userId}, creationId: ${creationId}`
  );
  return hasSetlistAccess;
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
    // Creation 조회
    const creation = await prisma.creation.findUnique({
      where: { id },
      select: { fileUrl: true },
    });

    if (!creation || !creation.fileUrl) {
      console.error(`Creation 또는 파일을 찾을 수 없습니다. creationId: ${id}`);
      return NextResponse.json(
        { error: "Creation 또는 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    const hasAccess = await checkAccess(authResult.payload.userId, id);
    if (!hasAccess) {
      console.error(
        `권한이 없습니다. userId: ${authResult.payload.userId}, creationId: ${id}`
      );
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // PDF 파일 가져오기
    console.log(`Fetching PDF from: ${creation.fileUrl}`);
    const response = await fetch(creation.fileUrl);
    if (!response.ok) {
      console.error(
        `PDF 다운로드 실패: ${creation.fileUrl}, status: ${response.status}`
      );
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
        "Content-Disposition": `inline; filename="creation_${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error(`PDF 프록시 오류 (creationId: ${id}):`, error);
    return handleApiError(error, "PDF 파일 프록시");
  }
}
