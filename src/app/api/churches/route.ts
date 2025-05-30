// src/app/api/churches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (decoded.role !== "MASTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const churches = await prisma.church.findMany();
  return NextResponse.json(churches);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const existingChurch = await prisma.church.findFirst({
    where: { name: data.name, address: data.address },
  });
  if (existingChurch) {
    return NextResponse.json(
      { error: "Church already exists" },
      { status: 400 }
    );
  }

  const church = await prisma.church.create({
    data: {
      ...data,
      status: "PENDING",
    },
  });
  return NextResponse.json(church);
}
