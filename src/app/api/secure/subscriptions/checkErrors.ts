import { TokenPayload } from "@/lib/jwt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type CheckErrorProps = {
  payload: TokenPayload;
  plan: "SMART" | "ENTERPRISE";
  locale: string;
};

export const checkErrors = async ({
  payload,
  plan,
  locale,
}: CheckErrorProps) => {
  if (payload.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "SuperAdmin만 구독을 생성할 수 있습니다."
            : "SuperAdminのみ가サブスクリプションを作成できます。",
      },
      { status: 403 }
    );
  }

  if (!payload.churchId) {
    return NextResponse.json(
      {
        error: locale === "ko" ? "교회 ID가 없습니다." : "教会IDがありません。",
      },
      { status: 400 }
    );
  }

  if (!["SMART", "ENTERPRISE"].includes(plan)) {
    return NextResponse.json(
      {
        error:
          locale === "ko" ? "유효하지 않은 플랜입니다." : "無効なプランです。",
      },
      { status: 400 }
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: { churchId: payload.churchId },
    orderBy: { updatedAt: "desc" }, // 최신 데이터 보장
  });
  console.log("POST - Existing subscription:", subscription);
  if (subscription && subscription.plan !== "FREE") {
    return NextResponse.json(
      {
        error:
          locale === "ko"
            ? "이미 구독 중입니다. 구독 관리 페이지에서 변경하세요."
            : "すでにサブスクリプション中です。サブスクリプション管理ページで変更してください。",
      },
      { status: 400 }
    );
  }
};
