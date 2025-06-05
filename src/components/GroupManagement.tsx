"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical, ChevronDown } from "lucide-react";
import SubGroupManagement from "./SubGroupManagement";
import { motion, AnimatePresence } from "framer-motion";

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
    if (!newGroupName.trim()) {
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
        body: JSON.stringify({ name: newGroupName.trim(), churchId }),
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
    if (!editingGroup || !editingGroup.name.trim()) {
      setError(t("groupNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingGroup.name.trim() }),
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
        {t("groupManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        {/* 그룹 추가 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t("enterGroupName")}
            className="w-full sm:flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
            aria-label={t("enterGroupName")}
          />
          <Button
            onClick={handleAddGroup}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {t("addGroup")}
          </Button>
        </div>

        {/* 그룹 리스트 */}
        {groups.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 italic text-center text-sm"
          >
            {t("noGroups")}
          </motion.p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {groups.map((group, index) => {
                if (!group?.id || !group?.name) {
                  console.warn("Invalid group data:", group);
                  return null;
                }
                const isSelected = selectedGroupId === group.id;
                return (
                  <motion.li
                    key={group.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200"
                  >
                    {/* 그룹 항목 */}
                    <div className="flex items-center gap-3">
                      {editingGroup?.id === group.id ? (
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
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
                            className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                            aria-label={t("editGroupName")}
                          />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              onClick={handleUpdateGroup}
                              className="flex-1 sm:flex-none px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 hover:scale-105 transition-all duration-200"
                            >
                              {t("save")}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingGroup(null);
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
                          <button
                            onClick={() => handleSelectGroup(group.id)}
                            className={`flex-1 flex items-center justify-between text-left text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 truncate`}
                            aria-expanded={isSelected}
                            aria-controls={`subgroup-${group.id}`}
                          >
                            <span className="truncate">{group.name}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === group.id ? null : group.id
                                )
                              }
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-all duration-200"
                              aria-label={t("groupOptions", {
                                name: group.name,
                              })}
                              aria-expanded={openMenuId === group.id}
                              aria-haspopup="true"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                              {openMenuId === group.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  ref={(el) => {
                                    if (el) menuRefs.current.set(group.id, el);
                                    else menuRefs.current.delete(group.id);
                                  }}
                                  className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                                >
                                  <button
                                    onClick={() => {
                                      setEditingGroup(group);
                                      setOpenMenuId(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                  >
                                    {t("edit")}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGroup(group.id)}
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
                    </div>

                    {/* 서브그룹 관리 */}
                    <AnimatePresence>
                      {isSelected && churchId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          id={`subgroup-${group.id}`}
                          className="mt-3 pl-4 border-l-2 border-gray-200"
                        >
                          <SubGroupManagement
                            groupId={group.id}
                            churchId={churchId}
                            onError={setError}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
