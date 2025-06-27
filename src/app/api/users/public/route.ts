import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // URL에서 churchId 쿼리 파라미터 추출
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get("churchId");

  // churchId 유효성 검사
  if (!churchId || typeof churchId !== "string") {
    return NextResponse.json(
      { error: "churchId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // churchId로 사용자 목록 조회
    const users = await prisma.user.findMany({
      where: {
        churchId, // churchId로 필터링
      },
      select: {
        id: true,
        name: true,
      },
    });

    // 응답 형식: { users: [{ id: string, name: string }, ...] }
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("사용자 목록 조회 오류:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: "사용자 목록 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
