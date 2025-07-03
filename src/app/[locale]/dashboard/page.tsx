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

interface AttendanceRecord {
  userId: string;
  date: string;
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

  // 초기 데이터 페칭
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

      // 그룹, 서브그룹, 팀 목록 추출
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
    };

    fetchInitialData();
  }, [user, isAuthLoading, t]);

  // 필터링 및 통계 계산
  useEffect(() => {
    if (!user || isAuthLoading) return;

    // 필터링된 멤버 목록
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

    // Member stats 계산
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

    // 출석 통계 계산 (SUPER_ADMIN, ADMIN only)
    if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
      const filteredAttendances = cachedData.attendances.filter((att) =>
        filteredMembers.some((m) => m.id === att.userId)
      );

      const today = new Date();
      const todayString = format(today, "yyyy-MM-dd");

      // Today’s attendance count
      const todayCount = filteredAttendances.filter(
        (att) => att.date === todayString
      ).length;

      // Weekly attendance rate
      const weekAttendees = new Set(
        filteredAttendances.map((att) => att.userId)
      ).size;
      const weekRate =
        totalMembers > 0 ? (weekAttendees / totalMembers) * 100 : 0;

      // Last 7 days trend
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 space-x-4"
        >
          <h1 className="text-xl font-extrabold text-gray-900">
            {t("dashboard")}
          </h1>
          <div className="flex space-x-2">
            {user.role === "MASTER" && (
              <Link
                href={`/${locale}/send-email/`}
                className="p-2 bg-blue-600 text-white cursor-pointer"
              >
                유저에게 Email 보내기
              </Link>
            )}
            <MyQRCode user={user} scanMessage={scanMessage} />
            <QRScanner user={user} onMessage={setScanMessage} />
          </div>
        </motion.div>

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

        <PendingAlerts
          user={user}
          pendingUsers={pendingUsers}
          pendingChurches={pendingChurches}
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
