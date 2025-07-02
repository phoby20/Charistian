// src/app/api/reset-password/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, locale } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 비밀번호 재설정 토큰 생성
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후 만료

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 비밀번호 재설정 링크
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/reset-password/confirm?token=${token}`;

    // 이메일 템플릿 (이전 답변의 스타일 유지)
    await resend.emails.send({
      from: "charistian 운영팀 <noreply@charistian.com>",
      to: email,
      subject:
        locale === "ja" ? "パスワードリセットのご依頼" : "비밀번호 재설정 요청",
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${locale === "ja" ? "パスワードリセット" : "비밀번호 재설정"}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    background-color: #f9fafb;
                    color: #333333;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.5;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 6px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 15px;
                    text-align: center;
                }
                p {
                    font-size: 16px;
                    color: #374151;
                    margin: 8px 0;
                }
                a {
                    color: #3b82f6;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #3b82f6;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    text-align: center;
                    transition: background-color 0.2s ease;
                    margin: 20px 0;
                }
                .button:hover {
                    background-color: #2563eb;
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${locale === "ja" ? "パスワードリセット" : "비밀번호 재설정"}</h1>
                <p>${locale === "ja" ? `こんにちは、${user.name}様、` : `안녕하세요, ${user.name}님,`}</p>
                <p>${locale === "ja" ? "パスワードリセットのご依頼をいただきました。以下のボタンをクリックしてパスワードをリセットしてください。" : "비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 비밀번호를 재설정하세요."}</p>
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">${locale === "ja" ? "パスワードをリセットする" : "비밀번호 재설정하기"}</a>
                </div>
                <p>${locale === "ja" ? "このリンクは1時間有効です。ご依頼されていない場合は、このメールを無視してください。" : "링크는 1시간 동안 유효합니다. 요청하지 않았다면 이 이메일을 무시하세요."}</p>
                <div class="footer">
                    <p>${locale === "ja" ? "このメールはCharistianから自動送信されました。" : "이 이메일은 Charistian에서 자동 발송되었습니다."}</p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json(
      { message: "Reset password email sent" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        message: "Server error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
