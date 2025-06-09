"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";
import { ChurchApplication, User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";

interface AttendanceRecord {
  userId: string;
  date: string;
}

interface MemberStats {
  totalMembers: number;
  roleDistribution: { [role: string]: number };
  recentMembers: User[];
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading, error: authError } = useAuth();
  const [pendingChurches, setPendingChurches] = useState<ChurchApplication[]>(
    []
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{
    todayCount: number;
    weekRate: number;
    last7Days: { date: string; count: number }[];
  }>({ todayCount: 0, weekRate: 0, last7Days: [] });
  const [memberStats, setMemberStats] = useState<MemberStats>({
    totalMembers: 0,
    roleDistribution: {},
    recentMembers: [],
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch pending and stats data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || isLoading) return;

      try {
        // Fetch pending data
        const pendingResponse = await fetch("/api/pending", {
          credentials: "include",
        });
        if (!pendingResponse.ok)
          throw new Error("Failed to fetch pending data");
        const { pendingChurches, pendingUsers } = await pendingResponse.json();
        setPendingChurches(pendingChurches);

        if (["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user.role)) {
          if (user.churchId) {
            const filteredUsers = pendingUsers.filter(
              (userData: User) => userData.churchId === user.churchId
            );
            setPendingUsers(filteredUsers);
          } else {
            setPendingUsers([]);
          }
        } else {
          setPendingUsers([]);
        }

        // Fetch attendance stats (SUPER_ADMIN, ADMIN only)
        if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
          const today = new Date();
          const startDate = subDays(today, 7).toISOString().split("T")[0];
          const endDate = today.toISOString().split("T")[0];

          const attendanceResponse = await fetch(
            `/api/attendance/search?startDate=${startDate}&endDate=${endDate}`,
            { credentials: "include" }
          );
          if (!attendanceResponse.ok)
            throw new Error("Failed to fetch attendance");
          const { attendances }: { attendances: AttendanceRecord[] } =
            await attendanceResponse.json();

          // Today’s attendance count
          const todayCount = attendances.filter(
            (att) => att.date === endDate
          ).length;

          // Weekly attendance rate (assuming total members as denominator)
          const weekAttendees = new Set(attendances.map((att) => att.userId))
            .size;
          const weekRate =
            memberStats.totalMembers > 0
              ? (weekAttendees / memberStats.totalMembers) * 100
              : 0;

          // Last 7 days trend
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(today, 6 - i);
            return {
              date: format(date, "yyyy-MM-dd"),
              count: attendances.filter(
                (att) => att.date === format(date, "yyyy-MM-dd")
              ).length,
            };
          });

          setAttendanceStats({ todayCount, weekRate, last7Days });
        }

        // Fetch member stats
        if (["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user.role)) {
          const membersResponse = await fetch("/api/members", {
            credentials: "include",
          });
          if (!membersResponse.ok) throw new Error("Failed to fetch members");
          const { members } = await membersResponse.json();

          const filteredMembers = user.churchId
            ? members.filter((m: User) => m.churchId === user.churchId)
            : members;

          const totalMembers = filteredMembers.length;
          const roleDistribution = filteredMembers.reduce(
            (acc: { [role: string]: number }, m: User) => {
              acc[m.role] = (acc[m.role] || 0) + 1;
              return acc;
            },
            {}
          );
          const recentMembers = filteredMembers
            .sort(
              (a: User, b: User) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5);

          setMemberStats({ totalMembers, roleDistribution, recentMembers });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchError(t("serverError"));
      }
    };

    fetchData();
  }, [user, isLoading, t, memberStats.totalMembers]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
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
        </motion.div>

        {/* Pending Alerts */}
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
        {user && user.role === "MASTER" && pendingChurches.length > 0 && (
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

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attendance Stats */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h2 className="text-xl font-semibold mb-4">
                {t("attendanceStats")}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">{t("todayAttendance")}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {attendanceStats.todayCount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{t("weeklyAttendanceRate")}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {attendanceStats.weekRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{t("last7Days")}</p>
                  <ul className="text-sm">
                    {attendanceStats.last7Days.map(({ date, count }) => (
                      <li key={date} className="flex justify-between">
                        <span>{date}</span>
                        <span className="font-semibold">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Member Stats */}
          {["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h2 className="text-xl font-semibold mb-4">{t("memberStats")}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">{t("totalMembers")}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {memberStats.totalMembers}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{t("roleDistribution")}</p>
                  <ul className="text-sm">
                    {Object.entries(memberStats.roleDistribution).map(
                      ([role, count]) => (
                        <li key={role} className="flex justify-between">
                          <span>{t(role.toLowerCase())}</span>
                          <span className="font-semibold">{count}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-gray-600">{t("recentMembers")}</p>
                  <ul className="text-sm">
                    {memberStats.recentMembers.map((m) => (
                      <li key={m.id} className="flex justify-between">
                        <span>{m.name}</span>
                        <span>
                          {format(new Date(m.createdAt), "yyyy-MM-dd")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
            <div className="space-y-2">
              {["MASTER", "SUPER_ADMIN", "ADMIN"].includes(
                user?.role || ""
              ) && (
                <Button
                  onClick={() => router.push("/signup")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  {t("addMember")}
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Error Modal */}
        {(authError || fetchError) && (
          <Modal isOpen={!!(authError || fetchError)}>
            <p className="text-red-600 text-center mb-4">
              {authError || fetchError}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setFetchError(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                {t("close")}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
