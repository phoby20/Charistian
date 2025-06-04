import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      churchId: string | null;
    };

    const { role, churchId } = decoded;

    if (!churchId) {
      return NextResponse.json(
        { error: "Invalid or missing churchId" },
        { status: 403 }
      );
    }

    if (!["MASTER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const editingTeamId = req.nextUrl.pathname.split("/").pop();
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Team name are required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id: editingTeamId, churchId },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      churchId: string | null;
    };

    const { role, churchId } = decoded;

    if (!churchId) {
      return NextResponse.json(
        { error: "Invalid or missing churchId" },
        { status: 403 }
      );
    }

    if (!["MASTER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const deletingTeamId = req.nextUrl.pathname.split("/").pop();

    if (!deletingTeamId || typeof deletingTeamId !== "string") {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id: deletingTeamId, churchId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
