// src/pages/api/church/send-verification-email.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailRequest {
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as SendVerificationEmailRequest;

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    // 6자리 인증번호 생성
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 인증번호 유효 기간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // EmailVerification 레코드 생성 또는 업데이트
    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        verificationCode,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        email,
        verificationCode,
        expiresAt,
        createdAt: new Date(),
      },
    });

    // Resend를 통해 인증 이메일 전송
    const { error } = await resend.emails.send({
      from: "Charistian 운영팀 <noreply@charistian.com>",
      to: [email],
      subject: "Charistian 교회 등록 이메일 인증",
      html: `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Charistian 이메일 인증</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f4f4f9;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(90deg, #2563eb, #7c3aed);
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #ffffff;
              font-weight: 600;
            }
            .content {
              padding: 32px;
              text-align: center;
            }
            .content p {
              font-size: 16px;
              line-height: 1.5;
              margin: 0 0 16px;
              color: #4b5563;
            }
            .code {
              display: inline-block;
              background: #eff6ff;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 2px;
              margin: 16px 0;
            }
            .footer {
              background: #f4f4f9;
              padding: 16px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .footer a {
              color: #2563eb;
              text-decoration: none;
              font-weight: 500;
            }
            @media (max-width: 600px) {
              .container {
                margin: 16px;
              }
              .content {
                padding: 24px;
              }
              .header h1 {
                font-size: 20px;
              }
              .code {
                font-size: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Charistian 이메일 인증</h1>
            </div>
            <div class="content">
              <p>교회 등록을 완료하려면 아래 인증번호를 입력하세요.</p>
              <div class="code">${verificationCode}</div>
              <p>이 코드는 10분간 유효합니다.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Charistian. All rights reserved.</p>
              <p><a href="https://charistian.com">charistian.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend 이메일 전송 오류:", error);
      return NextResponse.json(
        { error: "이메일 전송에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "인증 이메일이 전송되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("인증 이메일 전송 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
