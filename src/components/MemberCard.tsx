import { useTranslation } from "react-i18next";
import Image from "next/image";
import { User } from "@/types/customUser";

interface MemberCardProps {
  user: User;
  onClick: (user: User) => void;
}

export default function MemberCard({ user, onClick }: MemberCardProps) {
  const { t } = useTranslation("common");

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
        className="w-14 h-14 rounded-full object-cover border-2 border-gray-300"
        onError={(e) => (e.currentTarget.src = "/default_user.png")}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center  gap-3">
          <p className="text-lg font-bold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">
            {user.position ? user.position.name : t("noPosition")}
          </p>
        </div>
        <div className="flex gap-2">
          {user.duties.map((duty) => {
            return (
              <p
                className="text-xs text-gray-600 border border-green-500 bg-green-100 rounded-full px-2"
                key={duty.id}
              >
                {duty.name}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
