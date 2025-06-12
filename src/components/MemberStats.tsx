"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { User } from "@prisma/client";
import { toCamelCase } from "@/utils/toCamelCase";

interface MemberStatsData {
  totalMembers: number;
  roleDistribution: { [role: string]: number };
  recentMembers: User[];
}

interface MemberStatsProps {
  user: User | null;
  memberStats: MemberStatsData;
}

export default function MemberStats({ user, memberStats }: MemberStatsProps) {
  const t = useTranslations();

  if (
    !user ||
    !["MASTER", "SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role)
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4">{t("memberStats")}</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 font-bold">{t("totalMembers")}</p>
          <p className="text-2xl font-bold text-blue-600">
            {memberStats.totalMembers}
          </p>
        </div>
        <div className="mb-10">
          <h3 className="text-gray-600 font-bold mb-1">
            {t("roleDistribution")}
          </h3>
          <ul className="text-sm">
            {Object.entries(memberStats.roleDistribution).map(
              ([role, count]) => (
                <li
                  key={role}
                  className="flex justify-between text-gray-500 mb-1"
                >
                  <span>{t(toCamelCase(role))}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              )
            )}
          </ul>
        </div>
        <div className="mb-10">
          <p className="text-gray-600 font-bold mb-1">{t("recentMembers")}</p>
          <ul className="text-sm">
            {memberStats.recentMembers.map((m) => (
              <li
                key={m.id}
                className="flex justify-between text-gray-500 mb-1"
              >
                <span>{m.name}</span>
                <span>{format(new Date(m.createdAt), "yyyy-MM-dd")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
