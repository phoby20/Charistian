// src/app/api/secure/usage-limits/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfWeek, startOfMonth } from "date-fns";
import { TokenPayload } from "@/lib/jwt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";

interface JwtPayload {
  userId: string;
  churchId?: string;
  role: string;
}

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

    // churchId 검증
    if (!churchId) {
      return NextResponse.json(
        { error: "교회 ID가 없습니다." },
        { status: 400 }
      );
    }

    // findUnique 대신 findFirst 사용
    const subscription = await prisma.subscription.findFirst({
      where: { churchId: churchId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }, // 최신 데이터 보장
    });
    const usage = await prisma.usageLimit.findFirst({
      where: { churchId: churchId },
    });

    const plan = subscription?.plan || "FREE";
    const limits = {
      FREE: {
        maxUsers: 50,
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
    };

    // 주간/월간 리셋
    const now = new Date();
    if (usage && usage.resetAt) {
      if (usage.resetAt < startOfWeek(now)) {
        await prisma.usageLimit.update({
          where: { id: usage.id }, // usage.id로 고유 식별
          data: { weeklySetlistCount: 0, resetAt: now },
        });
      }
      if (usage.resetAt < startOfMonth(now)) {
        await prisma.usageLimit.update({
          where: { id: usage.id }, // usage.id로 고유 식별
          data: { monthlySetlistCount: 0, resetAt: now },
        });
      }
    }

    const currentUsage = await prisma.usageLimit.findFirst({
      where: { churchId: churchId },
    });

    const currentChurchUsers = await prisma.user.findMany({
      where: { churchId: churchId },
    });

    const currentScores = await prisma.creation.findMany({
      where: { churchId: churchId },
    });

    return NextResponse.json({
      plan,
      maxUsers: limits[plan].maxUsers,
      remainingUsers: currentChurchUsers.length,
      weeklySetlists: limits[plan].weeklySetlists,
      remainingWeeklySetlists: currentUsage?.weeklySetlistCount || 0,
      monthlySetlists: limits[plan].monthlySetlists,
      remainingMonthlySetlists: currentUsage?.monthlySetlistCount || 0,
      maxScores: limits[plan].maxScores,
      remainingScores: currentScores.length,
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

    const limits = {
      FREE: {
        maxUsers: 50,
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
    };

    const usage = await prisma.usageLimit.findFirst({
      where: { churchId: user.churchId },
    });
    if (!usage) {
      return NextResponse.json(
        { error: "사용량 정보가 없습니다." },
        { status: 404 }
      );
    }

    if (type === "USER" && usage.userCount >= limits[plan].maxUsers) {
      return NextResponse.json(
        { error: "성도 등록 한도를 초과했습니다." },
        { status: 403 }
      );
    }
    if (
      type === "SETLIST" &&
      (usage.weeklySetlistCount >= limits[plan].weeklySetlists ||
        usage.monthlySetlistCount >= limits[plan].monthlySetlists)
    ) {
      return NextResponse.json(
        { error: "세트리스트 생성 한도를 초과했습니다." },
        { status: 403 }
      );
    }
    if (type === "SCORE" && usage.scoreCount >= limits[plan].maxScores) {
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
