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
      where: { groupId, churchId },
      select: { id: true, name: true, groupId: true, churchId: true },
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

export async function POST(request: Request) {
  try {
    const { name, groupId, churchId } = await request.json();

    if (!name || !groupId || !churchId) {
      return NextResponse.json(
        { error: "name, groupId, and churchId are required" },
        { status: 400 }
      );
    }

    const subGroup = await prisma.subGroup.create({
      data: { name, groupId, churchId },
      select: { id: true, name: true, groupId: true, churchId: true },
    });

    return NextResponse.json({ subGroup });
  } catch (error) {
    console.error("Error creating subGroup:", error);
    return NextResponse.json(
      { error: "Failed to create subGroup" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const { name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "id and name are required" },
        { status: 400 }
      );
    }

    const subGroup = await prisma.subGroup.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, groupId: true, churchId: true },
    });

    return NextResponse.json({ subGroup });
  } catch (error) {
    console.error("Error updating subGroup:", error);
    return NextResponse.json(
      { error: "Failed to update subGroup" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.subGroup.delete({ where: { id } });

    return NextResponse.json({ message: "SubGroup deleted successfully" });
  } catch (error) {
    console.error("Error deleting subGroup:", error);
    return NextResponse.json(
      { error: "Failed to delete subGroup" },
      { status: 500 }
    );
  }
}
