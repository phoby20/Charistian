// src/app/master-management/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import RoleManagement from "@/components/RoleManagement";
import PositionManagement from "@/components/PositionManagement";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function MasterManagementPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { user, isLoading, error } = useAuth();

  useEffect(() => {
    if (
      !isLoading &&
      (!user || user.role === "VISITOR" || user.role === "GENERAL")
    ) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!user || user.role === "VISITOR" || user.role === "GENERAL") {
    return null;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {t("masterManagement")}
        </h1>
        <PositionManagement userRole={user.role} churchId={user.churchId} />
        <RoleManagement userRole={user.role} churchId={user.churchId} />
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
