// src/utils/error.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleApiError(
  error: unknown,
  operation: string
): NextResponse<{ error: string }> {
  console.error(`${operation} 오류:`, JSON.stringify(error, null, 2));
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
    { error: `${operation} 중 오류가 발생했습니다: ${errorMessage}` },
    { status: 500 }
  );
}
