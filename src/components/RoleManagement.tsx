"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface RoleManagementProps {
  userRole: string | null;
  churchId: string | null;
}

export default function RoleManagement({
  userRole,
  churchId,
}: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/duties", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Fetch roles error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToFetchRoles");
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
      const { duties } = await response.json();
      setRoles(duties || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError(t("serverError"));
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName) {
      setError(t("roleNameRequired"));
      return;
    }
    try {
      const response = await fetch("/api/duties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newRoleName }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Add role error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToAddRole");
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
      setRoles([...roles, duty]);
      setNewRoleName("");
      await fetchRoles();
    } catch (err) {
      console.error("Error adding role:", err);
      setError(t("serverError"));
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !editingRole.name) {
      setError(t("roleNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/duties/${editingRole.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: editingRole.name }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Update role error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToUpdateRole");
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
          setError(t("roleNotFound"));
          return;
        }
        throw new Error(error);
      }
      const { role } = await response.json();
      setRoles(roles.map((r) => (r.id === role.id ? role : r)));
      setEditingRole(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating role:", err);
      setError(t("serverError"));
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const response = await fetch(`/api/duties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Delete role error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToDeleteRole");
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
          setError(t("roleNotFound"));
          return;
        }
        throw new Error(error);
      }
      setRoles(roles.filter((r) => r.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting role:", err);
      setError(t("serverError"));
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("roleManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-10 flex items-center space-x-4">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder={t("enterRoleName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddRole}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addRole")}
          </Button>
        </div>
        {roles.length === 0 ? (
          <p className="text-gray-500 italic">{t("noRoles")}</p>
        ) : (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role.id}
                className="flex items-center space-x-2 relative"
              >
                {editingRole?.id === role.id ? (
                  <>
                    <input
                      type="text"
                      value={editingRole.name}
                      onChange={(e) =>
                        setEditingRole({ ...editingRole, name: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded-md flex-1"
                    />
                    <Button
                      onClick={handleUpdateRole}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("save")}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingRole(null);
                        setOpenMenuId(null);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{role.name}</span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === role.id ? null : role.id)
                        }
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === role.id && (
                        <div
                          ref={(el) => {
                            if (el) {
                              menuRefs.current.set(role.id, el);
                            } else {
                              menuRefs.current.delete(role.id);
                            }
                          }}
                          className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        >
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
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
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </section>
  );
}
