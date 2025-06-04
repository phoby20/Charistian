// src/app/master-management/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import GroupManagement from "@/components/GroupManagement";
import PositionManagement from "@/components/PositionManagement";
import DutyManagement from "@/components/DutyManagement";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function MasterManagementPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error } = useAuth();

  // 초기 탭 설정
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

  // 권한 체크
  useEffect(() => {
    if (
      !isLoading &&
      (!user || user.role === "VISITOR" || user.role === "GENERAL")
    ) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // 탭 변경 핸들러
  const handleTabChange = (tab: "positions" | "groups" | "duty") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false }); // replace로 네트워크 요청 최소화
  };

  // 탭 정의
  const tabs = [
    { id: "positions", label: t("positionManagement") },
    { id: "groups", label: t("groupManagement") },
    { id: "duty", label: t("dutyManagement") },
  ] as const;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!user || user.role === "VISITOR" || user.role === "GENERAL") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t("masterManagement")}
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* 모바일: 드롭다운 탭 */}
        <div className="sm:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) =>
              handleTabChange(e.target.value as "positions" | "groups" | "duty")
            }
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            aria-label={t("selectTab")}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* 데스크톱: 탭 네비게이션 */}
        <div className="hidden sm:block mb-6">
          <nav className="flex space-x-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-md transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                } min-w-[120px] text-center touch-manipulation`} // 터치 친화적 크기
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md text-sm sm:text-base">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
