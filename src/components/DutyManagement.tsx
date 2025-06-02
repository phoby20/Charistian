// src/components/DutyManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";

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
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    if ((userRole === "MASTER" || userRole === "SUPER_ADMIN") && churchId) {
      fetchDuties();
    }
  }, [userRole, churchId]);

  const fetchDuties = async () => {
    try {
      console.log("Sending request to /api/duties with credentials: include");
      const response = await fetch("/api/duties", {
        method: "GET",
        credentials: "include",
      });
      console.log("Response status:", response.status);
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
      setDuties(duties);
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
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || t("failedToUpdateDuty"));
      }
      const { duty } = await response.json();
      setDuties(duties.map((d) => (d.id === duty.id ? duty : d)));
      setEditingDuty(null);
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
        <div className="mb-4">
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
              <li key={duty.id} className="flex items-center space-x-2">
                {editingDuty?.id === duty.id ? (
                  <>
                    <input
                      type="text"
                      value={editingDuty.name}
                      onChange={(e) =>
                        setEditingDuty({ ...editingDuty, name: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded-md"
                    />
                    <Button
                      onClick={handleUpdateDuty}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("save")}
                    </Button>
                    <Button
                      onClick={() => setEditingDuty(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{duty.name}</span>
                    <Button
                      onClick={() => setEditingDuty(duty)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteDuty(duty.id)}
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
