// src/app/[locale]/members/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MemberCard from "@/components/MemberCard";
import { User } from "@/types/customUser";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

function MembersContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      if (!authLoading) {
        if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
          router.push("/login");
          return;
        }
        if (!user.churchId) {
          setMembers([]);
          return;
        }
        const response = await fetch("/api/members");
        if (!response.ok) throw new Error("Failed to fetch members");
        const { members } = await response.json();
        const filteredMembers = members.filter(
          (member: User) => member.churchId === user.churchId
        );
        setMembers(filteredMembers);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(t("serverError"));
    }
  }, [user?.role, router, user?.churchId, t]);

  useEffect(() => {
    if (user?.role !== null && user?.churchId !== null) {
      fetchMembers();
    }
  }, [user?.role, user?.churchId, router, fetchMembers]);

  // 그룹 목록 생성
  const groups = Array.from(
    new Set(members.map((user) => user.group?.name || t("noGroup")))
  ).sort((a, b) => {
    if (a === t("noGroup")) return 1;
    if (b === t("noGroup")) return -1;
    return a.localeCompare(b);
  });

  // URL 파라미터로 선택된 그룹 설정
  useEffect(() => {
    const groupParam = searchParams.get("group");
    if (groupParam && groups.includes(groupParam)) {
      setSelectedGroup(groupParam);
    } else if (groups.length > 0) {
      setSelectedGroup(groups[0]);
      router.replace(`/members?group=${encodeURIComponent(groups[0])}`);
    }
  }, [searchParams, groups, router]);

  // 선택된 그룹의 회원 필터링
  const filteredMembers = selectedGroup
    ? members.filter(
        (user) => (user.group?.name || t("noGroup")) === selectedGroup
      )
    : members;

  // subGroup별로 회원 그룹화
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

  // subGroup 이름 정렬
  const sortedSubGroupKeys = Object.keys(subGroupedMembers).sort((a, b) => {
    if (a === t("noSubGroup")) return 1;
    if (b === t("noSubGroup")) return -1;
    return a.localeCompare(b);
  });

  const handleUpdate = useCallback(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleGroupSelect = useCallback(
    (group: string) => {
      setSelectedGroup(group);
      setIsGroupMenuOpen(false);
      router.push(`/members?group=${encodeURIComponent(group)}`, {
        scroll: false,
      });
    },
    [router]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl tracking-tight">
            {t("members")}
          </h1>
          {/* 모바일 그룹 선택 드롭다운 */}
          <div className="relative md:hidden">
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
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
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
              {/* 데스크톱 탭 메뉴 */}
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

              {/* 회원 목록 */}
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
                          <MemberCard
                            key={user.id}
                            user={user}
                            onClick={setSelectedUser}
                          />
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 사용자 상세 모달 */}
          {selectedUser && (
            <UserDetailModal
              user={selectedUser}
              isOpen={!!selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={handleUpdate}
            />
          )}

          {/* 에러 모달 */}
          {error && (
            <Modal isOpen={!!error}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 sm:p-6"
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

export default function MembersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MembersContent />
    </Suspense>
  );
}
