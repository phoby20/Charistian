// src/app/master-management/page.tsx

"use client";

import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import GroupManagement from "@/components/GroupManagement";
import PositionManagement from "@/components/PositionManagement";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import DutyManagement from "@/components/DutyManagement";

export default function MasterManagementPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error } = useAuth();

  // URL 쿼리 파라미터에서 초기 탭 설정
  const initialTab = searchParams.get("tab") as
    | "positions"
    | "groups"
    | "duty"
    | null;
  const [activeTab, setActiveTab] = useState<"positions" | "groups" | "duty">(
    initialTab && ["positions", "groups", "duty"].includes(initialTab)
      ? initialTab
      : "positions"
  );

  useEffect(() => {
    if (
      !isLoading &&
      (!user || user.role === "VISITOR" || user.role === "GENERAL")
    ) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: "positions" | "groups" | "duty") => {
    setActiveTab(tab);
    // URL에 쿼리 파라미터 추가
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

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
              onClick={() => handleTabChange("positions")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "positions"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("positionManagement")}
            </button>
            <button
              onClick={() => handleTabChange("groups")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "groups"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("groupManagement")}
            </button>
            <button
              onClick={() => handleTabChange("duty")}
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
