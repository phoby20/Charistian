// src/app/attendance/page.tsx

"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MemberCard from "@/components/MemberCard";
import Loading from "@/components/Loading";
import { User } from "@/types/customUser";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Attendance 데이터의 타입 정의
interface AttendanceRecord {
  userId: string;
}

export default function Attendance() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        router.push("/login");
        return;
      }
      if (!userChurchId) {
        setMembers([]);
        return;
      }
      const response = await fetch("/api/members", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch members");
      const { members }: { members: User[] } = await response.json();
      const filteredMembers = members.filter(
        (user: User) => user.churchId === userChurchId
      );
      setMembers(filteredMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(t("serverError"));
    }
  };

  // 출석 정보 가져오기 (서버 날짜 사용)
  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/attendance", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const { attendances }: { attendances: AttendanceRecord[] } =
        await response.json();
      const status: { [key: string]: boolean } = {};
      attendances.forEach((att: AttendanceRecord) => {
        status[att.userId] = true;
      });
      setAttendanceStatus(status);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(t("serverError"));
    }
    setIsLoading(false);
  };

  // 출석 체크/취소 처리
  const checkUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const isAttended = !attendanceStatus[userId]; // 현재 상태의 반대로 토글
      const response = await fetch("/api/attendance", {
        method: isAttended ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }), // 서버에서 날짜를 처리하므로 date 제거
      });
      if (!response.ok) throw new Error("Failed to update attendance");
      setAttendanceStatus((prev) => ({
        ...prev,
        [userId]: isAttended,
      }));
    } catch (err) {
      console.error("Error updating attendance:", err);
      setError(t("serverError"));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data: { user: { role: string; churchId: string | null } } =
            await response.json();
          setUserRole(data.user.role);
          setUserChurchId(data.user.churchId);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(t("serverError"));
      }
    };
    fetchUserRole();
  }, [router, t]);

  useEffect(() => {
    if (userRole !== null && userChurchId !== null) {
      fetchMembers();
      fetchAttendance();
    }
    setIsLoading(false);
  }, [userRole, userChurchId]);

  const groups = Array.from(
    new Set(members.map((user) => user.group?.name || t("noGroup")))
  ).sort((a, b) => {
    if (a === t("noGroup")) return 1;
    if (b === t("noGroup")) return -1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    const groupParam = searchParams.get("group");
    if (groupParam && groups.includes(groupParam)) {
      setSelectedGroup(groupParam);
    } else if (groups.length > 0) {
      setSelectedGroup(groups[0]);
      router.replace(`/attendance?group=${encodeURIComponent(groups[0])}`);
    }
    setIsLoading(false);
  }, [searchParams, groups, router]);

  const filteredMembers = selectedGroup
    ? members.filter(
        (user) => (user.group?.name || t("noGroup")) === selectedGroup
      )
    : members;

  const subGroupedMembers = filteredMembers.reduce(
    (acc: { [key: string]: User[] }, user: User) => {
      const subGroupKey = user.subGroup?.name || t("noSubGroup");
      if (!acc[subGroupKey]) {
        acc[subGroupKey] = [];
      }
      acc[subGroupKey].push(user);
      return acc;
    },
    {}
  );

  const sortedSubGroupKeys = Object.keys(subGroupedMembers).sort((a, b) => {
    if (a === t("noSubGroup")) return 1;
    if (b === t("noSubGroup")) return -1;
    return a.localeCompare(b);
  });

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setIsGroupMenuOpen(false);
    router.push(`/attendance?group=${encodeURIComponent(group)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {isLoading && <Loading />}
      <header className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl tracking-tight">
            {t("attendance")}
          </h1>
          <div className="relative md:hidden">
            <button
              onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-expanded={isGroupMenuOpen}
              aria-haspopup="true"
            >
              <span className="truncate max-w-[120px]">
                {selectedGroup || t("selectGroup")}
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
              <nav className="hidden md:flex space-x-1 bg-gray-100 p-1 rounded-full border border-gray-200">
                {groups.map((group) => (
                  <motion.button
                    key={group}
                    onClick={() => handleGroupSelect(group)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                      selectedGroup === group
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-200"
                    }`}
                    aria-selected={selectedGroup === group}
                    role="tab"
                  >
                    {group}
                  </motion.button>
                ))}
              </nav>

              {filteredMembers.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-500 italic text-center text-sm"
                >
                  {t("noMembers")}
                </motion.p>
              ) : (
                <div className="space-y-6">
                  {sortedSubGroupKeys.map((subGroupKey) => (
                    <motion.section
                      key={subGroupKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200"
                      aria-labelledby={`subgroup-${subGroupKey.replace(
                        /\s/g,
                        "-"
                      )}`}
                    >
                      <h2
                        id={`subgroup-${subGroupKey.replace(/\s/g, "-")}`}
                        className="text-lg font-semibold text-gray-800 mb-4"
                      >
                        {subGroupKey}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subGroupedMembers[subGroupKey].map((user) => (
                          <div key={user.id} className="relative">
                            <MemberCard
                              user={user}
                              onClick={() => checkUser(user.id)}
                              attendanceStatus={attendanceStatus}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <Modal isOpen={!!error}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg across-white rounded-xl p-4 sm:p-6"
              >
                <p className="text-red-600 text-center text-sm mb-4">{error}</p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setError(null)}
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
