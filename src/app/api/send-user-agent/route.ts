// src/app/api/send-user-agent/route.ts
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createKoreaDate } from "@/utils/creatKoreaDate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userAgent, pathname } = await request.json();

    if (!userAgent || !pathname) {
      return NextResponse.json(
        { error: "Missing userAgent or pathname" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }

    const resendFrom = process.env.RESEND_FROM;
    if (!resendFrom) {
      return NextResponse.json(
        { error: "resend email not configured" },
        { status: 500 }
      );
    }

    // 로컬 환경 체크
    const isLocal =
      process.env.NODE_ENV === "development" ||
      request.headers.get("host")?.includes("localhost");

    // GeoIP 조회
    let geoInfo = { country: "Unknown", regionName: "Unknown" };
    try {
      // IP 추출
      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        (isLocal ? "203.0.113.1" : "127.0.0.1"); // 로컬 테스트용 공인 IP
      console.log("Client IP:", clientIp);

      const geoResponse = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=status,message,country,regionName`,
        {
          headers: { Accept: "application/json" },
        }
      );

      console.log("GeoIP response status:", geoResponse.status); // 디버깅 로그
      const geoData = await geoResponse.json();
      console.log("GeoIP response data:", geoData); // 디버깅 로그

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

    const koreaDate = createKoreaDate();
    const emailContent = `
      <h2>New Page Access</h2>
      <p><strong>Pathname:</strong> ${pathname}</p>
      <p><strong>User Agent:</strong> ${userAgent}</p>
      <p><strong>Country:</strong> ${geoInfo.country}</p>
      <p><strong>Region:</strong> ${geoInfo.regionName}</p>
      <p><strong>Time:</strong> ${koreaDate}</p>
    `;

    if (isLocal) {
      // 로컬 환경에서는 이메일 전송 대신 콘솔 출력
      console.log("Local environment detected. Email content (not sent):");
      console.log(emailContent);
      return NextResponse.json(
        { message: "Email not sent in local environment" },
        { status: 200 }
      );
    }

    // 프로덕션 환경에서 이메일 전송
    await resend.emails.send({
      from: "charistian 운영팀 <noreply@charistian.com>", // Resend 기본 도메인 사용
      to: adminEmail,
      subject: `New Page Access: ${pathname}`,
      html: emailContent,
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending user agent email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
