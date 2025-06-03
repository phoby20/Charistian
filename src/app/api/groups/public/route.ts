// src/app/api/groups/public/route.ts
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

    const groups = await prisma.group.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
