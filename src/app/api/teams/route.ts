// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const queryChurchId = searchParams.get("churchId");

    if (!queryChurchId || queryChurchId !== churchId) {
      return NextResponse.json(
        { error: "Invalid or missing churchId" },
        { status: 403 }
      );
    }

    if (!["MASTER", "SUPER_ADMIN", "ADMIN", "GENERAL"].includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const teams = await prisma.team.findMany({
      where: { churchId },
      select: { id: true, name: true },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: { name, churchId },
      select: { id: true, name: true },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
