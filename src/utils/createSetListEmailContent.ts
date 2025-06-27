// src/utils/createSetListEmailContent.ts
import { SetlistResponse } from "@/types/setList";

export function createEmailContent(
  logoUrl: string,
  finalSetlist: SetlistResponse,
  scoresList: string,
  sharesList: string,
  koreaDate: string,
  emailTitle: string // 동적 제목 인수 추가
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="${logoUrl}" alt="Charistian Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">${emailTitle}</h2>
      </div>

      <!-- Content -->
      <div style="background-color: #ffffff; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 16px; margin: 8px 0;">
          <strong style="color: #1f2937;">제목:</strong> ${finalSetlist.title}
        </p>
        <p style="color: #374151; font-size: 16px; margin: 8px 0;">
          <strong style="color: #1f2937;">날짜:</strong> ${new Date(finalSetlist.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p style="color: #374151; font-size: 16px; margin: 8px 0;">
          <strong style="color: #1f2937;">설명:</strong> ${finalSetlist.description || "없음"}
        </p>
        <p style="color: #374151; font-size: 16px; margin: 8px 0;">
          <strong style="color: #1f2937;">교회:</strong> ${finalSetlist.church.name}
        </p>
        <p style="color: #374151; font-size: 16px; margin: 8px 0;">
          <strong style="color: #1f2937;">작성자:</strong> ${finalSetlist.creator.name}
        </p>
        <p style="color: #374151; font-size: 16px; margin: 8px 0 12px;">
          <strong style="color: #1f2937;">악보 목록:</strong>
        </p>
        <ul style="list-style-type: disc; margin-left: 20px; color: #374151; font-size: 16px;">
          ${scoresList}
        </ul>
        <p style="color: #374151; font-size: 16px; margin: 12px 0;">
          <strong style="color: #1f2937;">공유 대상:</strong>
        </p>
        <ul style="list-style-type: disc; margin-left: 20px; color: #374151; font-size: 16px;">
          ${sharesList}
        </ul>
        <p style="color: #374151; font-size: 16px; margin: 12px 0;">
          <strong style="color: #1f2937;">${emailTitle.includes("업데이트") ? "업데이트 시간" : "생성 시간"}:</strong> ${koreaDate}
        </p>
      </div>

      <!-- Button -->
      <div style="text-align: center; padding: 10px 0;">
        <a href="${finalSetlist.fileUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500; transition: background-color 0.2s ease;">
          PDF 다운로드
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          이 이메일은 Charistian에서 자동 발송되었습니다.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
          문의사항이 있으시면 <a href="mailto:support@charistian.com" style="color: #3b82f6; text-decoration: none;">support@charistian.com</a>으로 연락 주세요.
        </p>
      </div>
    </div>
  `;
}
