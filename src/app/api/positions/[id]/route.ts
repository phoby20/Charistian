// src/app/api/positions/[id].ts
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

    console.log("Received cookies:", cookieStore.getAll());
    if (!token) {
      console.error("No token found in cookies for /api/positions/[id]");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log("Decoded JWT:", decoded);
    } catch (error) {
      console.error("Token verification failed", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "MASTER" && decoded.role !== "SUPER_ADMIN") {
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
    const { newName } = await req.json();

    console.log("Requested position ID:", id);
    console.log("JWT churchId:", churchId);
    console.log("New name:", newName);

    if (!id || !newName) {
      console.error("Missing position ID or new name");
      return NextResponse.json(
        { error: "Position ID and new name required" },
        { status: 400 }
      );
    }

    const existingPosition = await prisma.churchPosition.findUnique({
      where: { id },
    });

    console.log("Existing position:", existingPosition);

    if (!existingPosition) {
      console.error(`Position with ID ${id} not found`);
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    if (existingPosition.churchId !== churchId) {
      console.error(
        `Position churchId ${existingPosition.churchId} does not match JWT churchId ${churchId}`
      );
      return NextResponse.json(
        { error: "Position not found in your church" },
        { status: 404 }
      );
    }

    const duplicatePosition = await prisma.churchPosition.findFirst({
      where: { churchId, name: newName },
    });

    if (duplicatePosition) {
      console.error(
        `Position name ${newName} already exists in church ${churchId}`
      );
      return NextResponse.json(
        { error: "New position name already exists" },
        { status: 400 }
      );
    }

    const updatedPosition = await prisma.$transaction(async (tx) => {
      const updatedPosition = await tx.churchPosition.update({
        where: { id },
        data: { name: newName },
      });

      await tx.user.updateMany({
        where: { churchId, position: existingPosition.name },
        data: { position: newName },
      });

      return updatedPosition;
    });

    return NextResponse.json(
      { message: "Position updated", position: updatedPosition },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("Received cookies:", cookieStore.getAll());
    if (!token) {
      console.error("No token found in cookies for /api/positions/[id]");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log("Decoded JWT:", decoded);
    } catch (error) {
      console.error("Token verification failed", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "MASTER" && decoded.role !== "SUPER_ADMIN") {
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
    console.log("Requested position ID:", id);
    console.log("JWT churchId:", churchId);

    if (!id) {
      console.error("Missing position ID");
      return NextResponse.json(
        { error: "Position ID required" },
        { status: 400 }
      );
    }

    const position = await prisma.churchPosition.findUnique({
      where: { id },
    });

    console.log("Existing position:", position);

    if (!position || position.churchId !== churchId) {
      console.error(`Position with ID ${id} not found or churchId mismatch`);
      return NextResponse.json(
        {
          error: position
            ? "Position not found in your church"
            : "Position not found",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.churchPosition.delete({
        where: { id },
      });

      await tx.user.updateMany({
        where: { churchId, position: position.name },
        data: { position: null },
      });
    });

    return NextResponse.json({ message: "Position deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
