// src/components/PositionManagement.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";

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
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    if ((userRole === "SUPER_ADMIN" || userRole === "MASTER") && churchId) {
      fetchPositions();
    }
  }, [userRole, churchId]);

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/positions", {
        method: "GET",
        credentials: "include",
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
        throw new Error(error || t("failedToFetchPositions"));
      }
      const { positions } = await response.json();
      console.log("Fetched positions:", positions);
      setPositions(positions || []);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
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
        throw new Error(error || t("failedToAddPosition"));
      }
      const { position } = await response.json();
      console.log("Added position:", position);
      setPositions([...positions, position]);
      setNewPositionName("");
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
      console.log("Updating position:", editingPosition);
      const response = await fetch(`/api/positions/${editingPosition.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newName: editingNewName }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        console.error("Update error:", error);
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
        throw new Error(error || t("failedToUpdatePosition"));
      }
      const { position } = await response.json();
      console.log("Updated position:", position);
      setPositions(positions.map((p) => (p.id === position.id ? position : p)));
      setEditingPosition(null);
      setEditingNewName("");
    } catch (err) {
      console.error("Error updating position:", err);
      setError(t("serverError"));
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      console.log("Deleting position ID:", id);
      const response = await fetch(`/api/positions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const { error } = await response.json();
        console.error("Delete error:", error);
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
        throw new Error(error || t("failedToDeletePosition"));
      }
      console.log("Position deleted:", id);
      setPositions(positions.filter((p) => p.id !== id));
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
        <div className="mb-4">
          <input
            type="text"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            placeholder={t("enterPositionName")}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleAddPosition}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {t("addPosition")}
          </Button>
        </div>
        {positions.length === 0 ? (
          <p className="text-gray-500 italic">{t("noPositions")}</p>
        ) : (
          <ul className="space-y-2">
            {positions.map((position) => (
              <li key={position.id} className="flex items-center space-x-2">
                {editingPosition?.id === position.id ? (
                  <>
                    <input
                      type="text"
                      value={editingNewName}
                      onChange={(e) => setEditingNewName(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
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
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{position.name}</span>
                    <Button
                      onClick={() => {
                        setEditingPosition(position);
                        setEditingNewName(position.name);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeletePosition(position.id)}
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
