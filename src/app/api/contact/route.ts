import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactFormData = await req.json();
    const { name, email, message } = body;

    // 입력 검증
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "유효한 메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const response = await resend.emails.send({
      from: `charistian 운영팀 <${process.env.RESEND_FROM}>`,
      to: `${process.env.ADMIN_EMAIL}`,
      subject: `새 문의: ${name}님 (${email})`,
      html: `
        <h1>새 문의가 접수되었습니다</h1>
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>메일 주소:</strong> ${email}</p>
        <p><strong>문의 내용:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    console.log("Resend 발송 응답:", response);

    return NextResponse.json(
      { message: "문의가 성공적으로 전송되었습니다." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Resend 이메일 발송 실패:", error);

    // error가 Error 객체인지 확인
    const errorMessage =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";

    if (errorMessage.includes("mailbox full")) {
      return NextResponse.json(
        {
          error:
            "수신자 메일함이 가득 차 있어 메일 발송에 실패했습니다. 나중에 다시 시도해주세요.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `이메일 발송에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
