"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GroupManagement from "@/components/GroupManagement";
import PositionManagement from "@/components/PositionManagement";
import DutyManagement from "@/components/DutyManagement";
import TeamManagement from "@/components/TeamManagement";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";

type TabId = "positions" | "groups" | "duty" | "team";

interface Tab {
  id: TabId;
  label: string;
}

function MasterManagementContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, error } = useAuth();

  const tabs: Tab[] = [
    { id: "positions", label: t("positionManagement") },
    { id: "groups", label: t("groupManagement") },
    { id: "duty", label: t("dutyManagement") },
    { id: "team", label: t("teamManagement") },
  ];

  const initialTab = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && tabs.map((tab) => tab.id).includes(initialTab)
      ? initialTab
      : "positions"
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      setIsDropdownOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
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
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <Loading />
      </motion.div>
    );
  }

  if (!user || user.role === "VISITOR" || user.role === "GENERAL") {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100"
    >
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            {t("masterManagement")}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:hidden mb-4 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className="truncate max-w-[200px]">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg z-30 overflow-hidden"
                role="menu"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    role="menuitem"
                    aria-selected={activeTab === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden sm:block mb-6">
          <nav
            className="flex space-x-1 bg-gray-100 p-1 rounded-full border border-gray-200"
            role="tablist"
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-200"
                } min-w-[120px] text-center touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          {activeTab === "positions" && (
            <PositionManagement userRole={user.role} churchId={user.churchId} />
          )}
          {activeTab === "groups" && (
            <GroupManagement userRole={user.role} churchId={user.churchId} />
          )}
          {activeTab === "duty" && (
            <DutyManagement userRole={user.role} churchId={user.churchId} />
          )}
          {activeTab === "team" && (
            <TeamManagement userRole={user.role} churchId={user.churchId} />
          )}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm sm:text-base shadow-sm"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

export default function MasterManagementPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MasterManagementContent />
    </Suspense>
  );
}
