"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MobileFilterDropdowns from "@/components/members/MobileFilterDropdowns";
import DesktopFilterTabs from "@/components/members/DesktopFilterTabs";
import MemberList from "@/components/members/MemberList";
import { User } from "@/types/customUser";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function MembersPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      fetchMembers();
      setIsLoading(false);
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

  // 팀 목록 생성
  const teams = Array.from(
    new Set(members.flatMap((user) => user.teams.map((team) => team.name)))
  ).sort((a, b) => a.localeCompare(b));

  // URL 파라미터로 선택된 그룹 및 팀 설정
  useEffect(() => {
    const groupParams = searchParams.getAll("group");
    const teamParams = searchParams.getAll("team");

    if (groupParams.length > 0) {
      const validGroups = groupParams.filter((group) => groups.includes(group));
      setSelectedGroups(validGroups);
    } else {
      setSelectedGroups([]);
    }

    if (teamParams.length > 0) {
      const validTeams = teamParams.filter((team) => teams.includes(team));
      setSelectedTeams(validTeams);
    } else {
      setSelectedTeams([]);
    }

    // URL 동기화
    const newSearchParams = new URLSearchParams();
    selectedGroups.forEach((group) => {
      newSearchParams.append("group", encodeURIComponent(group));
    });
    selectedTeams.forEach((team) => {
      newSearchParams.append("team", encodeURIComponent(team));
    });
    router.replace(`/members?${newSearchParams.toString()}`, {
      scroll: false,
    });
  }, []);

  // 선택된 그룹 및 팀으로 회원 필터링
  const filteredMembers = members.filter((user) => {
    const matchesGroup =
      selectedGroups.length > 0
        ? selectedGroups.some(
            (selectedGroup) =>
              (user.group?.name || t("noGroup")) === selectedGroup
          )
        : true;
    const matchesTeam =
      selectedTeams.length > 0
        ? selectedTeams.some((selectedTeam) =>
            user.teams.some((team) => team.name === selectedTeam)
          )
        : true;
    return matchesGroup && matchesTeam;
  });

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
      let updatedGroups: string[];
      if (selectedGroups.includes(group)) {
        updatedGroups = selectedGroups.filter((g) => g !== group);
      } else {
        updatedGroups = [...selectedGroups, group];
      }
      setSelectedGroups(updatedGroups);
      setIsGroupMenuOpen(false);
      const newSearchParams = new URLSearchParams();
      updatedGroups.forEach((g) => {
        newSearchParams.append("group", encodeURIComponent(g));
      });
      selectedTeams.forEach((team) => {
        newSearchParams.append("team", encodeURIComponent(team));
      });
      router.push(`/members?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, selectedGroups, selectedTeams]
  );

  const handleTeamSelect = useCallback(
    (team: string) => {
      let updatedTeams: string[];
      if (selectedTeams.includes(team)) {
        updatedTeams = selectedTeams.filter((t) => t !== team);
      } else {
        updatedTeams = [...selectedTeams, team];
      }
      setSelectedTeams(updatedTeams);
      setIsTeamMenuOpen(false);
      const newSearchParams = new URLSearchParams();
      selectedGroups.forEach((g) => {
        newSearchParams.append("group", encodeURIComponent(g));
      });
      updatedTeams.forEach((t) => {
        newSearchParams.append("team", encodeURIComponent(t));
      });
      router.push(`/members?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, selectedGroups, selectedTeams]
  );

  // 로딩 상태 처리
  if (authLoading || isLoading) {
    return <Loading />;
  }

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

          {/* 모바일 팀 선택 드롭다운 */}
          <MobileFilterDropdowns
            groups={groups}
            teams={teams}
            selectedGroups={selectedGroups}
            selectedTeams={selectedTeams}
            isGroupMenuOpen={isGroupMenuOpen}
            isTeamMenuOpen={isTeamMenuOpen}
            setIsGroupMenuOpen={setIsGroupMenuOpen}
            setIsTeamMenuOpen={setIsTeamMenuOpen}
            handleGroupSelect={handleGroupSelect}
            handleTeamSelect={handleTeamSelect}
          />
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
              <DesktopFilterTabs
                groups={groups}
                teams={teams}
                selectedGroups={selectedGroups}
                selectedTeams={selectedTeams}
                handleGroupSelect={handleGroupSelect}
                handleTeamSelect={handleTeamSelect}
              />

              {/* 회원 목록 */}
              <MemberList
                filteredMembers={filteredMembers}
                subGroupedMembers={subGroupedMembers}
                sortedSubGroupKeys={sortedSubGroupKeys}
                setSelectedUser={setSelectedUser}
              />
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
