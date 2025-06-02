import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> } // Promise로 타입 정의
) {
  // params를 await로 해소
  const { churchId } = await params;

  // Validate churchId
  if (!churchId || typeof churchId !== "string") {
    return NextResponse.json({ error: "Invalid church ID" }, { status: 400 });
  }

  try {
    // Check if church exists
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Fetch positions for the church
    const positions = await prisma.churchPosition.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        churchId: true,
      },
    });

    if (positions.length === 0) {
      return NextResponse.json(
        { error: "No positions found for this church" },
        { status: 404 }
      );
    }

    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error(`Error fetching positions for church ${churchId}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
