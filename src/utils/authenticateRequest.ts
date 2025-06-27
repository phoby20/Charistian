// src/utils/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";

export async function authenticateRequest(
  req: NextRequest
): Promise<
  | { payload: TokenPayload; response?: never }
  | { payload?: never; response: NextResponse<{ error: string }> }
> {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return {
      response: NextResponse.json(
        { error: "인증되지 않았습니다." },
        { status: 401 }
      ),
    };
  }

  try {
    const payload = verifyToken(token);
    return { payload };
  } catch (error) {
    return {
      response: NextResponse.json(
        { error: `유효하지 않은 토큰입니다. ${error}` },
        { status: 401 }
      ),
    };
  }
}
