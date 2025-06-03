"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react"; // MoreVertical 아이콘 추가

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // 풀다운 메뉴 상태 추가
  const { t } = useTranslation("common");
  const router = useRouter();
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // 메뉴 참조 추가

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchDuties();
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

  const fetchDuties = async () => {
    try {
      const response = await fetch("/api/duties", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const { error } = await response.json();
        console.error("API error:", error);
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(error || t("failedToFetchDuties"));
      }
      const { duties } = await response.json();
      setDuties(duties || []); // 빈 배열로 초기화
    } catch (err) {
      console.error("Error fetching duties:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
    }
  };

  const handleAddDuty = async () => {
    if (!newDutyName) {
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
        body: JSON.stringify({ name: newDutyName, churchId }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(error || t("failedToAddDuty"));
      }
      const { duty } = await response.json();
      setDuties([...duties, duty]);
      setNewDutyName("");
    } catch (err) {
      console.error("Error adding duty:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
    }
  };

  const handleUpdateDuty = async () => {
    if (!editingDuty || !editingDuty.name) {
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
        body: JSON.stringify({ name: editingDuty.name, churchId }),
      });
      const data = await response.json();
      if (!response.ok) {
        const { error } = data;
        if (response.status === 401) {
          setError(t("invalidToken"));
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          setError(t("unauthorized"));
          return;
        }
        throw new Error(error || t("failedToUpdateDuty"));
      }
      const { duty } = data;
      if (!duty || !duty.id) {
        throw new Error("Invalid duty data returned from server");
      }
      setDuties(duties.map((d) => (d.id === duty.id ? duty : d)));
      setEditingDuty(null);
      setOpenMenuId(null); // 메뉴 닫기
    } catch (err) {
      console.error("Error updating duty:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
    }
  };

  const handleDeleteDuty = async (id: string) => {
    try {
      const response = await fetch(`/api/duties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || t("failedToDeleteDuty"));
      }
      setDuties(duties.filter((d) => d.id !== id));
      setOpenMenuId(null); // 메뉴 닫기
    } catch (err) {
      console.error("Error deleting duty:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
    }
  };

  if (userRole !== "MASTER" && userRole !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("dutyManagement")}
      </h2>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-10 flex items-center space-x-4">
          <input
            type="text"
            value={newDutyName}
            onChange={(e) => setNewDutyName(e.target.value)}
            placeholder={t("enterDutyName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddDuty}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addDuty")}
          </Button>
        </div>
        {duties.length === 0 ? (
          <p className="text-gray-500 italic">{t("noDuties")}</p>
        ) : (
          <ul className="space-y-2">
            {duties.map((duty) => (
              <li
                key={duty.id}
                className="flex items-center space-x-2 relative"
              >
                {editingDuty?.id === duty.id ? (
                  <>
                    <input
                      type="text"
                      value={editingDuty.name}
                      onChange={(e) =>
                        setEditingDuty({ ...editingDuty, name: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded-md flex-1"
                    />
                    <Button
                      onClick={handleUpdateDuty}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("save")}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingDuty(null);
                        setOpenMenuId(null); // 메뉴 닫기
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{duty.name}</span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === duty.id ? null : duty.id)
                        }
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === duty.id && (
                        <div
                          ref={(el) => {
                            if (el) {
                              menuRefs.current.set(duty.id, el);
                            } else {
                              menuRefs.current.delete(duty.id);
                            }
                          }}
                          className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        >
                          <button
                            onClick={() => {
                              setEditingDuty(duty);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDeleteDuty(duty.id)}
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
