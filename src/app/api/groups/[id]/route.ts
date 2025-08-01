// src/app/api/duties/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-secret-key";

interface JwtPayload {
  userId: string;
  churchId?: string;
  role: string;
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("No token found in cookies for /api/duties/[id]");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "SUPER_ADMIN") {
      console.error("Unauthorized role:", decoded.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const churchId = decoded.churchId;
    if (!churchId) {
      console.error("No churchId in JWT payload");
      return NextResponse.json(
        { error: "Church ID required" },
        { status: 400 }
      );
    }

    const id = req.nextUrl.pathname.split("/").pop();
    const { name } = await req.json();

    if (!id || !name) {
      console.error("Missing group ID or name");
      return NextResponse.json(
        { error: "Group ID and name required" },
        { status: 400 }
      );
    }

    const existingRole = await prisma.group.findFirst({
      where: { name, churchId, id: { not: id } },
    });
    if (existingRole) {
      console.error(`Group name ${name} already exists in church ${churchId}`);
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 400 }
      );
    }

    const group = await prisma.group.update({
      where: { id, churchId },
      data: { name },
    });

    return NextResponse.json(
      { message: "Group updated", group },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("No token found in cookies for /api/duties/[id]");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "SUPER_ADMIN") {
      console.error("Unauthorized role:", decoded.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const churchId = decoded.churchId;
    if (!churchId) {
      console.error("No churchId in JWT payload");
      return NextResponse.json(
        { error: "Church ID required" },
        { status: 400 }
      );
    }

    const id = req.nextUrl.pathname.split("/").pop();

    if (!id) {
      console.error("Missing group ID");
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.group.delete({
        where: { id, churchId },
      }),
    ]);

    return NextResponse.json({ message: "Group deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
