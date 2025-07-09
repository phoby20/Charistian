// src/app/api/setlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/utils/authenticateRequest";
import { mergeAndUploadPdf } from "@/utils/mergeAndUploadPdf";
import { sendSetlistEmail } from "@/utils/sendSetlistEmail";
import { handleApiError } from "@/utils/handleApiError";
import { SetlistResponse } from "@/types/setList";
import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface CreateSetlistRequest {
  title: string;
  date: string;
  description?: string;
  scores: Array<{
    creationId: string;
    order: number;
    selectedReferenceUrl: string | null;
  }>;
  shares: Array<{
    groupId?: string | null;
    teamId?: string | null;
    userId?: string | null;
  }>;
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { payload } = authResult;
  if (!payload.churchId) {
    return NextResponse.json(
      { error: "churchId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(
      payload.role
    );
    let setlists;

    if (isAdmin) {
      setlists = await prisma.setlist.findMany({
        where: { churchId: payload.churchId },
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
      const userGroupIds = await getUserGroupIds(payload.userId);
      const userTeamIds = await getUserTeamIds(payload.userId);

      setlists = await prisma.setlist.findMany({
        where: {
          AND: [
            { shares: { some: { groupId: { in: userGroupIds } } } },
            { shares: { some: { teamId: { in: userTeamIds } } } },
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
    return handleApiError(error, "세트리스트 조회");
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<SetlistResponse | { error: string }>> {
  const authResult = await authenticateRequest(req);
  if (authResult.response) return authResult.response;

  const { payload } = authResult;
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
    const creations = await prisma.creation.findMany({
      where: { id: { in: scores.map((score) => score.creationId) } },
      select: { id: true, fileUrl: true },
    });

    const sortedScores = scores
      .sort((a, b) => a.order - b.order)
      .map((score) => {
        const creation = creations.find((c) => c.id === score.creationId);
        return {
          creationId: score.creationId,
          fileUrl: creation?.fileUrl,
          order: score.order,
          selectedReferenceUrl: score.selectedReferenceUrl,
        };
      })
      .filter(
        (
          score
        ): score is {
          creationId: string;
          fileUrl: string;
          order: number;
          selectedReferenceUrl: string | null;
        } => !!score.fileUrl
      );

    if (sortedScores.length === 0) {
      return NextResponse.json(
        { error: "유효한 PDF 파일이 없습니다." },
        { status: 400 }
      );
    }

    const setlist = await prisma.$transaction(
      async (tx) => {
        // 1. Setlist 생성
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
                selectedReferenceUrl: score.selectedReferenceUrl,
              })),
            },
            shares: {
              create: shares.map((share) => ({
                groupId: share.groupId ?? null,
                teamId: share.teamId ?? null,
                userId: share.userId ?? null,
              })),
            },
          },
        });

        // 2. UsageLimit 업데이트 (KST 기준)
        const nowKstString = formatInTimeZone(
          new Date(),
          "Asia/Seoul",
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        );
        const now = new Date(nowKstString);
        const oneWeekAgo = subDays(now, 7);
        const oneMonthAgo = subDays(now, 30);

        // 주간 및 월간 Setlist 수 계산
        const [weeklyCount, monthlyCount] = await Promise.all([
          tx.setlist.count({
            where: {
              churchId: payload.churchId,
              createdAt: { gte: oneWeekAgo },
            },
          }),
          tx.setlist.count({
            where: {
              churchId: payload.churchId,
              createdAt: { gte: oneMonthAgo },
            },
          }),
        ]);

        // UsageLimit 레코드 조회 또는 생성
        const usageLimit = await tx.usageLimit.findFirst({
          where: { churchId: payload.churchId },
        });

        if (usageLimit) {
          await tx.usageLimit.update({
            where: { id: usageLimit.id },
            data: {
              weeklySetlistCount: weeklyCount,
              monthlySetlistCount: monthlyCount,
              updatedAt: now,
            },
          });
        } else {
          await tx.usageLimit.create({
            data: {
              churchId: payload.churchId ?? "",
              weeklySetlistCount: weeklyCount,
              monthlySetlistCount: monthlyCount,
              userCount: 0,
              scoreCount: 0,
              createdAt: now,
              updatedAt: now,
            },
          });
        }

        return newSetlist;
      },
      { timeout: 15000 }
    );

    const fileUrl = await mergeAndUploadPdf(sortedScores, setlist.id);

    await prisma.setlist.update({
      where: { id: setlist.id },
      data: { fileUrl },
    });

    const finalSetlist = await prisma.setlist.findUnique({
      where: { id: setlist.id },
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
      throw new Error("생성된 세트리스트를 찾을 수 없습니다.");
    }

    await sendSetlistEmail(
      req,
      finalSetlist,
      "새로운 콘티리스트가 생성되었습니다"
    );

    return NextResponse.json(finalSetlist as SetlistResponse, { status: 201 });
  } catch (error) {
    return handleApiError(error, "세트리스트 생성");
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
