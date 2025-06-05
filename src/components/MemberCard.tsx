"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import { User } from "@/types/customUser";
import { Role } from "@prisma/client";

interface MemberCardProps {
  user: User;
  onClick: (user: User) => void;
}

export default function MemberCard({ user, onClick }: MemberCardProps) {
  const { t } = useTranslation("common");

  // Role에 따른 border 색상 매핑
  const getBorderColor = (role: string) => {
    switch (role) {
      case Role.VISITOR:
        return (
          <p className="text-sm text-gray-100 px-3 rounded-full border bg-gray-500 border-gray-300">
            {role}
          </p>
        );
      case Role.GENERAL:
        return <></>;
      case Role.ADMIN:
        return (
          <p className="text-sm text-gray-100 px-3 rounded-full border bg-blue-500 border-blue-500">
            {role}
          </p>
        );
      case Role.SUB_ADMIN:
        return (
          <p className="text-sm text-gray-100 px-3 rounded-full border bg-indigo-500 border-indigo-500">
            {role}
          </p>
        );
      case Role.SUPER_ADMIN:
        return (
          <p className="text-sm text-gray-100 px-3 rounded-full border bg-purple-500 border-purple-500">
            {role}
          </p>
        );
      case Role.MASTER:
        return (
          <p className="text-sm text-gray-100 px-3 rounded-full border bg-red-500 border-red-500">
            {role}
          </p>
        );
      default:
        <></>;
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl hover:border transition-shadow duration-300 cursor-pointer flex items-center space-x-4"
      onClick={() => onClick(user)}
      role="button"
      aria-label={t("viewUserDetails", { name: user.name })}
    >
      <Image
        src={user.profileImage || "/default_user.png"}
        alt={user.name}
        width={60}
        height={50}
        className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
        onError={(e) => (e.currentTarget.src = "/default_user.png")}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {getBorderColor(user.role)}
          <p className="font-bold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">
            {user.position ? user.position.name : t("noPosition")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.duties.map((duty) => (
            <p
              className="text-xs text-gray-600 border border-green-500 bg-green-100 rounded-full px-2"
              key={duty.id}
            >
              {duty.name}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {user.teams.map((team) => (
            <p
              className="text-xs text-gray-600 border border-orange-500 bg-orange-100 rounded-full px-2"
              key={team.id}
            >
              {team.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
