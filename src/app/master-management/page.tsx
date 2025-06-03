// src/app/master-management/page.tsx

"use client";

import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import GroupManagement from "@/components/GroupManagement";
import PositionManagement from "@/components/PositionManagement";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import DutyManagement from "@/components/DutyManagement";

export default function MasterManagementPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { user, isLoading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<"positions" | "groups" | "duty">(
    "positions"
  );

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
        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("positions")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "positions"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("positionManagement")}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "groups"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("groupManagement")}
            </button>
            <button
              onClick={() => setActiveTab("duty")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "duty"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("dutyManagement")}
            </button>
          </nav>
        </div>
        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === "positions" && (
            <PositionManagement userRole={user.role} churchId={user.churchId} />
          )}
          {activeTab === "groups" && (
            <GroupManagement userRole={user.role} churchId={user.churchId} />
          )}
          {activeTab === "duty" && (
            <DutyManagement userRole={user.role} churchId={user.churchId} />
          )}
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
