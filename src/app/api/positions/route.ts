// src/app/api/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";

interface JwtPayload {
  userId: string;
  churchId: string;
  role: string;
}

export async function GET() {
  try {
    // 쿠키에서 토큰 추출
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // JWT 검증
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 권한 확인
    if (decoded.role !== "MASTER" && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const churchId = decoded.churchId;
    if (!churchId) {
      return NextResponse.json(
        { error: "Church ID required" },
        { status: 400 }
      );
    }

    // ChurchPosition에서 직책 목록 조회
    const positions = await prisma.churchPosition.findMany({
      where: { churchId },
      select: { id: true, name: true },
    });

    return NextResponse.json({ positions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 쿠키에서 토큰 추출
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // JWT 검증
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 권한 확인
    if (decoded.role !== "MASTER" && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const churchId = decoded.churchId;
    if (!churchId) {
      return NextResponse.json(
        { error: "Church ID required" },
        { status: 400 }
      );
    }

    // 교회 존재 확인
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // 중복 직책 확인
    const existingPosition = await prisma.churchPosition.findFirst({
      where: { churchId, name },
    });
    if (existingPosition) {
      return NextResponse.json(
        { error: "Position name already exists" },
        { status: 400 }
      );
    }

    // 새 ChurchPosition 생성
    const position = await prisma.churchPosition.create({
      data: {
        name,
        churchId,
      },
    });

    return NextResponse.json(
      { message: "Position added", position },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding position:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
