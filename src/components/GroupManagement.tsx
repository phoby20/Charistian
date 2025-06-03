// src/components/GroupManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

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
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchGroups();
    }
  }, [userRole, churchId]);

  // 외부 클릭 시 풀다운 메뉴 닫기
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

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/groups", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Fetch Groups error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToFetchGroups");
        } catch {
          error = t("serverError");
        }
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(error);
      }
      const data = await response.json();
      console.log("API response:", data);
      const duties = Array.isArray(data.duties) ? data.duties : [];
      setGroups(duties);
    } catch (err) {
      console.error("Error fetching Groups:", err);
      setError(t("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName) {
      setError(t("groupNameRequired"));
      return;
    }
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Add group error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToAddGroup");
        } catch {
          error = t("serverError");
        }
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(error);
      }
      const { duty } = await response.json();
      setGroups([...groups, duty]);
      setNewGroupName("");
      await fetchGroups();
    } catch (err) {
      console.error("Error adding group:", err);
      setError(t("serverError"));
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.name) {
      setError(t("groupNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: editingGroup.name }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Update group error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToUpdateGroup");
        } catch {
          error = t("serverError");
        }
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
        throw new Error(error);
      }
      const { group } = await response.json();
      setGroups(groups.map((r) => (r.id === group.id ? group : r)));
      setEditingGroup(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating group:", err);
      setError(t("serverError"));
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Delete group error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToDeleteGroup");
        } catch {
          error = t("serverError");
        }
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
        throw new Error(error);
      }
      setGroups(groups.filter((r) => r.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting group:", err);
      setError(t("serverError"));
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">{t("loading")}</p>;
  }

  if (!Array.isArray(groups)) {
    console.error("groups is not an array:", groups);
    return <p className="text-red-600">{t("invalidData")}</p>;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("groupManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-10 flex items-center space-x-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t("enterGroupName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addGroup")}
          </Button>
        </div>
        {groups.length === 0 ? (
          <p className="text-gray-500 italic">{t("noGroups")}</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              if (!group?.id || !group?.name) {
                console.warn("Invalid group data:", group);
                return null;
              }
              return (
                <li
                  key={group.id}
                  className="flex items-center space-x-2 relative"
                >
                  {editingGroup?.id === group.id ? (
                    <>
                      <input
                        type="text"
                        value={editingGroup.name}
                        onChange={(e) =>
                          setEditingGroup({
                            ...editingGroup,
                            name: e.target.value,
                          })
                        }
                        className="p-2 border border-gray-300 rounded-md flex-1"
                      />
                      <Button
                        onClick={handleUpdateGroup}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                      >
                        {t("save")}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingGroup(null);
                          setOpenMenuId(null);
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                      >
                        {t("cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{group.name}</span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === group.id ? null : group.id
                            )
                          }
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === group.id && (
                          <div
                            ref={(el) => {
                              if (el) {
                                menuRefs.current.set(group.id, el);
                              } else {
                                menuRefs.current.delete(group.id);
                              }
                            }}
                            className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
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
                </li>
              );
            })}
          </ul>
        )}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </section>
  );
}
