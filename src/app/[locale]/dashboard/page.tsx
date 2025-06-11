// src/app/[locale]/dashboard/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { ChurchApplication, User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";
import { motion } from "framer-motion";
import AttendanceStats from "@/components/AttendanceStats";
import MemberStats from "@/components/MemberStats";
import { AttendanceStatsData, fetchData, MemberStatsData } from ".";
import Loading from "@/components/Loading";
import PendingAlerts from "@/components/PendingAlerts";
import ErrorModal from "@/components/ErrorModal";
import MyQRCode from "@/components/MyQRCode";
import QRScanner from "@/components/QRScanner";

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    user,
    isLoading,
    error: authError,
    setError: setAuthError,
  } = useAuth();
  const [pendingChurches, setPendingChurches] = useState<ChurchApplication[]>(
    []
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatsData>({
    todayCount: 0,
    weekRate: 0,
    last7Days: [],
  });
  const [memberStats, setMemberStats] = useState<MemberStatsData>({
    totalMembers: 0,
    roleDistribution: {},
    recentMembers: [],
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string>(""); // 메시지 상태

  useEffect(() => {
    fetchData(
      user,
      isLoading,
      memberStats,
      setPendingChurches,
      setPendingUsers,
      setAttendanceStats,
      setMemberStats,
      setFetchError,
      t
    );
  }, [user, isLoading]);

  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 space-x-4"
        >
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t("dashboard")}
          </h1>
          <div className="flex space-x-2">
            <MyQRCode user={user} scanMessage={scanMessage} />{" "}
            {/* scanMessage 전달 */}
            <QRScanner user={user} onMessage={setScanMessage} />
          </div>
        </motion.div>

        <PendingAlerts
          user={user}
          pendingUsers={pendingUsers}
          pendingChurches={pendingChurches}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <AttendanceStats user={user} attendanceStats={attendanceStats} />
          <MemberStats user={user} memberStats={memberStats} />
        </div>

        <ErrorModal
          authError={authError}
          fetchError={fetchError}
          onClose={() => {
            setAuthError(null);
            setFetchError(null);
            router.push("/");
          }}
        />
      </div>
    </div>
  );
}
