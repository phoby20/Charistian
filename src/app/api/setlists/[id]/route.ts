// src/app/api/setlists/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { put, del } from "@vercel/blob"; // del 메서드 추가
import { PDFDocument } from "pdf-lib";
import { Resend } from "resend";
import { createKoreaDate } from "@/utils/creatKoreaDate";
import { createEmailContent } from "@/utils/createSetListEmailContent";

// Resend 초기화: 이메일 전송을 위한 Resend 클라이언트
const resend = new Resend(process.env.RESEND_API_KEY);

// UpdateSetlistRequest 타입 정의: PUT 요청의 바디 형식
interface UpdateSetlistRequest {
  title: string;
  date: string;
  description?: string;
  scores: { creationId: string; order: number }[];
  shares: {
    groupId?: string | null;
    teamId?: string | null;
    userId?: string | null;
  }[];
}

// SetlistResponse 타입 정의: API 응답 형식
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

// GET: 특정 세트리스트 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 인증 토큰 확인
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

  // 토큰 검증
  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  // URL 파라미터에서 setlist ID 추출
  const { id } = await context.params;
  // 세트리스트 조회 (관련 데이터 포함)
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
              fileUrl: true,
              referenceUrls: true,
              key: true,
            },
          },
          order: true,
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

  // 세트리스트가 없는 경우
  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  // 권한 확인
  const hasAccess = await checkAccess(payload.userId, id);
  if (!hasAccess)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  // 세트리스트 반환
  return NextResponse.json(setlist, { status: 200 });
}

