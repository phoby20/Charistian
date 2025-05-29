import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

// 환경 변수에서 Stripe 비밀 키 확인
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Plan 열거형 값 정의 (schema.prisma와 동기화)
const validPlans = ["FREE", "SMART", "ENTERPRISE"] as const;
type Plan = (typeof validPlans)[number];

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      searchParams.session_id
    );
    const churchId = session.metadata?.churchId;

    if (!churchId) {
      return <div>오류: Church ID가 제공되지 않았습니다.</div>;
    }

    // plan 검증
    const rawPlan = session.metadata?.plan?.toUpperCase();
    const plan: Plan = validPlans.includes(rawPlan as Plan)
      ? (rawPlan as Plan)
      : "FREE";

    await prisma.church.update({
      where: { id: churchId },
      data: {
        state: "APPROVED", // status -> state
        plan, // 검증된 plan 사용
      },
    });

    return <div>결제 성공! 서비스를 바로 이용할 수 있습니다.</div>;
  } catch (error) {
    console.error("Error updating church:", error);
    return <div>오류: 결제 처리 중 문제가 발생했습니다.</div>;
  } finally {
    await prisma.$disconnect();
  }
}
