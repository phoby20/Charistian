// src/app/api/churches/filter/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get("country");
    const city = request.nextUrl.searchParams.get("city");
    const region = request.nextUrl.searchParams.get("region");

    if (!country || !city || !region) {
      return NextResponse.json(
        { error: "Country, city, and region are required" },
        { status: 400 }
      );
    }

    const churches = await prisma.church.findMany({
      where: {
        country,
        city,
        region,
        state: "APPROVED",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(churches);
  } catch (error) {
    console.error("Error fetching churches:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
