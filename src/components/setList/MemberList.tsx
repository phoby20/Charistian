// src/components/MemberList.tsx
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Member {
  id: string;
  name: string;
  profileImage: string | null;
  teams: { id: string; name: string }[];
}

interface MemberListProps {
  members: Member[];
  emptyMessage: string;
}

export const MemberList = ({ members, emptyMessage }: MemberListProps) => {
  const t = useTranslations("Setlist");

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t("selectedTeamMembers")}
      </h3>
      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {member.profileImage ? (
                <Image
                  src={member.profileImage}
                  alt={`${member.name}`}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-base font-medium">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-800 truncate">
                {member.name}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      )}
    </div>
  );
};
