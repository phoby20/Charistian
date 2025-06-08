"use client";

import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import Loading from "./Loading";
import { User } from "@/types/customUser";
import { getBorderColor } from "./roleBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface UserDetailViewProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function UserDetailView({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onEdit,
  isLoading,
  error,
}: UserDetailViewProps) {
  const t = useTranslations();

  const fields = [
    { key: "phone", label: t("phone"), icon: "phone" },
    { key: "kakaoId", label: t("kakaoId"), icon: "chat" },
    { key: "lineId", label: t("lineId"), icon: "chat" },
    { key: "country", label: t("country"), icon: "globe" },
    { key: "city", label: t("city"), icon: "map-pin" },
    { key: "region", label: t("region"), icon: "map-pin" },
    { key: "address", label: t("address"), icon: "home" },
    { key: "birthDate", label: t("birthDate"), icon: "calendar" },
    { key: "gender", label: t("gender"), icon: "user" },
    { key: "position", label: t("position"), icon: "briefcase" },
    { key: "groupId", label: t("group"), icon: "users" },
    { key: "subGroupId", label: t("subGroup"), icon: "users" },
    { key: "dutyIds", label: t("duties"), icon: "check-square" },
    { key: "teamIds", label: t("teams"), icon: "team" },
  ];

  if (isLoading) return <Loading />;
  if (error)
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-600 text-center p-4 text-sm"
      >
        {error}
      </motion.p>
    );

  return (
    <Modal isOpen={isOpen}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pt-2">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl tracking-tight">
            {t("userDetails")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            aria-label={t("close")}
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 프로필 섹션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Image
                src={user.profileImage || "/default_user.png"}
                alt={user.name}
                width={56}
                height={56}
                className="rounded-full object-cover border-2 border-gray-200 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => (e.currentTarget.src = "/default_user.png")}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-300 transition-all" />
            </div>
            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getBorderColor(user.role)}
                </span>
                <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">
                  {user.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm truncate">
                {user.email}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 정보 필드 */}
        <div className="space-y-3">
          <AnimatePresence>
            {fields.map(({ key, label, icon }, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 mt-1">
                    {icon === "phone" && "📞"}
                    {icon === "chat" && "💬"}
                    {icon === "globe" && "🌍"}
                    {icon === "map-pin" && "📍"}
                    {icon === "home" && "🏠"}
                    {icon === "calendar" && "📅"}
                    {icon === "user" && "👤"}
                    {icon === "briefcase" && "💼"}
                    {icon === "users" && "👥"}
                    {icon === "check-square" && "✅"}
                    {icon === "team" && "🤝"}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      {label}
                    </p>
                    <p className="text-sm text-gray-900 sm:text-base">
                      {key === "birthDate"
                        ? user.birthDate
                          ? new Date(user.birthDate).toLocaleDateString()
                          : t("none")
                        : key === "position"
                        ? user.position?.name || t("noPosition")
                        : key === "groupId"
                        ? user.group?.name || t("noGroup")
                        : key === "subGroupId"
                        ? user.subGroup?.name || t("noSubGroup")
                        : key === "dutyIds"
                        ? user.duties && user.duties.length > 0
                          ? user.duties.map((duty) => duty.name).join(", ")
                          : t("noDuties")
                        : key === "teamIds"
                        ? user.teams && user.teams.length > 0
                          ? user.teams.map((team) => team.name).join(", ")
                          : t("noTeams")
                        : (user[key as keyof User] as string) || t("none")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 버튼 바 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0 bg-white pt-4 mt-6 border-t border-gray-200"
        >
          <div className="flex flex-wrap justify-end gap-2">
            {onReject && (
              <Button
                onClick={onReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 hover:scale-105 transition-all duration-200"
                disabled={isLoading}
              >
                {t("reject")}
              </Button>
            )}
            {onApprove && (
              <Button
                onClick={onApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-600 hover:scale-105 transition-all duration-200"
                disabled={isLoading}
              >
                {t("approve")}
              </Button>
            )}
            <Button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              disabled={isLoading}
            >
              {t("edit")}
            </Button>
            <Button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 hover:scale-105 transition-all duration-200"
              disabled={isLoading}
            >
              {t("close")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </Modal>
  );
}
