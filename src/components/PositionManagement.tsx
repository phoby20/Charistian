"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

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
  const t = useTranslations();
  const router = useRouter();

  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if ((userRole === "SUPER_ADMIN" || userRole === "MASTER") && churchId) {
      fetchPositions();
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
    if (!newPositionName.trim()) {
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
        body: JSON.stringify({ name: newPositionName.trim() }),
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
    if (!editingPosition || !editingNewName.trim()) {
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
        body: JSON.stringify({ newName: editingNewName.trim() }),
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
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">
        {t("positionManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        {/* 추가 폼 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            placeholder={t("enterPositionName")}
            className="w-full sm:flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
            aria-label={t("enterPositionName")}
          />
          <Button
            onClick={handleAddPosition}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {t("addPosition")}
          </Button>
        </div>

        {/* 직책 목록 */}
        {positions.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 italic text-center text-sm"
          >
            {t("noPosition")}
          </motion.p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {positions.map((position, index) => (
                <motion.li
                  key={position.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200"
                >
                  {editingPosition?.id === position.id ? (
                    <>
                      <input
                        type="text"
                        value={editingNewName}
                        onChange={(e) => setEditingNewName(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                        aria-label={t("editPositionName")}
                      />
                      <Button
                        onClick={handleUpdatePosition}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 hover:scale-105 transition-all duration-200"
                      >
                        {t("save")}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingPosition(null);
                          setEditingNewName("");
                          setOpenMenuId(null);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                      >
                        {t("cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-800 truncate">
                        {position.name}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === position.id ? null : position.id
                            )
                          }
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-all duration-200"
                          aria-label={position.name}
                          aria-expanded={openMenuId === position.id}
                          aria-haspopup="true"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === position.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              ref={(el) => {
                                if (el) {
                                  menuRefs.current.set(position.id, el);
                                } else {
                                  menuRefs.current.delete(position.id);
                                }
                              }}
                              className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                            >
                              <button
                                onClick={() => {
                                  setEditingPosition(position);
                                  setEditingNewName(position.name);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeletePosition(position.id)
                                }
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
              ))}
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
