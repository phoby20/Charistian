import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  try {
    const prisma = new PrismaClient();
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 최근 한 달 동안 자주 사용된 악보
    const monthlyScores = await prisma.setlistScore.groupBy({
      by: ["creationId"],
      where: {
        createdAt: {
          gte: oneMonthAgo,
        },
      },
      _count: {
        creationId: true,
      },
      orderBy: {
        _count: {
          creationId: "desc",
        },
      },
      take: 3,
    });

    // 최근 일주일 동안 자주 사용된 악보
    const weeklyScores = await prisma.setlistScore.groupBy({
      by: ["creationId"],
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _count: {
        creationId: true,
      },
      orderBy: {
        _count: {
          creationId: "desc",
        },
      },
      take: 3,
    });

    // Creation 정보와 장르를 포함한 데이터 조회
    const monthlyScoresWithDetails = await Promise.all(
      monthlyScores.map(async (score) => {
        const creation = await prisma.creation.findUnique({
          where: { id: score.creationId },
          select: {
            id: true,
            title: true,
            titleEn: true,
            titleJa: true,
            genre: true,
          },
        });
        return {
          creationId: score.creationId,
          title: creation?.title ?? "",
          titleEn: creation?.titleEn ?? "",
          titleJa: creation?.titleJa ?? "",
          genre: creation?.genre ?? null,
          usageCount: score._count.creationId,
        };
      })
    );

    const weeklyScoresWithDetails = await Promise.all(
      weeklyScores.map(async (score) => {
        const creation = await prisma.creation.findUnique({
          where: { id: score.creationId },
          select: {
            id: true,
            title: true,
            titleEn: true,
            titleJa: true,
            genre: true,
          },
        });
        return {
          creationId: score.creationId,
          title: creation?.title ?? "",
          titleEn: creation?.titleEn ?? "",
          titleJa: creation?.titleJa ?? "",
          genre: creation?.genre ?? null,
          usageCount: score._count.creationId,
        };
      })
    );

    return NextResponse.json({
      monthly: monthlyScoresWithDetails,
      weekly: weeklyScoresWithDetails,
    });
  } catch (error) {
    console.error("Error fetching frequent scores:", error);
    return NextResponse.json(
      { error: "악보 데이터를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
