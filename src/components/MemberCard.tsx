"use client";

import Image from "next/image";
import { CustomUser } from "@/types/customUser";
import { getBorderColor } from "./roleBadge";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface MemberCardProps {
  user: CustomUser;
  onClick: (user: CustomUser) => void;
  attendanceStatus?: {
    [key: string]: boolean;
  };
}

export default function MemberCard({
  user,
  onClick,
  attendanceStatus,
}: MemberCardProps) {
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-26 bg-white rounded-xl shadow-md p-3 pl-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer flex items-center space-x-8 border border-gray-200 hover:border-blue-300"
      onClick={() => onClick(user)}
      role="button"
      tabIndex={0}
      aria-label={user.name}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(user);
        }
      }}
    >
      {/* 프로필 이미지 */}
      <div className="relative group flex-shrink-0">
        <div className="relative flex flex-col items-center">
          <Image
            src={user.profileImage || "/default_user.png"}
            alt={user.name}
            width={48}
            height={48}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 group-hover:scale-105 transition-transform duration-200"
            onError={(e) => (e.currentTarget.src = "/default_user.png")}
          />
          {attendanceStatus && (
            <span
              className={`absolute bottom-[-17] text-xs font-medium px-2 py-1 rounded-full ${
                attendanceStatus[user.id]
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {attendanceStatus[user.id] ? t("attended") : t("notAttended")}
            </span>
          )}
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* 이름 및 직책 */}
        <div className="flex flex-col">
          {getBorderColor(user.role)}
          <p className="font-semibold text-gray-900 text-sx truncate">
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
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-800 border border-green-300 hover:bg-green-200 transition-colors duration-200"
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
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-orange-800 border border-orange-300 hover:bg-orange-200 transition-colors duration-200"
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
