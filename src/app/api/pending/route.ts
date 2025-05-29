// src/app/api/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pendingChurches = await prisma.churchApplication.findMany({
      where: { state: "PENDING" },
      select: { id: true, churchName: true, address: true },
    });
    const pendingUsers = await prisma.user.findMany({
      where: { state: "PENDING" },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(
      { pendingChurches, pendingUsers },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
