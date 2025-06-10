"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChurchApplication, User } from "@prisma/client";
import { useRouter } from "@/utils/useRouter";

interface PendingAlertsProps {
  user: User | null;
  pendingUsers: User[];
  pendingChurches: ChurchApplication[];
}

export default function PendingAlerts({
  user,
  pendingUsers,
  pendingChurches,
}: PendingAlertsProps) {
  const t = useTranslations();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="space-y-4">
      {pendingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md cursor-pointer hover:bg-yellow-200 transition-colors"
          onClick={() => router.push(`/pending-users`)}
          role="button"
          aria-label={t("pendingUsersWarning")}
        >
          {t("pendingUsersWarning", { count: pendingUsers.length })}
        </motion.div>
      )}
      {user.role === "MASTER" && pendingChurches.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md cursor-pointer hover:bg-yellow-200 transition-colors"
          onClick={() => router.push(`/pending-churches`)}
          role="button"
          aria-label={t("pendingChurchesWarning")}
        >
          {t("pendingChurchesWarning", { count: pendingChurches.length })}
        </motion.div>
      )}
    </div>
  );
}
