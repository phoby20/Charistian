// src/app/api/duties/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("churchId");

    if (!churchId) {
      return NextResponse.json(
        { error: "churchId is required" },
        { status: 400 }
      );
    }

    const duties = await prisma.duty.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ duties });
  } catch (error) {
    console.error("Error fetching duties:", error);
    return NextResponse.json(
      { error: "Failed to fetch duties" },
      { status: 500 }
    );
  }
}
