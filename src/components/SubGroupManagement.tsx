// src/components/SubGroupManagement.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

interface SubGroup {
  id: string;
  name: string;
  groupId: string;
  churchId?: string;
}

interface SubGroupManagementProps {
  groupId: string;
  churchId: string;
  onError: (error: string) => void;
}

export default function SubGroupManagement({
  groupId,
  churchId,
  onError,
}: SubGroupManagementProps) {
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [newSubGroupName, setNewSubGroupName] = useState("");
  const [editingSubGroup, setEditingSubGroup] = useState<SubGroup | null>(null);
  const [subGroupLoading, setSubGroupLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const t = useTranslations();
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // 서브그룹 목록 가져오기
  useEffect(() => {
    fetchSubGroups();
  }, [groupId]);

  const fetchSubGroups = async () => {
    setSubGroupLoading(true);
    try {
      const response = await fetch(
        `/api/subGroups?groupId=${groupId}&churchId=${churchId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          onError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          onError(t("unauthorized"));
          return;
        }
        throw new Error(errorData.error || t("failedToFetchSubGroups"));
      }
      const { subGroups } = await response.json();
      setSubGroups(Array.isArray(subGroups) ? subGroups : []);
    } catch (err) {
      console.error("Error fetching subGroups:", err);
      onError(t("serverError"));
    } finally {
      setSubGroupLoading(false);
    }
  };

  // 서브그룹 추가
  const handleAddSubGroup = async () => {
    if (!newSubGroupName) {
      onError(t("subGroupNameRequired"));
      return;
    }
    try {
      const response = await fetch("/api/subGroups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newSubGroupName,
          groupId,
          churchId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          onError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          onError(t("unauthorized"));
          return;
        }
        throw new Error(errorData.error || t("failedToAddSubGroup"));
      }
      setNewSubGroupName("");
      await fetchSubGroups();
    } catch (err) {
      console.error("Error adding subGroup:", err);
      onError(t("serverError"));
    }
  };

  // 서브그룹 수정
  const handleUpdateSubGroup = async () => {
    if (!editingSubGroup || !editingSubGroup.name) {
      onError(t("subGroupNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/subGroups/${editingSubGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingSubGroup.name }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          onError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          onError(t("unauthorized"));
          return;
        }
        if (response.status === 404) {
          onError(t("subGroupNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToUpdateSubGroup"));
      }
      await fetchSubGroups();
      setEditingSubGroup(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating subGroup:", err);
      onError(t("serverError"));
    }
  };

  // 서브그룹 삭제
  const handleDeleteSubGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/subGroups/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          onError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          onError(t("unauthorized"));
          return;
        }
        if (response.status === 404) {
          onError(t("subGroupNotFound"));
          return;
        }
        throw new Error(errorData.error || t("failedToDeleteSubGroup"));
      }
      setSubGroups(subGroups.filter((sg) => sg.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting subGroup:", err);
      onError(t("serverError"));
    }
  };

  return (
    <div className="ml-4 mt-2">
      {/* 서브그룹 추가 */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={newSubGroupName}
          onChange={(e) => setNewSubGroupName(e.target.value)}
          placeholder={t("enterSubGroupName")}
          className="w-full p-2 border rounded-md text-sm"
          aria-label={t("enterSubGroupName")}
        />
        <Button
          onClick={handleAddSubGroup}
          className="w-full min-w-28 sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          disabled={subGroupLoading}
        >
          {t("addSubGroup")}
        </Button>
      </div>

      {/* 서브그룹 목록 */}
      {subGroupLoading ? (
        <p className="text-gray-500 text-sm">{t("loading")}</p>
      ) : subGroups.length === 0 ? (
        <p className="text-gray-500 italic text-sm">{t("noSubGroups")}</p>
      ) : (
        <ul className="space-y-1">
          {subGroups.map((subGroup) => (
            <li key={subGroup.id} className="flex items-center gap-2">
              {editingSubGroup?.id === subGroup.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSubGroup.name}
                    onChange={(e) =>
                      setEditingSubGroup({
                        ...editingSubGroup,
                        name: e.target.value,
                      })
                    }
                    className="flex-1 p-2 border rounded-md text-sm"
                  />
                  <Button
                    onClick={handleUpdateSubGroup}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                  >
                    {t("save")}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingSubGroup(null);
                      setOpenMenuId(null);
                    }}
                    className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-xs"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-600">
                    {subGroup.name}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === subGroup.id ? null : subGroup.id
                        )
                      }
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === subGroup.id && (
                      <div
                        ref={(el) => {
                          if (el) menuRefs.current.set(subGroup.id, el);
                          else menuRefs.current.delete(subGroup.id);
                        }}
                        className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10"
                      >
                        <button
                          onClick={() => {
                            setEditingSubGroup(subGroup);
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteSubGroup(subGroup.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          {t("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
