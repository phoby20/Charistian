// src/app/api/attendance/search/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Attendance 응답 타입 정의
interface AttendanceRecord {
  userId: string;
  date: string; // ISO 날짜 문자열 (e.g., "2025-06-05")
}

interface AttendanceResponse {
  attendances: AttendanceRecord[];
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userRole = decoded.role as string;

    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 쿼리 파라미터에서 startDate와 endDate 추출
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 날짜 범위 설정
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // 종료일 포함
      dateFilter = {
        date: {
          gte: start,
          lte: end,
        },
      };
    } else {
      // 기본적으로 오늘 날짜
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dateFilter = {
        date: {
          gte: today,
          lt: tomorrow,
        },
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: dateFilter,
      select: {
        userId: true,
        date: true, // date 필드 포함
      },
    });

    // 응답 데이터 포맷팅 (date를 ISO 문자열로 변환)
    const response: AttendanceResponse = {
      attendances: attendances.map((att) => ({
        userId: att.userId,
        date: att.date.toISOString().split("T")[0],
      })),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
