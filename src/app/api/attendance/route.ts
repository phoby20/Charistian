// src/app/api/attendance/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Attendance 응답 타입 정의
interface AttendanceRecord {
  userId: string;
}

interface AttendanceResponse {
  attendances: AttendanceRecord[];
}

// POST/DELETE 요청의 바디 타입 정의
interface AttendanceRequestBody {
  userId: string;
}

export async function GET() {
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

    // 서버의 현재 날짜 사용 (JST 기준, 2025-06-05)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 자정으로 설정
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        userId: true,
      },
    });

    const response: AttendanceResponse = { attendances };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const checkedById = decoded.userId as string;
    const userRole = decoded.role as string;

    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: AttendanceRequestBody = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 서버의 현재 날짜 사용 (JST 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 이미 출석 기록이 있는지 확인
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Attendance already recorded" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkedById,
        createdAt: new Date(), // 명시적으로 createdAt 추가 (스키마의 기본값이 없으면 필요)
      },
      select: {
        id: true,
        userId: true,
        date: true,
        checkedById: true,
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const body: AttendanceRequestBody = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 서버의 현재 날짜 사용 (JST 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const deleted = await prisma.attendance.deleteMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "No attendance record found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Attendance removed" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
