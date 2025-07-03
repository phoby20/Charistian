// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";

// NextRequest 확장하여 user 속성 추가
declare module "next/server" {
  interface NextRequest {
    user?: TokenPayload;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search, origin } = req.nextUrl;

  // 루트 경로(/)로 접속 시 /ko로 리다이렉트
  if (pathname === "/") {
    const redirectUrl = new URL("/ko", origin);
    redirectUrl.search = search; // 쿼리 파라미터 유지
    return NextResponse.redirect(redirectUrl);
  }

  // /api/protected 경로에 대한 JWT 인증
  if (pathname.startsWith("/api/protected")) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return NextResponse.next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  // 다른 경로는 기본 처리
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", // 루트 경로
    "/api/protected/:path*", // 보호된 API 경로
  ],
};
