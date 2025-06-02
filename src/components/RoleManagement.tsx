// src/components/RoleManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";

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
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchRoles();
    }
  }, [userRole, churchId]);

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
        } catch (err) {
          error = t("serverError", { error: err });
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
      console.log("Fetched roles:", duties);
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
        } catch (err) {
          error = t("serverError", { error: err });
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
      console.log("Added role:", duty);
      setRoles([...roles, duty]);
      setNewRoleName("");
      await fetchRoles(); // 최신 데이터 동기화
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
      console.log("Updating role:", editingRole);
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
        } catch (err) {
          error = t("serverError", { error: err });
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
      const { role } = await response.json(); // 서버 응답의 'role' 키 사용
      console.log("Updated role:", role);
      setRoles(roles.map((r) => (r.id === role.id ? role : r)));
      setEditingRole(null);
    } catch (err) {
      console.error("Error updating role:", err);
      setError(t("serverError"));
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      console.log("Deleting role ID:", id);
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
        } catch (err) {
          error = t("serverError", { error: err });
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
      console.log("Role deleted:", id);
      setRoles(roles.filter((r) => r.id !== id));
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
        <div className="mb-4">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder={t("enterRoleName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddRole}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addRole")}
          </Button>
        </div>
        {roles.length === 0 ? (
          <p className="text-gray-500 italic">{t("noRoles")}</p>
        ) : (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li key={role.id} className="flex items-center space-x-2">
                {editingRole?.id === role.id ? (
                  <>
                    <input
                      type="text"
                      value={editingRole.name}
                      onChange={(e) =>
                        setEditingRole({ ...editingRole, name: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded-md"
                    />
                    <Button
                      onClick={handleUpdateRole}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("save")}
                    </Button>
                    <Button
                      onClick={() => setEditingRole(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{role.name}</span>
                    <Button
                      onClick={() => setEditingRole(role)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteRole(role.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("delete")}
                    </Button>
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
