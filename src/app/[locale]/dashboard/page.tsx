"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/Button";
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

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading, error: authError } = useAuth();
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

  // Fetch pending and stats data
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
  }, [user, isLoading, memberStats.totalMembers]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t("dashboard")}
          </h1>
          <div className="space-y-2">
            {["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
              <Button
                onClick={() => router.push("/signup")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {t("addMember")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Pending Alerts */}
        <PendingAlerts
          user={user}
          pendingUsers={pendingUsers}
          pendingChurches={pendingChurches}
        />

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <AttendanceStats user={user} attendanceStats={attendanceStats} />
          <MemberStats user={user} memberStats={memberStats} />
        </div>

        {/* Error Modal */}
        <ErrorModal
          authError={authError}
          fetchError={fetchError}
          onClose={() => setFetchError(null)}
        />
      </div>
    </div>
  );
}
