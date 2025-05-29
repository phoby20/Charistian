import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import * as bcrypt from "bcrypt"; // bcrypt 임포트

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!["ADMIN", "SUPER_ADMIN", "MASTER"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: decoded.role === "MASTER" ? {} : { churchId: decoded.churchId },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!["ADMIN", "SUPER_ADMIN", "MASTER"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const user = await prisma.user.create({
    data: {
      ...data,
      password: await bcrypt.hash(data.password, 10),
      role: "GENERAL",
      status: "PENDING",
    },
  });
  return NextResponse.json(user);
}
