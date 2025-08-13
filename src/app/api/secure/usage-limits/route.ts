// src/app/api/secure/usage-limits/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { TokenPayload } from "@/lib/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";
const TIME_ZONE = "Asia/Seoul"; // 한국(서울) 시간대

interface JwtPayload {
  userId: string;
  churchId?: string;
  role: string;
}

const LIMITS = {
  FREE: {
    maxUsers: 10,
    weeklySetlists: 2,
    monthlySetlists: 8,
    maxScores: 50,
  },
  SMART: {
    maxUsers: 150,
    weeklySetlists: 10,
    monthlySetlists: 50,
    maxScores: 200,
  },
  ENTERPRISE: {
    maxUsers: Infinity,
    weeklySetlists: Infinity,
    monthlySetlists: Infinity,
    maxScores: Infinity,
  },
} as const;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      console.error("Token verification failed", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const churchId = decoded.churchId;

    if (!churchId) {
      return NextResponse.json(
        { error: "교회 ID가 없습니다." },
        { status: 400 }
      );
    }

    // 현재 서울 시간
    const now = toZonedTime(new Date(), TIME_ZONE);

    // 구독 정보 조회
    const subscription = await prisma.subscription.findFirst({
      where: { churchId: churchId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
    });

    const plan = subscription?.plan || "FREE";

    // 주간 세트리스트 조회: 일요일 ~ 토요일 (KST)
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 0 }); // 일요일 시작
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6); // 토요일
    endOfCurrentWeek.setHours(23, 59, 59, 999); // 토요일 23:59:59.999

    const weeklySetlists = await prisma.setlist.count({
      where: {
        churchId: churchId,
        createdAt: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
      },
    });

    // 월간 세트리스트 조회: 매월 1일 ~ 월말 (KST)
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now); // 월말 (2월: 28/29일, 그 외: 30/31일)

    const monthlySetlists = await prisma.setlist.count({
      where: {
        churchId: churchId,
        createdAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
    });

    // 사용자 및 악보 조회
    const currentChurchUsers = await prisma.user.count({
      where: { churchId: churchId },
    });

    const currentScores = await prisma.creation.count({
      where: { churchId: churchId },
    });

    return NextResponse.json({
      plan,
      maxUsers: LIMITS[plan].maxUsers,
      remainingUsers: currentChurchUsers,
      weeklySetlists: LIMITS[plan].weeklySetlists,
      remainingWeeklySetlists: weeklySetlists,
      monthlySetlists: LIMITS[plan].monthlySetlists,
      remainingMonthlySetlists: monthlySetlists,
      maxScores: LIMITS[plan].maxScores,
      remainingScores: currentScores,
    });
  } catch (error) {
    console.error("Usage limits fetch error:", error);
    return NextResponse.json(
      { error: "사용량 정보를 가져오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = req.user as TokenPayload;
    console.log("POST - User:", user); // 디버깅 로그

    // churchId 검증
    if (!user.churchId) {
      return NextResponse.json(
        { error: "교회 ID가 없습니다." },
        { status: 400 }
      );
    }

    const { type }: { type: "USER" | "SETLIST" | "SCORE" } = await req.json();
    // findUnique 대신 findFirst 사용
    const subscription = await prisma.subscription.findFirst({
      where: { churchId: user.churchId },
    });
    const plan = subscription?.plan || "FREE";

    const usage = await prisma.usageLimit.findFirst({
      where: { churchId: user.churchId },
    });
    if (!usage) {
      return NextResponse.json(
        { error: "사용량 정보가 없습니다." },
        { status: 404 }
      );
    }

    if (type === "USER" && usage.userCount >= LIMITS[plan].maxUsers) {
      return NextResponse.json(
        { error: "성도 등록 한도를 초과했습니다." },
        { status: 403 }
      );
    }
    if (
      type === "SETLIST" &&
      (usage.weeklySetlistCount >= LIMITS[plan].weeklySetlists ||
        usage.monthlySetlistCount >= LIMITS[plan].monthlySetlists)
    ) {
      return NextResponse.json(
        { error: "세트리스트 생성 한도를 초과했습니다." },
        { status: 403 }
      );
    }
    if (type === "SCORE" && usage.scoreCount >= LIMITS[plan].maxScores) {
      return NextResponse.json(
        { error: "악보 업로드 한도를 초과했습니다." },
        { status: 403 }
      );
    }

    await prisma.usageLimit.update({
      where: { id: usage.id }, // usage.id로 고유 식별
      data: {
        userCount: type === "USER" ? { increment: 1 } : undefined,
        weeklySetlistCount: type === "SETLIST" ? { increment: 1 } : undefined,
        monthlySetlistCount: type === "SETLIST" ? { increment: 1 } : undefined,
        scoreCount: type === "SCORE" ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({ message: "사용량이 업데이트되었습니다." });
  } catch (error) {
    console.error("Usage update error:", error);
    return NextResponse.json(
      { error: "사용량 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
