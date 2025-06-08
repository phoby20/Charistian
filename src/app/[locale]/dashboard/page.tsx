// src/app/[locale]/dashboard/page.tsx
"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";
import { ChurchApplication, User } from "@prisma/client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading, error: authError } = useAuth();
  const [pendingChurches, setPendingChurches] = useState<ChurchApplication[]>(
    []
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch pending data
  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        const response = await fetch("/api/pending", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch data");
        const { pendingChurches, pendingUsers } = await response.json();
        setPendingChurches(pendingChurches);

        if (
          user &&
          (user.role === "MASTER" ||
            user.role === "SUPER_ADMIN" ||
            user.role === "ADMIN")
        ) {
          if (user.churchId) {
            const filteredUsers = pendingUsers.filter(
              (userData: User) => userData.churchId === user.churchId
            );
            setPendingUsers(filteredUsers);
          } else {
            setPendingUsers([]);
          }
        } else {
          setPendingUsers([]);
        }
      } catch (err) {
        console.error("Error fetching pending data:", err);
        setFetchError(t("serverError"));
      }
    };

    if (user && !isLoading) {
      fetchPendingData();
    }
  }, [user, isLoading, t]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t("dashboard")}
          </h1>
        </div>

        {/* Warning Alert */}
        {pendingUsers.length > 0 && (
          <div
            className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md cursor-pointer hover:bg-yellow-200 transition-colors"
            onClick={() => router.push(`/pending-users`)}
            role="button"
            aria-label={t("pendingUsersWarning")}
          >
            {t("pendingUsersWarning", { count: pendingUsers.length })}
          </div>
        )}

        {user && user.role === "MASTER" && pendingChurches.length > 0 && (
          <div
            className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md cursor-pointer hover:bg-yellow-200 transition-colors"
            onClick={() => router.push(`/pending-churches`)}
            role="button"
            aria-label={t("pendingChurchesWarning")}
          >
            {t("pendingChurchesWarning", { count: pendingChurches.length })}
          </div>
        )}

        {/* 에러 모달 */}
        {(authError || fetchError) && (
          <Modal isOpen={!!(authError || fetchError)}>
            <p className="text-red-600 text-center mb-4">
              {authError || fetchError}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setFetchError(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                {t("close")}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
