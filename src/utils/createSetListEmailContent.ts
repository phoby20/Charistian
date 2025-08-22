// src/utils/createSetListEmailContent.ts
import { SetlistsResponse } from "@/types/setList";

export function createEmailContent(
  logoUrl: string,
  finalSetlist: SetlistsResponse,
  scoresList: string,
  sharesList: string,
  koreaDate: string,
  emailTitle: string // 동적 제목 인수 추가
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="${logoUrl}" alt="Charistian Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;" />
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">${emailTitle}</h2>
      </div>

      <!-- Content -->
      <div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">제목</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">${finalSetlist.title}</p>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">찬양 날짜</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">
            ${new Date(finalSetlist.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">설명</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">${finalSetlist.description || "없음"}</p>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">교회</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">${finalSetlist.church.name}</p>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">작성자</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">${finalSetlist.creator.name}</p>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">악보 목록</p>
          <ul style="list-style-type: disc; margin:8px 0 0 20px; color:#111827; font-size:16px; padding:0;">
            ${scoresList}
          </ul>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">공유 대상</p>
          <ul style="list-style-type: disc; margin:8px 0 0 20px; color:#111827; font-size:16px; padding:0;">
            ${sharesList}
          </ul>
        </div>
        <div style="background-color:#ffffff; border-radius:6px; padding:12px 16px; margin-bottom:12px;">
          <p style="margin:0; color:#6b7280; font-size:14px;">${emailTitle.includes("업데이트") ? "업데이트 시간" : "생성 시간"}</p>
          <p style="margin:4px 0 0; color:#111827; font-size:16px; font-weight:500;">${koreaDate}</p>
        </div>
      </div>

      <!-- Button -->
      <div style="text-align: center; padding: 18px 0 10px;">
        <a href="${finalSetlist.fileUrl}" style="display: inline-block; padding: 14px 32px; background-color: #fc089e; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 17px; font-weight: 600; letter-spacing: 0.02em; transition: background-color 0.2s ease;">
          통합 악보 열기
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 26px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 15px; margin: 0;">
          이 이메일은 Charistian에서 자동 발송되었습니다.
        </p>
        <p style="color: #9ca3af; font-size: 15px; margin: 8px 0 0;">
        </p>
      </div>
    </div>
  `;
}
