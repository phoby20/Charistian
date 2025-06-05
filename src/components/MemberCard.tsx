"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import { User } from "@/types/customUser";
import { getBorderColor } from "./roleBadge";
import { motion } from "framer-motion";

interface MemberCardProps {
  user: User;
  onClick: (user: User) => void;
}

export default function MemberCard({ user, onClick }: MemberCardProps) {
  const { t } = useTranslation("common");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer flex items-center space-x-3 border border-gray-200 hover:border-blue-300"
      onClick={() => onClick(user)}
      role="button"
      tabIndex={0}
      aria-label={t("viewUserDetails", { name: user.name })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(user);
        }
      }}
    >
      {/* 프로필 이미지 */}
      <div className="relative group flex-shrink-0">
        <Image
          src={user.profileImage || "/default_user.png"}
          alt={user.name}
          width={48}
          height={48}
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 group-hover:scale-105 transition-transform duration-200"
          onError={(e) => (e.currentTarget.src = "/default_user.png")}
        />
        <div className="absolute inset-0 rounded-full ring-2 ring-offset-1 ring-transparent group-hover:ring-blue-300 transition-all" />
      </div>

      {/* 정보 섹션 */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* 이름 및 직책 */}
        <div className="flex items-center gap-2">
          {getBorderColor(user.role)}
          <p className="font-semibold text-gray-900 text-sm truncate">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.position ? user.position.name : t("noPosition")}
          </p>
        </div>

        {/* 직무 태그 */}
        {user.duties && user.duties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide">
            {user.duties.map((duty) => (
              <span
                key={duty.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 transition-colors duration-200"
              >
                {duty.name}
              </span>
            ))}
          </div>
        )}

        {/* 팀 태그 */}
        {user.teams && user.teams.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-hide">
            {user.teams.map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 transition-colors duration-200"
              >
                {team.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
