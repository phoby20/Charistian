// src/app/api/setlists/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/utils/authenticateRequest";
import { mergeAndUploadPdf } from "@/utils/mergeAndUploadPdf";
import { sendSetlistEmail } from "@/utils/sendSetlistEmail";
import { handleApiError } from "@/utils/handleApiError";
import { SetlistResponse } from "@/types/setList";
import { del } from "@vercel/blob";
import { getLocalIpAddress } from "@/utils/getLocalIpAddress";

interface UpdateSetlistRequest {
  title: string;
  date: string;
  description?: string;
  scores: {
    creationId: string;
    order: number;
    selectedReferenceUrl: string | null;
    selectedKey: string;
  }[]; // selectedKey 추가
  shares: {
    groupId?: string | null;
    teamId?: string | null;
    userId?: string | null;
  }[];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { id } = await context.params;
  try {
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, id: true } },
        scores: {
          select: {
            id: true,
            creation: {
              select: {
                id: true,
                title: true,
                titleEn: true,
                titleJa: true,
                referenceUrls: true,
                scoreKeys: true, // ScoreKey에서 selectedKey에 해당하는 fileUrl 조회를 위해 추가
              },
            },
            order: true,
            selectedReferenceUrl: true,
            selectedKey: true, // selectedKey 포함
          },
        },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        shares: {
          include: {
            group: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!setlist) {
      return NextResponse.json(
        { error: "세트리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const ip = getLocalIpAddress();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ip}:3001`;

    return NextResponse.json({ setlist, appUrl }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "세트리스트 조회");
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { id } = await context.params;
  try {
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      select: { creatorId: true, fileUrl: true },
    });

    if (!setlist) {
      return NextResponse.json(
        { error: "세트리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (
      authResult.payload.userId !== setlist.creatorId &&
      !["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(authResult.payload.role)
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 트랜잭션 내에서 관련 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 1. SetlistScore 삭제
      await tx.setlistScore.deleteMany({
        where: { setlistId: id },
      });
      // 2. SetlistShare 삭제
      await tx.setlistShare.deleteMany({
        where: { setlistId: id },
      });
      // 3. SetlistComment 삭제
      await tx.setlistComment.deleteMany({
        where: { setlistId: id },
      });
      // 4. Setlist 삭제
      await tx.setlist.delete({
        where: { id },
      });
    });

    // Vercel Blob에서 PDF 삭제
    if (setlist.fileUrl) {
      await del(setlist.fileUrl);
      console.log(`Vercel Blob에서 PDF 삭제 완료: ${setlist.fileUrl}`);
    }

    return NextResponse.json(
      { message: "세트리스트가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "세트리스트 삭제");
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<SetlistResponse | { error: string }>> {
  console.log("PUT 메소드 시작");
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { id } = await context.params;
  try {
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      select: { creatorId: true, churchId: true, fileUrl: true },
    });

    if (!setlist) {
      return NextResponse.json(
        { error: "세트리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (
      authResult.payload.userId !== setlist.creatorId &&
      !["SUPER_ADMIN", "ADMIN"].includes(authResult.payload.role)
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { title, date, description, scores, shares }: UpdateSetlistRequest =
      await req.json();
    if (!title || !date) {
      return NextResponse.json(
        { error: "title과 date는 필수입니다." },
        { status: 400 }
      );
    }
    if (!Array.isArray(scores) || !Array.isArray(shares)) {
      return NextResponse.json(
        { error: "scores와 shares는 배열이어야 합니다." },
        { status: 400 }
      );
    }
    console.log("입력란 체크 완료");

    const creations = await prisma.creation.findMany({
      where: { id: { in: scores.map((score) => score.creationId) } },
      select: { id: true, fileUrl: true, scoreKeys: true }, // scoreKeys 포함
    });

    const sortedScores = scores
      .sort((a, b) => a.order - b.order)
      .map((score) => {
        const creation = creations.find((c) => c.id === score.creationId);
        const selectedKeyObj = creation?.scoreKeys.find(
          (key) => key.key === score.selectedKey
        );
        return {
          creationId: score.creationId,
          fileUrl: selectedKeyObj?.fileUrl || creation?.fileUrl,
          order: score.order,
          selectedKey: score.selectedKey, // selectedKey 포함
        };
      })
      .filter(
        (
          score
        ): score is {
          creationId: string;
          fileUrl: string;
          order: number;
          selectedKey: string;
        } => !!score.fileUrl
      );

    if (sortedScores.length === 0) {
      return NextResponse.json(
        { error: "유효한 PDF 파일이 없습니다." },
        { status: 400 }
      );
    }

    console.log(
      `PDF 병합 순서 (setlistId: ${id}):`,
      sortedScores.map((s) => ({
        creationId: s.creationId,
        order: s.order,
        fileUrl: s.fileUrl,
        selectedKey: s.selectedKey,
      }))
    );

    await prisma.$transaction(
      async (tx) => {
        await tx.setlistScore.deleteMany({ where: { setlistId: id } });
        await tx.setlistShare.deleteMany({ where: { setlistId: id } });

        await tx.setlist.update({
          where: { id },
          data: {
            title,
            date: new Date(date),
            description,
            scores: {
              create: scores.map((s) => ({
                creationId: s.creationId,
                order: s.order,
                selectedReferenceUrl: s.selectedReferenceUrl,
                selectedKey: s.selectedKey, // selectedKey 저장
              })),
            },
            shares: {
              create: shares.map((s) => ({
                groupId: s.groupId ?? undefined,
                teamId: s.teamId ?? undefined,
                userId: s.userId ?? undefined,
              })),
            },
          },
        });
      },
      { timeout: 15000 }
    );

    const fileUrl = await mergeAndUploadPdf(sortedScores, id, setlist.fileUrl);
    console.log("pdf 병합 완료: ", fileUrl);

    await prisma.setlist.update({
      where: { id },
      data: { fileUrl },
    });

    const finalSetlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, id: true } },
        church: { select: { name: true } },
        scores: {
          include: {
            creation: {
              select: {
                id: true,
                title: true,
                fileUrl: true,
                referenceUrls: true,
                titleEn: true,
                titleJa: true,
                key: true,
                scoreKeys: true, // PDF 병합에 필요한 fileUrl 조회를 위해 추가
              },
            },
          },
        },
        shares: {
          include: {
            group: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!finalSetlist) {
      throw new Error("업데이트된 세트리스트를 찾을 수 없습니다.");
    }

    await sendSetlistEmail(
      req,
      finalSetlist,
      "콘티 리스트가 업데이트되었습니다"
    );

    return NextResponse.json(finalSetlist as SetlistResponse, { status: 200 });
  } catch (error) {
    return handleApiError(error, "세트리스트 업데이트");
  }
}
