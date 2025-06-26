import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";

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

// Setlist 응답 타입 정의
interface SetlistResponse {
  id: string;
  title: string;
  date: Date;
  description?: string | null;
  fileUrl?: string | null;
  creator: { id: string; name: string };
  church: { name: string };
  scores: Array<{
    creation: { id: string; title: string; fileUrl: string | null };
  }>;
  shares: Array<{
    group?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
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

  if (!payload.churchId) {
    return NextResponse.json(
      { error: "churchId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 관리자 역할 확인
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(
      payload.role
    );

    let setlists;
    if (isAdmin) {
      // 관리자인 경우: churchId로 모든 세트리스트 조회
      setlists = await prisma.setlist.findMany({
        where: {
          churchId: payload.churchId,
        },
        include: {
          creator: { select: { name: true, id: true } },
          church: { select: { name: true } },
          scores: {
            include: {
              creation: { select: { id: true, title: true, fileUrl: true } },
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
    } else {
      // 일반 유저: 그룹과 팀에 동시에 공유된 세트리스트 조회
      const userGroupIds = await getUserGroupIds(payload.userId);
      const userTeamIds = await getUserTeamIds(payload.userId);

      setlists = await prisma.setlist.findMany({
        where: {
          AND: [
            {
              shares: {
                some: { groupId: { in: userGroupIds } },
              },
            },
            {
              shares: {
                some: { teamId: { in: userTeamIds } },
              },
            },
          ],
        },
        include: {
          creator: { select: { name: true, id: true } },
          church: { select: { name: true } },
          scores: {
            include: {
              creation: { select: { id: true, title: true, fileUrl: true } },
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
    }

    return NextResponse.json(setlists as SetlistResponse[], { status: 200 });
  } catch (error) {
    console.error("세트리스트 조회 오류:", JSON.stringify(error, null, 2));
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `세트리스트 조회 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST 메서드 및 나머지 코드는 변경 없음
export async function POST(
  req: NextRequest
): Promise<NextResponse<SetlistResponse | { error: string }>> {
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
      {
        error: `유효하지 않은 토큰입니다. ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 401 }
    );
  }

  if (!payload.churchId) {
    return NextResponse.json(
      { error: "churchId가 필요합니다." },
      { status: 400 }
    );
  }

  const { title, date, description, scores, shares }: CreateSetlistRequest =
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

  try {
    // scores의 creationId로 Creation에서 fileUrl 조회 (트랜잭션 밖에서)
    const creations = await prisma.creation.findMany({
      where: {
        id: { in: scores.map((score) => score.creationId) },
      },
      select: { id: true, fileUrl: true },
    });

    // order 순서에 맞게 정렬
    const sortedScores = scores
      .sort((a, b) => a.order - b.order)
      .map((score) => {
        const creation = creations.find((c) => c.id === score.creationId);
        return { creationId: score.creationId, fileUrl: creation?.fileUrl };
      })
      .filter(
        (score): score is { creationId: string; fileUrl: string } =>
          !!score.fileUrl
      );

    if (sortedScores.length === 0) {
      return NextResponse.json(
        { error: "유효한 PDF 파일이 없습니다." },
        { status: 400 }
      );
    }

    // 트랜잭션 시작 (타임아웃 10초로 설정)
    const setlist = await prisma.$transaction(
      async (tx) => {
        // Setlist 생성
        const newSetlist = await tx.setlist.create({
          data: {
            title,
            date: new Date(date),
            description,
            creator: { connect: { id: payload.userId } },
            church: { connect: { id: payload.churchId } },
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
          } as Prisma.SetlistCreateInput,
        });

        return newSetlist;
      },
      { timeout: 15000 } // 타임아웃 15초로 조정
    );

    // PDF 병합 (트랜잭션 밖에서 처리)
    const mergedPdf = await PDFDocument.create();
    const pdfPromises = sortedScores.map(async ({ fileUrl }) => {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`PDF 다운로드 실패 | URL: ${fileUrl}`);
      return response.arrayBuffer();
    });

    const pdfBuffers = await Promise.all(pdfPromises);
    for (const pdfBytes of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // 병합된 PDF를 바이트로 저장
    const mergedPdfBytes = await mergedPdf.save();
    const buffer = Buffer.from(mergedPdfBytes);

    // Vercel Blob에 업로드
    const blob = await put(
      `setlists/merged_setlist/${setlist.id}.pdf`,
      buffer,
      { access: "public" }
    );

    // Setlist에 fileUrl 업데이트
    await prisma.setlist.update({
      where: { id: setlist.id },
      data: { fileUrl: blob.url },
    });

    // 최종 Setlist 조회하여 응답
    const finalSetlist = await prisma.setlist.findUnique({
      where: { id: setlist.id },
      include: {
        creator: { select: { name: true, id: true } },
        church: { select: { name: true } },
        scores: {
          include: {
            creation: { select: { id: true, title: true, fileUrl: true } },
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
      throw new Error("생성된 세트리스트를 찾을 수 없습니다.");
    }

    return NextResponse.json(finalSetlist as SetlistResponse, { status: 201 });
  } catch (error: unknown) {
    console.error("세트리스트 생성 오류:", JSON.stringify(error, null, 2));
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2028") {
        return NextResponse.json(
          {
            error:
              "트랜잭션 타임아웃이 발생했습니다. 작업이 너무 오래 걸렸습니다.",
          },
          { status: 500 }
        );
      }
      if (error.code === "P5000") {
        return NextResponse.json(
          {
            error:
              "잘못된 요청입니다. 트랜잭션 타임아웃 설정이 제한을 초과했습니다.",
          },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: `세트리스트 생성 중 오류가 발생했습니다: ${errorMessage}` },
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
