// src/app/[locale]/dashboard/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { ChurchApplication, User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

  // 그룹, 서브그룹, 팀 데이터를 가져오는 함수
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!user || !user.churchId) return;
      try {
        const response = await fetch("/api/members", {
          credentials: "include",
        });
        if (!response.ok) throw new Error(t("serverError"));
        const { members }: { members: UserWithRelations[] } =
          await response.json();

        // 고유한 그룹, 서브그룹, 팀 목록 추출
        const uniqueGroups = Array.from(
          new Set(members.flatMap((m) => m.groups.map((g) => g.name)))
        ).sort();
        const uniqueSubGroups = Array.from(
          new Set(members.flatMap((m) => m.subGroups.map((sg) => sg.name)))
        ).sort();
        const uniqueTeams = Array.from(
          new Set(members.flatMap((m) => m.teams.map((t) => t.name)))
        ).sort();

        setGroups(uniqueGroups);
        setSubGroups(uniqueSubGroups);
        setTeams(uniqueTeams);
      } catch (err) {
        console.error("Error fetching filter data:", err);
        setFetchError(t("serverError"));
      }
    };

    fetchFilterData();
  }, [user, t]);

  // 데이터 페칭
  useEffect(() => {
    fetchData(
      user,
      isAuthLoading,
      memberStats,
      setPendingChurches,
      setPendingUsers,
      setAttendanceStats,
      setMemberStats,
      setFetchError,
      setIsLoading,
      t,
      selectedGroups,
      selectedSubGroups,
      selectedTeams
    );
  }, [user, isAuthLoading, selectedGroups, selectedSubGroups, selectedTeams]);

  const handleGroupSelect = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
    setIsGroupMenuOpen(false);
  };

  const handleSubGroupSelect = (subGroup: string) => {
    setSelectedSubGroups((prev) =>
      prev.includes(subGroup)
        ? prev.filter((sg) => sg !== subGroup)
        : [...prev, subGroup]
    );
    setIsSubGroupMenuOpen(false);
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
    setIsTeamMenuOpen(false);
  };

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
            <MyQRCode user={user} scanMessage={scanMessage} />
            <QRScanner user={user} onMessage={setScanMessage} />
          </div>
        </motion.div>

        {/* 모바일 필터 드롭다운 */}
        <div className="flex space-x-2 mb-6 md:hidden">
          {/* 그룹 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-expanded={isGroupMenuOpen}
              aria-haspopup="true"
            >
              <span className="truncate max-w-[120px]">
                {selectedGroups.length > 0
                  ? selectedGroups.join(", ")
                  : t("selectGroups")}
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  transform: isGroupMenuOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {isGroupMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
                >
                  {groups.map((group) => (
                    <button
                      key={group}
                      onClick={() => handleGroupSelect(group)}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 ${
                        selectedGroups.includes(group) ? "bg-blue-100" : ""
                      }`}
                      role="menuitem"
                    >
                      {group}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 서브그룹 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsSubGroupMenuOpen(!isSubGroupMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              aria-expanded={isSubGroupMenuOpen}
              aria-haspopup="true"
            >
              <span className="truncate max-w-[120px]">
                {selectedSubGroups.length > 0
                  ? selectedSubGroups.join(", ")
                  : t("selectSubGroups")}
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  transform: isSubGroupMenuOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {isSubGroupMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
                >
                  {subGroups.map((subGroup) => (
                    <button
                      key={subGroup}
                      onClick={() => handleSubGroupSelect(subGroup)}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 ${
                        selectedSubGroups.includes(subGroup)
                          ? "bg-purple-100"
                          : ""
                      }`}
                      role="menuitem"
                    >
                      {subGroup}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 팀 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
              aria-expanded={isTeamMenuOpen}
              aria-haspopup="true"
            >
              <span className="truncate max-w-[120px]">
                {selectedTeams.length > 0
                  ? selectedTeams.join(", ")
                  : t("selectTeams")}
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  transform: isTeamMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {isTeamMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
                >
                  {teams.map((team) => (
                    <button
                      key={team}
                      onClick={() => handleTeamSelect(team)}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 ${
                        selectedTeams.includes(team) ? "bg-green-100" : ""
                      }`}
                      role="menuitem"
                    >
                      {team}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 데스크톱 필터 탭 */}
        <div className="hidden md:block space-y-4 bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 mb-6">
          <p className="font-bold">{t("filter")}</p>
          <div className="flex items-center space-x-4 p-1">
            <span className="w-24 min-w-24">{t("selectGroups")}</span>
            <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
              {groups.map((group) => (
                <motion.button
                  key={group}
                  onClick={() => handleGroupSelect(group)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    selectedGroups.includes(group)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-selected={selectedGroups.includes(group)}
                  role="tab"
                >
                  {group}
                </motion.button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4 p-1">
            <span className="w-24 min-w-24">{t("selectSubGroups")}</span>
            <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
              {subGroups.map((subGroup) => (
                <motion.button
                  key={subGroup}
                  onClick={() => handleSubGroupSelect(subGroup)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    selectedSubGroups.includes(subGroup)
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-selected={selectedSubGroups.includes(subGroup)}
                  role="tab"
                >
                  {subGroup}
                </motion.button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4 p-1">
            <span className="w-24 min-w-24">{t("selectTeams")}</span>
            <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
              {teams.map((team) => (
                <motion.button
                  key={team}
                  onClick={() => handleTeamSelect(team)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    selectedTeams.includes(team)
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-selected={selectedTeams.includes(team)}
                  role="tab"
                >
                  {team}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        <PendingAlerts
          user={user}
          pendingUsers={pendingUsers}
          pendingChurches={pendingChurches}
        />

        <div className="grid grid-cols-1 gap-6">
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
          <EventCalendar
            user={user}
            setFetchError={setFetchError}
            setIsLoading={setIsLoading}
          />
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
