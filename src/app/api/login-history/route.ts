import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { getKoreaDate } from "@/utils/creatKoreaDate";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        gender: true,
        position: true,
        role: true,
        email: true,
        churchId: true,
        church: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 로컬 환경 체크
    const isLocal =
      process.env.NODE_ENV === "development" ||
      req.headers.get("host")?.includes("localhost");

    // GeoIP 조회
    let geoInfo = { country: "Unknown", regionName: "Unknown" };

    try {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        (isLocal ? "203.0.113.1" : "127.0.0.1");
      console.log("Client IP:", clientIp);

      const geoResponse = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=status,message,country,regionName`,
        {
          headers: { Accept: "application/json" },
        }
      );

      console.log("GeoIP response status:", geoResponse.status);
      const geoData = await geoResponse.json();
      console.log("GeoIP response data:", geoData);

      if (geoResponse.ok && geoData.status === "success") {
        geoInfo = {
          country: geoData.country || "Unknown",
          regionName: geoData.regionName || "Unknown",
        };
      } else {
        console.warn("GeoIP API failed:", geoData.message || "Unknown error");
      }
    } catch (geoError) {
      console.error("Error fetching GeoIP:", geoError);
    }

    const koreaDate = getKoreaDate();

    const loginHistory = await prisma.loginHistory.create({
      data: {
        userId: user.id,
        userName: user.name,
        userGender: user.gender,
        userPosition: user.position,
        userRole: user.role,
        userEmail: user.email,
        churchId: user.churchId,
        churchName: user.church?.name,
        loginTime: koreaDate,
        location: `${geoInfo.country}, ${geoInfo.regionName}`,
      },
    });

    return NextResponse.json({ loginHistory }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("로그인 기록 저장 오류:", errorMessage);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const isAdmin = ["MASTER", "SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(
      payload.role
    );
    if (!isAdmin && userId && userId !== payload.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const where = isAdmin
      ? userId
        ? { userId }
        : {}
      : { userId: payload.userId };

    const [loginHistories, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        orderBy: { loginTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          userName: true,
          userGender: true,
          userPosition: true,
          userRole: true,
          userEmail: true,
          churchId: true,
          churchName: true,
          loginTime: true,
          location: true,
          createdAt: true,
        },
      }),
      prisma.loginHistory.count({ where }),
    ]);

    return NextResponse.json(
      {
        loginHistories,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("로그인 기록 조회 오류:", errorMessage);
    return NextResponse.json(
      { error: "loginHistoryFetchFailed", details: errorMessage },
      { status: 500 }
    );
  }
}
