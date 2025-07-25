// src/components/UsageLimitCard.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plan, User } from "@prisma/client";
import ProgressBar from "../ProgressBar";
import Button from "../Button";

interface UsageLimit {
  plan: Plan;
  maxUsers: number;
  remainingUsers: number;
  weeklySetlists: number;
  remainingWeeklySetlists: number;
  monthlySetlists: number;
  remainingMonthlySetlists: number;
  maxScores: number;
  remainingScores: number;
}

interface UsageLimitCardProps {
  user: User;
  usageLimit: UsageLimit | null;
}

export default function UsageLimitCard({
  user,
  usageLimit,
}: UsageLimitCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  if (!usageLimit) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("planAndUsage")}</h2>
        {/* 플랜 관리 링크 */}
        {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
          <Link href={`/${locale}/plans`}>
            <Button aria-label={t("managePlan")}>{t("managePlan")}</Button>
          </Link>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-full space-y-4">
            {/* 성도 수 */}
            <ProgressBar
              label={t("registeredMembers")}
              remaining={usageLimit.remainingUsers}
              max={usageLimit.maxUsers}
              color="bg-blue-500"
            />
            {/* 주간 콘티 수 */}
            <ProgressBar
              label={t("weeklySetlists")}
              remaining={usageLimit.remainingWeeklySetlists}
              max={usageLimit.weeklySetlists}
              color="bg-green-500"
            />
          </div>
          <div className="w-full space-y-4">
            {/* 월간 콘티 수 */}
            <ProgressBar
              label={t("monthlySetlists")}
              remaining={usageLimit.remainingMonthlySetlists}
              max={usageLimit.monthlySetlists}
              color="bg-orange-500"
            />
            {/* 악보 업로드 수 */}
            <ProgressBar
              label={t("scoreUploads")}
              remaining={usageLimit.remainingScores}
              max={usageLimit.maxScores}
              color="bg-purple-500"
            />
          </div>
        </div>
        {/* 플랜 */}
        <p className="text-sm font-medium text-gray-700">
          {t("plan")}: {usageLimit.plan}
        </p>
      </div>
    </motion.div>
  );
}
