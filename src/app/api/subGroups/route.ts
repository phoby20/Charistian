// src/app/api/subGroups/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const churchId = searchParams.get("churchId");

    if (!groupId || !churchId) {
      return NextResponse.json(
        { error: "groupId and churchId are required" },
        { status: 400 }
      );
    }

    const subGroups = await prisma.subGroup.findMany({
      where: {
        groupId,
        churchId,
      },
      select: {
        id: true,
        name: true,
        groupId: true,
      },
    });

    return NextResponse.json({ subGroups });
  } catch (error) {
    console.error("Error fetching subGroups:", error);
    return NextResponse.json(
      { error: "Failed to fetch subGroups" },
      { status: 500 }
    );
  }
}
