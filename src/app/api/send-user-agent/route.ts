// src/app/api/send-user-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createKoreaDate } from "@/utils/creatKoreaDate";

export async function POST(request: NextRequest) {
  try {
    const { userAgent, pathname } = await request.json();

    if (!userAgent || !pathname) {
      return NextResponse.json(
        { error: "Missing userAgent or pathname" },
        { status: 400 }
      );
    }

    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    const slackChannelId = process.env.SLACK_CHANNEL_ID || "C0766MHSM0C";

    if (!slackBotToken) {
      return NextResponse.json(
        { error: "Slack Bot Token not configured" },
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
      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
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

    const koreaDate = createKoreaDate();
    const slackMessage = {
      channel: slackChannelId,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🌐 새 페이지 접속: ${pathname}`,
            emoji: true,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📍 경로*\n${pathname}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🌍 위치*\n국가: ${geoInfo.country}\n지역: ${geoInfo.regionName}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*⏰ 시간*\n${koreaDate}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🖥️ 사용자 에이전트*\n${userAgent}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `${new Date().toISOString()}에 Charistian Bot이 생성`,
            },
          ],
        },
      ],
    };

    // 프로덕션 환경에서 Slack 메시지 전송
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    const responseData = await response.json();
    if (!response.ok || !responseData.ok) {
      console.error("Slack API error:", responseData.error || responseData);
      return NextResponse.json(
        { error: "Failed to send Slack message" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Slack message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return NextResponse.json(
      { error: "Failed to send Slack message" },
      { status: 500 }
    );
  }
}