// DELETE: 세트리스트 삭제 및 관련 PDF 파일 제거
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 인증 토큰 확인
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

  // 토큰 검증
  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  // URL 파라미터에서 setlist ID 추출
  const { id } = await context.params;
  // 세트리스트 조회 (creatorId 확인용)
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    select: { creatorId: true, fileUrl: true }, // fileUrl 추가
  });

  // 세트리스트가 없는 경우
  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  // 권한 확인: 작성자 또는 관리자만 삭제 가능
  if (
    payload.userId !== setlist.creatorId &&
    !["SUPER_ADMIN", "ADMIN"].includes(payload.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    // Vercel Blob에서 기존 PDF 파일 삭제
    if (setlist.fileUrl) {
      try {
        await del(setlist.fileUrl);
        console.log(`Vercel Blob에서 PDF 삭제 완료: ${setlist.fileUrl}`);
      } catch (error) {
        console.error(`Vercel Blob PDF 삭제 오류: ${setlist.fileUrl}`, error);
      }
    }

    // Prisma를 통해 세트리스트 삭제
    await prisma.setlist.delete({ where: { id } });
    return NextResponse.json(
      { message: "세트리스트가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("세트리스트 삭제 오류:", error);
    return NextResponse.json(
      { error: "세트리스트 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 세트리스트 업데이트, 기존 PDF 삭제 후 새 PDF 저장
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<SetlistResponse | { error: string }>> {
  // 인증 토큰 확인
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

  // 토큰 검증
  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  // URL 파라미터에서 setlist ID 추출
  const { id } = await context.params;
  // 세트리스트 조회 (권한 및 churchId 확인용)
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    select: { creatorId: true, churchId: true, fileUrl: true }, // fileUrl 추가
  });
  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  // 권한 확인: 작성자 또는 관리자만 수정 가능
  if (
    payload.userId !== setlist.creatorId &&
    !["SUPER_ADMIN", "ADMIN"].includes(payload.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 요청 바디 파싱
  const { title, date, description, scores, shares }: UpdateSetlistRequest =
    await req.json();
  if (!title || !date)
    return NextResponse.json(
      { error: "title과 date는 필수입니다." },
      { status: 400 }
    );

  if (!Array.isArray(scores) || !Array.isArray(shares)) {
    return NextResponse.json(
      { error: "scores와 shares는 배열이어야 합니다." },
      { status: 400 }
    );
  }

  try {
    // scores의 creationId로 Creation에서 fileUrl 조회
    const creations = await prisma.creation.findMany({
      where: {
        id: { in: scores.map((score) => score.creationId) },
      },
      select: { id: true, fileUrl: true },
    });

    // order 순서에 맞게 정렬 및 유효한 PDF만 필터링
    const sortedScores = scores
      .sort((a, b) => a.order - b.order)
      .map((score) => {
        const creation = creations.find((c) => c.id === score.creationId);
        return {
          creationId: score.creationId,
          fileUrl: creation?.fileUrl,
          order: score.order,
        };
      })
      .filter(
        (
          score
        ): score is { creationId: string; fileUrl: string; order: number } =>
          !!score.fileUrl
      );

    // 유효한 PDF 파일이 없는 경우
    if (sortedScores.length === 0) {
      return NextResponse.json(
        { error: "유효한 PDF 파일이 없습니다." },
        { status: 400 }
      );
    }

    // PDF 병합 순서 디버깅 로그
    console.log(
      `PDF 병합 순서 (setlistId: ${id}):`,
      sortedScores.map((s) => ({
        creationId: s.creationId,
        order: s.order,
        fileUrl: s.fileUrl,
      }))
    );

    // 트랜잭션 시작: 세트리스트 업데이트
    await prisma.$transaction(
      async (tx) => {
        // 기존 setlistScore와 setlistShare 삭제
        await tx.setlistScore.deleteMany({ where: { setlistId: id } });
        await tx.setlistShare.deleteMany({ where: { setlistId: id } });

        // 세트리스트 데이터 업데이트
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

    // 기존 PDF 파일 삭제
    if (setlist.fileUrl) {
      try {
        await del(setlist.fileUrl);
        console.log(`Vercel Blob에서 기존 PDF 삭제 완료: ${setlist.fileUrl}`);
      } catch (error) {
        console.error(`Vercel Blob PDF 삭제 오류: ${setlist.fileUrl}`, error);
      }
    }

    // PDF 병합
    const mergedPdf = await PDFDocument.create();
    const pdfPromises = sortedScores.map(async ({ fileUrl }) => {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`PDF 다운로드 실패 | URL: ${fileUrl}`);
      return response.arrayBuffer();
    });

    const pdfBuffers = await Promise.all(pdfPromises);
    // sortedScores 순서대로 PDF 페이지 추가
    for (let i = 0; i < pdfBuffers.length; i++) {
      const pdf = await PDFDocument.load(pdfBuffers[i]);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // 병합된 PDF를 바이트로 저장
    const mergedPdfBytes = await mergedPdf.save();
    const buffer = Buffer.from(mergedPdfBytes);

    const koreaDate = createKoreaDate();

    // 새 PDF를 Vercel Blob에 업로드
    const blob = await put(
      `setlists/merged_setlist/${koreaDate}_${id}.pdf`,
      buffer,
      {
        access: "public",
        allowOverwrite: true,
      }
    );

    // Setlist에 새로운 fileUrl 업데이트
    await prisma.setlist.update({
      where: { id },
      data: { fileUrl: blob.url },
    });

    // 최종 Setlist 조회
    const finalSetlist = await prisma.setlist.findUnique({
      where: { id },
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
      throw new Error("업데이트된 세트리스트를 찾을 수 없습니다.");
    }

    // 이메일 전송 설정
    const resendFrom = process.env.RESEND_FROM;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const logoUrl = `${appUrl}/logo.png`;
    const emailTitle = "콘티 리스트가 업데이트되었습니다";

    // 이메일 전송
    if (resendFrom) {
      const isLocal =
        process.env.NODE_ENV === "development" ||
        req.headers.get("host")?.includes("localhost");

      // 공유 대상 사용자 조회
      const groupIds = finalSetlist.shares
        .filter((share) => share.group?.id)
        .map((share) => share.group!.id);
      const teamIds = finalSetlist.shares
        .filter((share) => share.team?.id)
        .map((share) => share.team!.id);

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { groups: { some: { id: { in: groupIds } } } },
            { teams: { some: { id: { in: teamIds } } } },
            { email: { not: "" } }, // 이메일이 비어 있지 않은 사용자만
          ],
        },
        select: { email: true, name: true },
      });

      // 이메일 내용 생성
      const scoresList = finalSetlist.scores
        .map((score) => `<li>${score.creation.title}</li>`)
        .join("");
      const sharesList = finalSetlist.shares
        .map((share) => {
          if (share.group) return `<li>그룹: ${share.group.name}</li>`;
          if (share.team) return `<li>팀: ${share.team.name}</li>`;
          if (share.user) return `<li>사용자: ${share.user.name}</li>`;
          return "";
        })
        .join("");
      const emailContent = createEmailContent(
        logoUrl,
        finalSetlist,
        scoresList,
        sharesList,
        koreaDate,
        emailTitle
      );

      // 로컬 환경: 콘솔 출력
      if (isLocal) {
        console.log("Local environment detected. Email content (not sent):");
        console.log("To:", users.map((u) => u.email).join(", "));
        // console.log(emailContent);
        console.log(`이메일 전송 완료: ${users.length}명의 사용자에게 전송`);
      } else {
        // 프로덕션 환경: 이메일 전송
        if (users.length > 0) {
          await resend.emails.send({
            from: resendFrom,
            to: users.map((u) => u.email!),
            subject: `업데이트된 콘티 리스트: ${finalSetlist.title}`,
            html: emailContent,
          });
          console.log(`이메일 전송 완료: ${users.length}명의 사용자에게 전송`);
        } else {
          console.log("공유 대상 사용자가 없습니다.");
        }
      }
    } else {
      console.error("RESEND_FROM 환경 변수가 설정되지 않았습니다.");
    }

    // 성공 응답
    return NextResponse.json(finalSetlist as SetlistResponse, { status: 200 });
  } catch (error: unknown) {
    // 에러 처리 및 로깅
    console.error(
      `세트리스트 업데이트 오류 (setlistId: ${id}, scores: ${scores.length}, shares: ${shares.length}, creationIds: ${scores
        .map((s) => s.creationId)
        .join(",")}):`,
      JSON.stringify(error, null, 2)
    );
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
    if (
      error instanceof Error &&
      error.message.includes("Vercel Blob: This blob already exists")
    ) {
      return NextResponse.json(
        { error: "PDF 파일 업로드 중 중복 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: `세트리스트 업데이트 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// checkAccess: 사용자 접근 권한 확인
async function checkAccess(
  userId: string,
  setlistId: string
): Promise<boolean> {
  // 세트리스트와 공유 정보 조회
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

  // 작성자인지 확인
  if (setlist.creator.id === userId) return true;

  // 공유 대상에 포함된 사용자인지 확인
  return setlist.shares.some((share) => {
    return (
      share.userId === userId ||
      (share.group?.users?.length ?? 0) > 0 ||
      (share.team?.users?.length ?? 0) > 0
    );
  });
}
