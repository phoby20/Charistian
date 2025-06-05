"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MemberCard from "@/components/MemberCard";
import { User } from "@/types/customUser";
import { ChevronDown } from "lucide-react";

export default function MembersPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

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
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      const { members } = await response.json();
      const filteredMembers = members.filter(
        (user: User) => user.churchId === userChurchId
      );
      setMembers(filteredMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(t("serverError"));
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
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
  }, [router]);

  useEffect(() => {
    if (userRole !== null && userChurchId !== null) {
      fetchMembers();
    }
  }, [userRole, userChurchId, router]);

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

  const handleUpdate = () => {
    fetchMembers();
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setIsGroupMenuOpen(false);
    router.push(`/members?group=${encodeURIComponent(group)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {t("members")}
          </h1>
          {/* 모바일 그룹 선택 드롭다운 */}
          <div className="relative md:hidden">
            <button
              onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isGroupMenuOpen}
              aria-haspopup="true"
            >
              <span>{selectedGroup || t("selectGroup")}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isGroupMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                {groups.map((group) => (
                  <button
                    key={group}
                    onClick={() => handleGroupSelect(group)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          {members.length === 0 ? (
            <p className="text-gray-500 italic text-center">{t("noMembers")}</p>
          ) : (
            <div className="space-y-6">
              {/* 데스크톱 탭 메뉴 */}
              <nav className="hidden md:flex space-x-2 border-b border-gray-200">
                {groups.map((group) => (
                  <button
                    key={group}
                    onClick={() => handleGroupSelect(group)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                      selectedGroup === group
                        ? "bg-blue-600 text-white border-b-2 border-blue-600"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                    aria-selected={selectedGroup === group}
                    role="tab"
                  >
                    {group}
                  </button>
                ))}
              </nav>

              {/* 회원 목록 */}
              {filteredMembers.length === 0 ? (
                <p className="text-gray-500 italic text-center">
                  {t("noMembers")}
                </p>
              ) : (
                <div className="space-y-6">
                  {sortedSubGroupKeys.map((subGroupKey) => (
                    <section
                      key={subGroupKey}
                      className="bg-white rounded-lg shadow-sm p-4"
                      aria-labelledby={`subgroup-${subGroupKey.replace(
                        /\s/g,
                        "-"
                      )}`}
                    >
                      <h2
                        id={`subgroup-${subGroupKey.replace(/\s/g, "-")}`}
                        className="text-lg font-semibold text-gray-800 mb-3"
                      >
                        {subGroupKey}
                      </h2>
                      <div className="grid grid-cols-1 gap-2">
                        {subGroupedMembers[subGroupKey].map((user) => (
                          <MemberCard
                            key={user.id}
                            user={user}
                            onClick={setSelectedUser}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedUser && (
            <UserDetailModal
              user={selectedUser}
              isOpen={!!selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={handleUpdate}
            />
          )}

          {error && (
            <Modal isOpen={!!error}>
              <p className="text-red-600 text-center">{error}</p>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => setError(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  {t("close")}
                </Button>
              </div>
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}
