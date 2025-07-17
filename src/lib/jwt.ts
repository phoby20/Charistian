import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export type TokenPayload = {
  // JWT 토큰의 페이로드 타입 정의
  userId: string; // 사용자 ID
  role:
    | "MASTER"
    | "SUPER_ADMIN"
    | "ADMIN"
    | "SUB_ADMIN"
    | "GENERAL"
    | "CHECKER"
    | "VISITOR"; // 사용자 역할
  churchId?: string; // 교회 ID (선택적)
};

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
