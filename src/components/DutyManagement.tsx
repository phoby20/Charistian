"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

interface Duty {
  id: string;
  name: string;
}

interface DutyManagementProps {
  userRole: string | null;
  churchId: string | null;
}

export default function DutyManagement({
  userRole,
  churchId,
}: DutyManagementProps) {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [newDutyName, setNewDutyName] = useState("");
  const [editingDuty, setEditingDuty] = useState<Duty | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const t = useTranslations();
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchDuties();
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
    if (editingDuty && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingDuty]);

  const fetchDuties = async () => {
    try {
      const response = await fetch("/api/duties", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData.error);
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(errorData.error || t("failedToFetchDuties"));
      }
      const { duties } = await response.json();
      setDuties(duties || []);
    } catch (err) {
      console.error("Error fetching duties:", err);
      setError(t("serverError"));
    }
  };

  const handleAddDuty = async () => {
    if (!newDutyName.trim()) {
      setError(t("dutyNameRequired"));
      return;
    }
    try {
      const response = await fetch("/api/duties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newDutyName.trim(), churchId }),
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
        throw new Error(errorData.error || t("failedToAddDuty"));
      }
      const { duty } = await response.json();
      setDuties([...duties, duty]);
      setNewDutyName("");
      await fetchDuties();
    } catch (err) {
      console.error("Error adding duty:", err);
      setError(t("serverError"));
    }
  };

  const handleUpdateDuty = async () => {
    if (!editingDuty || !editingDuty.name.trim()) {
      setError(t("dutyNameRequired"));
      return;
    }
    try {
      const response = await fetch(`/api/duties/${editingDuty.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: editingDuty.name.trim(), churchId }),
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
        throw new Error(errorData.error || t("failedToUpdateDuty"));
      }
      const { duty } = await response.json();
      if (!duty || !duty.id) {
        throw new Error("Invalid duty data returned from server");
      }
      setDuties(duties.map((d) => (d.id === duty.id ? duty : d)));
      setEditingDuty(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error updating duty:", err);
      setError(t("serverError"));
    }
  };

  const handleDeleteDuty = async (id: string) => {
    try {
      const response = await fetch(`/api/duties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("failedToDeleteDuty"));
      }
      setDuties(duties.filter((d) => d.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error deleting duty:", err);
      setError(t("serverError"));
    }
  };

  if (userRole !== "MASTER" && userRole !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">
        {t("dutyManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        {/* 추가 폼 */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newDutyName}
            onChange={(e) => setNewDutyName(e.target.value)}
            placeholder={t("enterDutyName")}
            className="w-full sm:flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
            aria-label={t("enterDutyName")}
          />
          <Button
            onClick={handleAddDuty}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {t("addDuty")}
          </Button>
        </div>

        {/* 직무 목록 */}
        {duties.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 italic text-center text-sm"
          >
            {t("noDuties")}
          </motion.p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {duties.map((duty, index) => (
                <motion.li
                  key={duty.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200"
                >
                  {editingDuty?.id === duty.id ? (
                    <>
                      <input
                        type="text"
                        value={editingDuty.name}
                        onChange={(e) =>
                          setEditingDuty({
                            ...editingDuty,
                            name: e.target.value,
                          })
                        }
                        ref={inputRef}
                        className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm"
                        aria-label={t("editDutyName")}
                      />
                      <Button
                        onClick={handleUpdateDuty}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 hover:scale-105 transition-all duration-200"
                      >
                        {t("save")}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingDuty(null);
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
                        {duty.name}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === duty.id ? null : duty.id
                            )
                          }
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-all duration-200"
                          aria-label={duty.name}
                          aria-expanded={openMenuId === duty.id}
                          aria-haspopup="true"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === duty.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              ref={(el) => {
                                if (el) {
                                  menuRefs.current.set(duty.id, el);
                                } else {
                                  menuRefs.current.delete(duty.id);
                                }
                              }}
                              className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                            >
                              <button
                                onClick={() => {
                                  setEditingDuty(duty);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={() => handleDeleteDuty(duty.id)}
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
