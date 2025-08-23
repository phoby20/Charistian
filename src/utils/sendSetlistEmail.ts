// src/utils/sendSetlistEmail.ts
import { NextRequest } from "next/server";
import { Resend } from "resend";
import { createKoreaDate } from "@/utils/creatKoreaDate";
import { createEmailContent } from "@/utils/createSetListEmailContent";
import { SetlistsResponse } from "@/types/setList";
import prisma from "@/lib/prisma";
import { getLocalIpAddress } from "./getLocalIpAddress";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSetlistEmail(
  req: NextRequest,
  finalSetlist: SetlistsResponse,
  emailTitle: string
): Promise<void> {
  const resendFrom = process.env.RESEND_FROM;
  if (!resendFrom) {
    console.error("RESEND_FROM 환경 변수가 설정되지 않았습니다.");
    return;
  }

  console.log("콘티 메일 발송 함수 시작");

  // 공유 대상 사용자 조회
  const teamIds = finalSetlist.shares
    .filter((share) => share.team?.id)
    .map((share) => share.team!.id);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { teams: { some: { id: { in: teamIds } } } },
        { email: { not: "" } },
        { emailVerified: true },
      ],
    },
    select: { email: true, name: true },
  });

  // 이메일 내용 생성
  const koreaDate = createKoreaDate();
  const scoresList = finalSetlist.scores
    .map((score, index) => {
      const key = score.selectedKey || "";
      return `<li style="margin-bottom:8px; list-style:none;">
        <span style="display:inline-flex; align-items:center; background-color:#fef2db; color:#af861e; font-size:12px; font-weight:500; padding:2px 8px; border-radius:9999px; margin-right:8px;">
          ${index + 1}
        </span>
        <span style="display:inline-flex; align-items:center; background-color:#dbeafe; color:#1e40af; font-size:12px; font-weight:500; padding:2px 8px; border-radius:9999px; margin-right:8px;">
          ${key}
        </span>
        ${score.creation.title}${
          score.selectedReferenceUrl
            ? `<a href="${score.selectedReferenceUrl}" target="_blank" rel="noopener noreferrer" style="margin-left:6px; display:inline-flex; align-items:center;">
          Reference
        </a>`
            : ""
        }
      </li>`;
    })
    .join("");
  const sharesList = finalSetlist.shares
    .map((share) => {
      if (share.team)
        return `<li style="list-style:none;">${share.team.name}</li>`;
      if (share.user)
        return `<li style="list-style:none;">${share.user.name}</li>`;
      return "";
    })
    .join("");

  const ip = getLocalIpAddress();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ip}:3001`;
  const logoUrl = `${appUrl}/logo_title.png`;
  // 프록시 URL 생성
  const proxyFileUrl = `${appUrl}/api/proxy/setlist/${finalSetlist.id}/file`;

  // createEmailContent에 프록시 URL 전달
  const emailContent = createEmailContent(
    logoUrl,
    { ...finalSetlist, fileUrl: proxyFileUrl }, // setlist의 fileUrl을 프록시 URL로 대체
    scoresList,
    sharesList,
    koreaDate,
    emailTitle
  );

  console.log("이메일 내용 생성 완료");
  console.log("users:", users);

  if (users.length > 0) {
    await resend.emails.send({
      from: resendFrom,
      to: users.map((u) => u.email!),
      subject: `${emailTitle}: ${finalSetlist.title}`,
      html: emailContent,
    });
    console.log(`이메일 전송 완료: ${users.length}명의 사용자에게 전송`);
  } else {
    console.log("공유 대상 사용자가 없습니다.");
  }
}
