// src/components/GroupManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import SubGroupManagement from "./SubGroupManagement";

interface Group {
  id: string;
  name: string;
}

interface GroupManagementProps {
  userRole: string | null;
  churchId: string | null;
}

export default function GroupManagement({
  userRole,
  churchId,
}: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
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
      fetchGroups();
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
    if (editingGroup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingGroup]);

  // 그룹 목록 가져오기
  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups?churchId=${churchId}`, {
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
        throw new Error(errorData.error || t("failedToFetchGroups"));
      }
      const { groups } = await response.json();
      setGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError(t("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  // 그룹 선택
  const handleSelectGroup = (groupId: string) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    } else {
      setSelectedGroupId(groupId);
    }
    setOpenMenuId(null);
  };

  // 그룹 추가
  const handleAddGroup = async () => {
    if (!newGroupName) {
      setError(t("groupNameRequired"));
      return;
    }
    if (!churchId) {
      setError(t("noChurchId"));
      return;
    }
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newGroupName, churchId }),
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
        throw new Error(errorData.error || t("failedToAddGroup"));
      }
      setNewGroupName("");
      await fetchGroups();
    } catch (err) {
      console.error("Error adding group:", err);
      setError(t("serverError"));
    }
  };

  // 그룹 수정
  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.name) {
      setError(t("groupNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingGroup.name }),
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
          setError(t("groupNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToUpdateGroup"));
      }
      await fetchGroups();
      setEditingGroup(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating group:", err);
      setError(t("serverError"));
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
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
          setError(t("groupNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToDeleteGroup"));
      }
      setGroups(groups.filter((r) => r.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting group:", err);
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
        {t("groupManagement")}
      </h2>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {/* 그룹 추가 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t("enterGroupName")}
            className="w-full p-2 border rounded-md text-sm"
            aria-label={t("enterGroupName")}
          />
          <Button
            onClick={handleAddGroup}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t("addGroup")}
          </Button>
        </div>

        {/* 그룹 리스트 */}
        {groups.length === 0 ? (
          <p className="text-gray-500 italic text-center">{t("noGroups")}</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              if (!group?.id || !group?.name) {
                console.warn("Invalid group data:", group);
                return null;
              }
              const isSelected = selectedGroupId === group.id;
              return (
                <li key={group.id} className="py-2 cursor-pointer">
                  {/* 그룹 항목 */}
                  <div className="flex items-center gap-2">
                    {editingGroup?.id === group.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingGroup.name}
                          onChange={(e) =>
                            setEditingGroup({
                              ...editingGroup,
                              name: e.target.value,
                            })
                          }
                          ref={inputRef}
                          className="flex-1 p-2 border-green-500 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                          aria-label={t("editGroupName")}
                        />
                        <Button
                          onClick={handleUpdateGroup}
                          className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                        >
                          {t("save")}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingGroup(null);
                            setOpenMenuId(null);
                          }}
                          className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-xs"
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelectGroup(group.id)}
                          className={`flex-1 cursor-pointer text-left text-sm font-medium ${
                            isSelected ? "text-blue-600" : "text-gray-700"
                          } hover:text-blue-500`}
                        >
                          {group.name}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === group.id ? null : group.id
                              )
                            }
                            className="p-1 text-gray-600 hover:text-gray-800"
                            aria-label={t("groupOptions")}
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {openMenuId === group.id && (
                            <div
                              ref={(el) => {
                                if (el) menuRefs.current.set(group.id, el);
                                else menuRefs.current.delete(group.id);
                              }}
                              className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10"
                            >
                              <button
                                onClick={() => {
                                  setEditingGroup(group);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
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

                  {/* 서브그룹 관리 */}
                  {isSelected && churchId && (
                    <SubGroupManagement
                      groupId={group.id}
                      churchId={churchId}
                      onError={setError}
                    />
                  )}
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
