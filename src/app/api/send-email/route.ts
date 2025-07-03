// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, subject, message, locale } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { message: "모든 필드를 입력해야 합니다." },
        { status: 400 }
      );
    }

    // 이메일 템플릿
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f9fafb;
            color: #333333;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 20px;
            text-align: center;
          }
          p {
            font-size: 16px;
            color: #374151;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .footer p {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0;
          }
          a {
            color: #3b82f6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${subject}</h1>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <div class="footer">
            <p>${locale === "ja" ? "このメールはCharistianから送信されました。" : "이 이메일은 Charistian에서 발송되었습니다."}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "Charistian 운영팀 <noreply@charistian.com>",
      to: email,
      subject,
      html: emailHtml,
    });

    return NextResponse.json(
      { message: "이메일이 성공적으로 전송되었습니다." },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: err instanceof Error ? err.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
