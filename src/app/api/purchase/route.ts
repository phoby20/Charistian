// app/api/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { allowedRoles } from "../scores/allowedRoles";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    return NextResponse.json(
      { error: `유효하지 않은 토큰입니다. ${error}` },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { creationId } = (await req.json()) as { creationId: string };

  const score = await prisma.creation.findUnique({ where: { id: creationId } });
  if (!score || (!score.isPublic && score.churchId !== payload.churchId)) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!score.isForSale || !score.isOriginal) {
    return NextResponse.json(
      { error: "이 악보는 구매할 수 없습니다." },
      { status: 400 }
    );
  }

  const purchase = await prisma.purchase.create({
    data: {
      creationId,
      buyerId: payload.userId,
      amount: score.price!,
      creatorProfit: score.price! * 0.7, // 예: 70% 창작자
      churchProfit: score.price! * 0.2, // 예: 20% 교회
      serviceFee: score.price! * 0.1, // 예: 10% 서비스 수수료
    },
  });

  return NextResponse.json(purchase, { status: 201 });
}
