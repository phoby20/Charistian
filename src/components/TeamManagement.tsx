"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

interface Team {
  id: string;
  name: string;
}

interface TeamManagementProps {
  userRole: string | null;
  churchId: string | null;
}

export default function TeamManagement({
  userRole,
  churchId,
}: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations();
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 권한 및 churchId 체크
  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchTeams();
    } else {
      setError(t("unauthorized"));
      setIsLoading(false);
    }
  }, [userRole, churchId]);

  // 외부 클릭 시 드롭다운 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      let isOutside = true;
      menuRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });
      if (isOutside) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 편집 모드 진입 시 입력 필드에 포커스
  useEffect(() => {
    if (editingTeam && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTeam]);

  // 팀 목록 가져오기
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams?churchId=${churchId}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(errorData.error || t("failedToFetchTeams"));
      }
      const { teams } = await response.json();
      setTeams(Array.isArray(teams) ? teams : []);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(t("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  // 팀 추가
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      setError(t("teamNameRequired"));
      return;
    }
    if (!churchId) {
      setError(t("noChurchId"));
      return;
    }
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newTeamName.trim(), churchId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(errorData.error || t("failedToAddTeam"));
      }
      setNewTeamName("");
      await fetchTeams();
    } catch (err) {
      console.error("Error adding team:", err);
      setError(t("serverError"));
    }
  };

  // 팀 수정
  const handleUpdateTeam = async () => {
    if (!editingTeam || !editingTeam.name.trim()) {
      setError(t("teamNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingTeam.name.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        if (response.status === 404) {
          setError(t("teamNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToUpdateTeam"));
      }
      await fetchTeams();
      setEditingTeam(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating team:", err);
      setError(t("serverError"));
    }
  };

  // 팀 삭제
  const handleDeleteTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        if (response.status === 404) {
          setError(t("teamNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToDeleteTeam"));
      }
      setTeams(teams.filter((t) => t.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting team:", err);
      setError(t("serverError"));
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-500 text-center text-sm"
      >
        {t("loading")}
      </motion.div>
    );
  }

  if (!churchId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-600 text-center text-sm"
      >
        {t("noChurchId")}
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">
        {t("teamManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        {/* 팀 추가 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder={t("enterTeamName")}
            className="w-full sm:flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
            aria-label={t("enterTeamName")}
          />
          <Button
            onClick={handleAddTeam}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {t("addTeam")}
          </Button>
        </div>

        {/* 팀 리스트 */}
        {teams.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 italic text-center text-sm"
          >
            {t("noTeams")}
          </motion.p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {teams.map((team, index) => {
                if (!team?.id || !team?.name) {
                  console.warn("Invalid team data:", team);
                  return null;
                }
                return (
                  <motion.li
                    key={team.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200"
                  >
                    {editingTeam?.id === team.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={editingTeam.name}
                          onChange={(e) =>
                            setEditingTeam({
                              ...editingTeam,
                              name: e.target.value,
                            })
                          }
                          ref={inputRef}
                          className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            onClick={handleUpdateTeam}
                            className="flex-1 sm:flex-none px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 hover:scale-105 transition-all duration-200"
                          >
                            {t("save")}
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingTeam(null);
                              setOpenMenuId(null);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-800 truncate">
                          {team.name}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === team.id ? null : team.id
                              )
                            }
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-all duration-200"
                            aria-label={team.name}
                            aria-expanded={openMenuId === team.id}
                            aria-haspopup="true"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <AnimatePresence>
                            {openMenuId === team.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                ref={(el) => {
                                  if (el) {
                                    menuRefs.current.set(team.id, el);
                                  } else {
                                    menuRefs.current.delete(team.id);
                                  }
                                }}
                                className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                              >
                                <button
                                  onClick={() => {
                                    setEditingTeam(team);
                                    setOpenMenuId(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                >
                                  {t("edit")}
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                                >
                                  {t("delete")}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-red-600 mt-4 text-sm bg-red-50 p-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
