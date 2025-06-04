// src/components/TeamManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

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
  const { t } = useTranslation("common");
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
    if (!newTeamName) {
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
        body: JSON.stringify({ name: newTeamName, churchId }),
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
    if (!editingTeam || !editingTeam.name) {
      setError(t("teamNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingTeam.name }),
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
    return <p className="text-gray-500 text-center">{t("loading")}</p>;
  }

  if (!churchId) {
    return <p className="text-red-600 text-center">{t("noChurchId")}</p>;
  }

  return (
    <section className="mb-6">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">
        {t("teamManagement")}
      </h2>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {/* 팀 추가 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder={t("enterTeamName")}
            className="w-full p-2 border rounded-md text-sm"
            aria-label={t("enterTeamName")}
          />
          <Button
            onClick={handleAddTeam}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t("addTeam")}
          </Button>
        </div>

        {/* 팀 리스트 */}
        {teams.length === 0 ? (
          <p className="text-gray-500 italic text-center">{t("noTeams")}</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => {
              if (!team?.id || !team?.name) {
                console.warn("Invalid team data:", team);
                return null;
              }
              return (
                <li key={team.id} className="py-2 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {editingTeam?.id === team.id ? (
                      <div className="flex-1 flex items-center gap-2">
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
                          className="flex-1 p-2 border-green-500 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                          aria-label={t("editTeamName")}
                        />
                        <Button
                          onClick={handleUpdateTeam}
                          className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                        >
                          {t("save")}
                        </Button>
                        <button
                          onClick={() => {
                            setEditingTeam(null);
                            setOpenMenuId(null);
                          }}
                          className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-xs"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {team.name}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === team.id ? null : team.id
                              )
                            }
                            className="p-1 text-gray-600 hover:text-gray-800"
                            aria-label={t("teamOptions")}
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {openMenuId === team.id && (
                            <div
                              ref={(el) => {
                                if (el) menuRefs.current.set(team.id, el);
                                else menuRefs.current.delete(team.id);
                              }}
                              className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10"
                            >
                              <button
                                onClick={() => {
                                  setEditingTeam(team);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                {t("delete")}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
      </div>
    </section>
  );
}
