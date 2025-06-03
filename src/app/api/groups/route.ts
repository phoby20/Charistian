// src/app/api/duties/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Prisma 클라이언트 초기화
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // 환경 변수에서 비밀 키 가져오기

export async function GET() {
  try {
    // 쿠키에서 토큰 추출 (비동기 처리)
    const cookieStore = await cookies(); // cookies()를 await로 호출
    const token = cookieStore.get("token")?.value; // 쿠키 이름은 백엔드 설정에 맞게 조정

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

    // 사용자 정보 확인
    const { userId, churchId, role } = decoded;
    if (!userId || !churchId || !role) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 권한 확인 (MASTER 또는 SUPER_ADMIN만 접근 가능)
    if (role !== "MASTER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 직무 데이터 조회
    const duties = await prisma.group.findMany({
      where: { churchId },
    });

    return NextResponse.json({ duties });
  } catch (err) {
    console.error("Error in GET /api/groups:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    // 사용자 정보 확인
    const { userId, churchId, role } = decoded;
    if (!userId || !churchId || !role) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // 권한 확인
    if (role !== "MASTER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 요청 본문에서 직무 이름 가져오기
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // 직무 생성
    const group = await prisma.group.create({
      data: { name, churchId },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/groups:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
