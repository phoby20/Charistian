// src/app/[locale]/dashboard/page.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { ChurchApplication, User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import AttendanceStats from "@/components/AttendanceStats";
import MemberStats from "@/components/MemberStats";
import { AttendanceStatsData, fetchData, MemberStatsData } from "./index";
import Loading from "@/components/Loading";
import PendingAlerts from "@/components/PendingAlerts";
import ErrorModal from "@/components/ErrorModal";
import MyQRCode from "@/components/MyQRCode";
import QRScanner from "@/components/QRScanner";
import EventCalendar from "@/components/EventCalendar";
import { UserWithRelations } from "@/types/customUser";
import MobileFilterDropdowns from "@/components/dashboard/MobileFilterDropdowns";
import DesktopFilterTabs from "@/components/dashboard/DesktopFilterTabs";
import Link from "next/link";
import UsageLimitCard from "@/components/dashboard/UsageLimitCard";

interface AttendanceRecord {
  userId: string;
  date: string;
}

interface UsageLimit {
  plan: "FREE" | "SMART" | "ENTERPRISE";
  maxUsers: number;
  remainingUsers: number;
  weeklySetlists: number;
  remainingWeeklySetlists: number;
  monthlySetlists: number;
  remainingMonthlySetlists: number;
  maxScores: number;
  remainingScores: number;
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    user,
    isLoading: isAuthLoading,
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
  const [usageLimit, setUsageLimit] = useState<UsageLimit | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [subGroups, setSubGroups] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSubGroups, setSelectedSubGroups] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState<boolean>(false);
  const [isSubGroupMenuOpen, setIsSubGroupMenuOpen] = useState<boolean>(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState<boolean>(false);
  const [cachedData, setCachedData] = useState<{
    members: UserWithRelations[];
    attendances: AttendanceRecord[];
  }>({ members: [], attendances: [] });
  const locale = useLocale();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || isAuthLoading) return;
      const data = await fetchData(
        user,
        isAuthLoading,
        setPendingChurches,
        setPendingUsers,
        setFetchError,
        setIsLoading,
        t
      );
      setCachedData(data);

      setIsLoading(true);

      const uniqueGroups = Array.from(
        new Set(data.members.flatMap((m) => m.groups.map((g) => g.name)))
      ).sort();
      const uniqueSubGroups = Array.from(
        new Set(data.members.flatMap((m) => m.subGroups.map((sg) => sg.name)))
      ).sort();
      const uniqueTeams = Array.from(
        new Set(data.members.flatMap((m) => m.teams.map((t) => t.name)))
      ).sort();

      setGroups(uniqueGroups);
      setSubGroups(uniqueSubGroups);
      setTeams(uniqueTeams);

      // 사용량 제한 데이터 가져오기
      const response = await fetch("/api/secure/usage-limits", {
        credentials: "include",
      });
      const usageData = await response.json();
      setUsageLimit(usageData);
      setIsLoading(false);
    };

    fetchInitialData();
  }, [user, isAuthLoading, t]);

  useEffect(() => {
    if (!user || isAuthLoading) return;

    const filteredMembers = cachedData.members.filter(
      (m: UserWithRelations) => {
        const inSelectedGroups =
          selectedGroups.length === 0 ||
          m.groups.some((g) => selectedGroups.includes(g.name));
        const inSelectedSubGroups =
          selectedSubGroups.length === 0 ||
          m.subGroups.some((sg) => selectedSubGroups.includes(sg.name));
        const inSelectedTeams =
          selectedTeams.length === 0 ||
          m.teams.some((t) => selectedTeams.includes(t.name));
        return (
          inSelectedGroups &&
          inSelectedSubGroups &&
          inSelectedTeams &&
          m.churchId === user.churchId
        );
      }
    );

    const totalMembers = filteredMembers.length;
    const roleDistribution = filteredMembers.reduce(
      (acc: { [role: string]: number }, m: UserWithRelations) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      },
      {}
    );
    const recentMembers = filteredMembers
      .sort(
        (a: UserWithRelations, b: UserWithRelations) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    setMemberStats({ totalMembers, roleDistribution, recentMembers });

    if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
      const filteredAttendances = cachedData.attendances.filter((att) =>
        filteredMembers.some((m) => m.id === att.userId)
      );
      const today = new Date();
      const todayString = format(today, "yyyy-MM-dd");
      const todayCount = filteredAttendances.filter(
        (att) => att.date === todayString
      ).length;
      const weekAttendees = new Set(
        filteredAttendances.map((att) => att.userId)
      ).size;
      const weekRate =
        totalMembers > 0 ? (weekAttendees / totalMembers) * 100 : 0;
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dateString = format(date, "yyyy-MM-dd");
        return {
          date: dateString,
          count: filteredAttendances.filter((att) => att.date === dateString)
            .length,
        };
      });

      setAttendanceStats({ todayCount, weekRate, last7Days });
    } else {
      setAttendanceStats({ todayCount: 0, weekRate: 0, last7Days: [] });
    }
  }, [
    user,
    isAuthLoading,
    cachedData,
    selectedGroups,
    selectedSubGroups,
    selectedTeams,
  ]);

  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 space-x-4"
        >
          <h1 className="text-xl font-extrabold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <div className="flex space-x-2">
            {user.role === "MASTER" && (
              <div className="flex gap-4">
                <Link
                  href={`/${locale}/scores/upload/master`}
                  className="p-2 bg-green-600 text-white cursor-pointer"
                >
                  楽譜アップロード
                </Link>
                <Link
                  href={`/${locale}/send-email/`}
                  className="p-2 bg-blue-600 text-white cursor-pointer"
                >
                  유저에게 Email 보내기
                </Link>
              </div>
            )}
            <MyQRCode user={user} scanMessage={scanMessage} />
            <QRScanner user={user} onMessage={setScanMessage} />
          </div>
        </motion.div>

        <PendingAlerts
          user={user}
          pendingUsers={pendingUsers}
          pendingChurches={pendingChurches}
        />

        <UsageLimitCard user={user} usageLimit={usageLimit} />

        <MobileFilterDropdowns
          groups={groups}
          subGroups={subGroups}
          teams={teams}
          selectedGroups={selectedGroups}
          selectedSubGroups={selectedSubGroups}
          selectedTeams={selectedTeams}
          setSelectedGroups={setSelectedGroups}
          setSelectedSubGroups={setSelectedSubGroups}
          setSelectedTeams={setSelectedTeams}
          isGroupMenuOpen={isGroupMenuOpen}
          isSubGroupMenuOpen={isSubGroupMenuOpen}
          isTeamMenuOpen={isTeamMenuOpen}
          setIsGroupMenuOpen={setIsGroupMenuOpen}
          setIsSubGroupMenuOpen={setIsSubGroupMenuOpen}
          setIsTeamMenuOpen={setIsTeamMenuOpen}
        />

        <DesktopFilterTabs
          groups={groups}
          subGroups={subGroups}
          teams={teams}
          selectedGroups={selectedGroups}
          selectedSubGroups={selectedSubGroups}
          selectedTeams={selectedTeams}
          setSelectedGroups={setSelectedGroups}
          setSelectedSubGroups={setSelectedSubGroups}
          setSelectedTeams={setSelectedTeams}
        />

        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 w-full">
            <AttendanceStats
              user={user}
              attendanceStats={attendanceStats}
              selectedGroups={selectedGroups}
              selectedSubGroups={selectedSubGroups}
              selectedTeams={selectedTeams}
            />
            <MemberStats
              user={user}
              memberStats={memberStats}
              selectedGroups={selectedGroups}
              selectedSubGroups={selectedSubGroups}
              selectedTeams={selectedTeams}
            />
          </div>
          <div className="w-full bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <EventCalendar
              user={user}
              setFetchError={setFetchError}
              setIsLoading={setIsLoading}
            />
          </div>
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
