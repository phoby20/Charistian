// src/app/api/church/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { churchId } = await req.json();
    await prisma.churchApplication.update({
      where: { id: churchId },
      data: { state: "REJECTED" },
    });
    // TODO: Implement email sending with rejection reason
    return NextResponse.json({ message: "Church rejected" }, { status: 200 });
  } catch (error) {
    console.error("Error rejecting church:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
