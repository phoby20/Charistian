// src/app/[locale]/attendance/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MemberCard from "@/components/MemberCard";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { CustomUser } from "@/types/customUser";
import Loading from "@/components/Loading";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

// Attendance 데이터의 타입 정의
interface AttendanceRecord {
  userId: string;
}

function AttendanceContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error: authError } = useAuth();
  const [members, setMembers] = useState<CustomUser[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isSubGroupMenuOpen, setIsSubGroupMenuOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30); // 페이지당 회원 수
  const [isCallApi, setIsCallApi] = useState(false);

  // 회원 목록 가져오기
  const fetchMembers = useCallback(async () => {
    setIsCallApi(true);
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
      const { members }: { members: CustomUser[] } = await response.json();
      const filteredMembers = members.filter(
        (userData: CustomUser) => userData.churchId === user.churchId
      );
      setMembers(filteredMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      setFetchError(t("serverError"));
    } finally {
      setIsCallApi(false);
    }
  }, [user, router, t]);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(t("failedToFetchAttendance"));
      const { attendances }: { attendances: AttendanceRecord[] } =
        await response.json();
      const status: { [key: string]: boolean } = {};
      attendances.forEach((att: AttendanceRecord) => {
        status[att.userId] = true;
      });
      setAttendanceStatus(status);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setFetchError(t("serverError"));
    }
  }, [t]);

  // 출석 체크/취소 처리
  const checkUser = useCallback(
    async (userId: string) => {
      setIsCallApi(true);
      try {
        const isAttended = !attendanceStatus[userId];
        const response = await fetch("/api/attendance", {
          method: isAttended ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error(t("failedToUpdateAttendance"));
        setAttendanceStatus((prev) => ({
          ...prev,
          [userId]: isAttended,
        }));
      } catch (err) {
        console.error("Error updating attendance:", err);
        setFetchError(t("serverError"));
      } finally {
        setIsCallApi(false);
      }
    },
    [attendanceStatus, t]
  );

  // 데이터 가져오기
  useEffect(() => {
    if (user && !isLoading) {
      fetchMembers();
      fetchAttendance();
    }
  }, [user, isLoading, fetchMembers, fetchAttendance]);

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

  // URL 파라미터로 그룹 및 서브그룹 설정
  useEffect(() => {
    const groupParam = searchParams.get("group");
    const subGroupParam = searchParams.get("subGroup");
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

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setSelectedSubGroup(null); // 그룹 변경 시 서브그룹 초기화
    setIsGroupMenuOpen(false);
    setPage(1); // 페이지 초기화
    router.push(`/attendance?group=${encodeURIComponent(group)}`);
  };

  const handleSubGroupSelect = (subGroup: string) => {
    setSelectedSubGroup(subGroup);
    setIsSubGroupMenuOpen(false);
    setPage(1); // 페이지 초기화
    router.push(
      `/attendance?group=${encodeURIComponent(
        selectedGroup || ""
      )}&subGroup=${encodeURIComponent(subGroup)}`
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 로딩 및 인증 처리
  if (isLoading || isCallApi) {
    return <Loading />;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100"
    >
      <header className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl tracking-tight">
            {t("attendance")}
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
                <span className="truncate max-w-[120px]">{selectedGroup}</span>
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
              {/* 회원 목록 */}
              {paginatedMembers.length === 0 ? (
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
                    className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200"
                    aria-labelledby="attendance"
                  >
                    <h2
                      id="attendance"
                      className="text-lg font-semibold text-gray-800 mb-4"
                    >
                      {selectedGroup}{" "}
                      {selectedSubGroup ? `/ ${selectedSubGroup}` : ""}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedMembers.map((user) => (
                        <div key={user.id} className="relative">
                          <MemberCard
                            user={user}
                            onClick={() => checkUser(user.id)}
                          />
                          <span
                            className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full ${
                              attendanceStatus[user.id]
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {attendanceStatus[user.id]
                              ? t("attended")
                              : t("notAttended")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                </div>
              )}

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

export default function AttendancePage() {
  return (
    <Suspense fallback={<Loading />}>
      <AttendanceContent />
    </Suspense>
  );
}
