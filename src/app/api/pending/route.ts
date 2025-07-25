// src/app/api/pending/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pendingChurches = await prisma.churchApplication.findMany({
      where: { state: "PENDING" },
      select: {
        id: true,
        churchName: true,
        address: true,
        country: true,
        city: true,
        region: true,
        contactName: true,
        contactPhone: true,
        plan: true,
        logo: true,
        churchPhone: true,
        contactGender: true,
        superAdminEmail: true,
      },
    });

    return NextResponse.json({ pendingChurches }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
