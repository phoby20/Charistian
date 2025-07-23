// src/utils/sendSetlistEmail.ts
import { NextRequest } from "next/server";
import { Resend } from "resend";
import { createKoreaDate } from "@/utils/creatKoreaDate";
import { createEmailContent } from "@/utils/createSetListEmailContent";
import { SetlistResponse } from "@/types/setList";
import prisma from "@/lib/prisma";
import { getLocalIpAddress } from "./getLocalIpAddress";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSetlistEmail(
  req: NextRequest,
  setlist: SetlistResponse,
  emailTitle: string
): Promise<void> {
  const resendFrom = process.env.RESEND_FROM;
  if (!resendFrom) {
    console.error("RESEND_FROM 환경 변수가 설정되지 않았습니다.");
    return;
  }

  const isLocal =
    process.env.NODE_ENV === "development" ||
    req.headers.get("host")?.includes("localhost");

  // 공유 대상 사용자 조회
  const groupIds = setlist.shares
    .filter((share) => share.group?.id)
    .map((share) => share.group!.id);
  const teamIds = setlist.shares
    .filter((share) => share.team?.id)
    .map((share) => share.team!.id);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { groups: { some: { id: { in: groupIds } } } },
        { teams: { some: { id: { in: teamIds } } } },
        { email: { not: "" } },
        { emailVerified: true },
      ],
    },
    select: { email: true, name: true },
  });

  // 이메일 내용 생성
  const koreaDate = createKoreaDate();
  const scoresList = setlist.scores
    .map((score) => `<li>${score.creation.title}</li>`)
    .join("");
  const sharesList = setlist.shares
    .map((share) => {
      if (share.group) return `<li>그룹: ${share.group.name}</li>`;
      if (share.team) return `<li>팀: ${share.team.name}</li>`;
      if (share.user) return `<li>사용자: ${share.user.name}</li>`;
      return "";
    })
    .join("");

  const ip = getLocalIpAddress();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ip}:3001`;
  const logoUrl = `${appUrl}/logo.png`;
  // 프록시 URL 생성
  const proxyFileUrl = `${appUrl}/api/proxy/setlist/${setlist.id}/file`;

  // createEmailContent에 프록시 URL 전달
  const emailContent = createEmailContent(
    logoUrl,
    { ...setlist, fileUrl: proxyFileUrl }, // setlist의 fileUrl을 프록시 URL로 대체
    scoresList,
    sharesList,
    koreaDate,
    emailTitle
  );

  if (isLocal) {
    console.log("Local environment detected. Email content (not sent):");
    console.log("To:", users.map((u) => u.email).join(", "));
    console.log(`이메일 전송 완료: ${users.length}명의 사용자에게 전송`);
  } else if (users.length > 0) {
    await resend.emails.send({
      from: resendFrom,
      to: users.map((u) => u.email!),
      subject: `${emailTitle}: ${setlist.title}`,
      html: emailContent,
    });
    console.log(`이메일 전송 완료: ${users.length}명의 사용자에게 전송`);
  } else {
    console.log("공유 대상 사용자가 없습니다.");
  }
}
