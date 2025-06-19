import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Church ID is required" },
        { status: 400 }
      );
    }

    const church = await prisma.church.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    return NextResponse.json({ name: church.name }, { status: 200 });
  } catch (error) {
    console.error("Error fetching church:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
