// src/app/[locale]/attendance-report/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatInTimeZone } from "date-fns-tz";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/customUser";
import Loading from "@/components/Loading";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

// Attendance 데이터의 타입 정의
interface AttendanceRecord {
  userId: string;
  date: string; // e.g., "2025-06-06"
}

function AttendanceReportContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error: authError } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isSubGroupMenuOpen, setIsSubGroupMenuOpen] = useState(false);
  const [attendanceByDate, setAttendanceByDate] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30); // 페이지당 회원 수

  // JST 기준 오늘 날짜 설정
  const jstTimeZone = "Asia/Tokyo";
  const today = formatInTimeZone(new Date(), jstTimeZone, "yyyy-MM-dd");
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // 회원 목록 가져오기
  const fetchMembers = useCallback(async () => {
    try {
      if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
        router.push("/login");
        return;
      }
      if (!user.churchId) {
        setMembers([]);
        return;
      }
      const response = await fetch("/api/members", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(t("failedToFetchMembers"));
      const { members }: { members: User[] } = await response.json();
      const filteredMembers = members.filter(
        (userData: User) => userData.churchId === user.churchId
      );
      setMembers(filteredMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      setFetchError(t("serverError"));
    }
  }, [user, router, t]);

  // 출석 정보 가져오기
  const fetchAttendance = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);
      const response = await fetch(
        `/api/attendance/search?${query.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!response.ok) throw new Error(t("failedToFetchAttendance"));
      const { attendances }: { attendances: AttendanceRecord[] } =
        await response.json();
      const byDate: { [key: string]: { [key: string]: boolean } } = {};
      attendances.forEach((att: AttendanceRecord) => {
        if (
          (!startDate || att.date >= startDate) &&
          (!endDate || att.date <= endDate)
        ) {
          if (!byDate[att.date]) byDate[att.date] = {};
          byDate[att.date][att.userId] = true;
        }
      });
      setAttendanceByDate(byDate);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setFetchError(t("serverError"));
    }
  }, [startDate, endDate, t]);

  // 데이터 가져오기
  useEffect(() => {
    if (user && !isLoading) {
      fetchMembers();
      fetchAttendance();
    }
  }, [user, isLoading, startDate, endDate, fetchMembers, fetchAttendance]);

  // 그룹 및 서브그룹 목록 생성
  const groups = Array.from(
    new Set(members.map((user) => user.group?.name || t("noGroup")))
  ).sort((a, b) => {
    if (a === t("noGroup")) return 1;
    if (b === t("noGroup")) return -1;
    return a.localeCompare(b);
  });

  const subGroups = Array.from(
    new Set(
      members
        .filter((user) => (user.group?.name || t("noGroup")) === selectedGroup)
        .map((user) => user.subGroup?.name || t("noSubGroup"))
    )
  ).sort((a, b) => {
    if (a === t("noSubGroup")) return 1;
    if (b === t("noSubGroup")) return -1;
    return a.localeCompare(b);
  });

  // URL 파라미터로 그룹, 서브그룹, 날짜 범위 설정
  useEffect(() => {
    const groupParam = searchParams.get("group");
    const subGroupParam = searchParams.get("subGroup");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (groupParam && groups.includes(groupParam)) {
      setSelectedGroup(groupParam);
    } else if (groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
    if (subGroupParam && subGroups.includes(subGroupParam)) {
      setSelectedSubGroup(subGroupParam);
    } else if (subGroups.length > 0) {
      setSelectedSubGroup(subGroups[0]);
    }
    if (startDateParam) {
      setStartDate(startDateParam);
    }
    if (endDateParam) {
      setEndDate(endDateParam);
    }
  }, [searchParams, groups, subGroups]);

  // 필터링된 회원 목록
  const filteredMembers = members.filter((user) => {
    const matchesGroup = selectedGroup
      ? (user.group?.name || t("noGroup")) === selectedGroup
      : true;
    const matchesSubGroup = selectedSubGroup
      ? (user.subGroup?.name || t("noSubGroup")) === selectedSubGroup
      : true;
    return matchesGroup && matchesSubGroup;
  });

  // 페이징 처리
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = filteredMembers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // 날짜 범위의 날짜 목록 생성
  const getDateRange = useCallback(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(formatInTimeZone(date, jstTimeZone, "yyyy-MM-dd"));
    }
    return dates;
  }, [startDate, endDate]);

  const dateRange = getDateRange();

  const handleGroupSelect = useCallback(
    (group: string) => {
      setSelectedGroup(group);
      setSelectedSubGroup(null);
      setIsGroupMenuOpen(false);
      setPage(1);
      router.push(`/attendance-report?group=${encodeURIComponent(group)}`);
    },
    [router]
  );

  const handleSubGroupSelect = useCallback(
    (subGroup: string) => {
      setSelectedSubGroup(subGroup);
      setIsSubGroupMenuOpen(false);
      setPage(1);
      router.push(
        `/attendance-report?group=${encodeURIComponent(
          selectedGroup || ""
        )}&subGroup=${encodeURIComponent(subGroup)}`
      );
    },
    [router, selectedGroup]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  // 로딩 및 인증 처리
  if (isLoading) {
    return <Loading />;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <header className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Title, Group/Subgroup, Logout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl tracking-tight">
              {t("attendanceReport")}
            </h1>
            <div className="flex space-x-4">
              {/* 그룹 선택 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  aria-expanded={isGroupMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="truncate max-w-[120px]">
                    {selectedGroup}
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
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30"
                    >
                      {groups.map((group) => (
                        <button
                          key={group}
                          onClick={() => handleGroupSelect(group)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
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
              {selectedGroup && (
                <div className="relative">
                  <button
                    onClick={() => setIsSubGroupMenuOpen(!isSubGroupMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    aria-expanded={isSubGroupMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="truncate max-w-[120px]">
                      {selectedSubGroup}
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
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30"
                      >
                        {subGroups.map((subGroup) => (
                          <button
                            key={subGroup}
                            onClick={() => handleSubGroupSelect(subGroup)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                            role="menuitem"
                          >
                            {subGroup}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
          {/* 날짜 범위 선택 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">
                {t("startDate")}:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-gray-700">
                {t("endDate")}:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          {members.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 italic text-center text-sm"
            >
              {t("noMembers")}
            </motion.p>
          ) : (
            <div className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 overflow-x-auto"
              >
                <h2
                  id="attendance-report"
                  className="text-lg font-semibold text-gray-800 mb-4"
                >
                  {selectedGroup}{" "}
                  {selectedSubGroup ? `/ ${selectedSubGroup}` : ""}{" "}
                  {startDate && endDate
                    ? `(${startDate} ~ ${endDate})`
                    : startDate
                      ? `(${startDate} ~ )`
                      : endDate
                        ? `( ~ ${endDate})`
                        : ""}
                </h2>
                {dateRange.length === 0 ? (
                  <p className="text-gray-500 italic text-center text-sm">
                    {t("selectDateRange")}
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                          {t("name")}
                        </th>
                        {dateRange.map((date) => (
                          <th
                            key={date}
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedMembers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                            {user.name}
                          </td>
                          {dateRange.map((date) => (
                            <td
                              key={date}
                              className="px-6 py-4 whitespace-nowrap text-sm text-center"
                            >
                              {attendanceByDate[date]?.[user.id] ? "✅" : "❌"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.section>

              {/* 페이징 컨트롤 */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {t("previous")}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {t("page")} {page} / {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {t("next")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 에러 모달 */}
          {(authError || fetchError) && (
            <Modal isOpen={!!(authError || fetchError)}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 sm:p-6"
              >
                <p className="text-red-600 text-center text-sm mb-4">
                  {authError || fetchError}
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setFetchError(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                  >
                    {t("close")}
                  </Button>
                </div>
              </motion.div>
            </Modal>
          )}
        </div>
      </main>
    </motion.div>
  );
}

export default function AttendanceReportPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AttendanceReportContent />
    </Suspense>
  );
}
