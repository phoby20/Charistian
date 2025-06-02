"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

interface Position {
  id: string;
  name: string;
}

interface PositionManagementProps {
  userRole: string | null;
  churchId: string | null;
}

export default function PositionManagement({
  userRole,
  churchId,
}: PositionManagementProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPositionName, setNewPositionName] = useState("");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingNewName, setEditingNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if ((userRole === "SUPER_ADMIN" || userRole === "MASTER") && churchId) {
      fetchPositions();
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

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/positions", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Fetch positions error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToFetchPositions");
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
      const { positions } = await response.json();
      setPositions(positions || []);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(t("serverError"));
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionName) {
      setError(t("positionNameRequired"));
      return;
    }
    try {
      const response = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newPositionName }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Add position error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToAddPosition");
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
      const { position } = await response.json();
      setPositions([...positions, position]);
      setNewPositionName("");
      await fetchPositions();
    } catch (err) {
      console.error("Error adding position:", err);
      setError(t("serverError"));
    }
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition || !editingNewName) {
      setError(t("positionNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/positions/${editingPosition.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newName: editingNewName }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Update position error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToUpdatePosition");
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
          setError(t("positionNotFound"));
          return;
        }
        throw new Error(error);
      }
      const { position } = await response.json();
      setPositions(positions.map((p) => (p.id === position.id ? position : p)));
      setEditingPosition(null);
      setEditingNewName("");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating position:", err);
      setError(t("serverError"));
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      const response = await fetch(`/api/positions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Delete position error response:", text);
        let error = "Unknown error";
        try {
          error = JSON.parse(text).error || t("failedToDeletePosition");
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
          setError(t("positionNotFound"));
          return;
        }
        throw new Error(error);
      }
      setPositions(positions.filter((p) => p.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting position:", err);
      setError(t("serverError"));
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("positionManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-10 flex items-center space-x-4">
          <input
            type="text"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            placeholder={t("enterPositionName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddPosition}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addPosition")}
          </Button>
        </div>
        {positions.length === 0 ? (
          <p className="text-gray-500 italic">{t("noPositions")}</p>
        ) : (
          <ul className="space-y-2">
            {positions.map((position) => (
              <li
                key={position.id}
                className="flex items-center space-x-2 relative"
              >
                {editingPosition?.id === position.id ? (
                  <>
                    <input
                      type="text"
                      value={editingNewName}
                      onChange={(e) => setEditingNewName(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md flex-1"
                    />
                    <Button
                      onClick={handleUpdatePosition}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("save")}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingPosition(null);
                        setEditingNewName("");
                        setOpenMenuId(null);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{position.name}</span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === position.id ? null : position.id
                          )
                        }
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === position.id && (
                        <div
                          ref={(el) => {
                            if (el) {
                              menuRefs.current.set(position.id, el);
                            } else {
                              menuRefs.current.delete(position.id);
                            }
                          }}
                          className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        >
                          <button
                            onClick={() => {
                              setEditingPosition(position);
                              setEditingNewName(position.name);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDeletePosition(position.id)}
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
