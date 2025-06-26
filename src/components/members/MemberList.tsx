import { motion } from "framer-motion";
import MemberCard from "@/components/MemberCard";
import { User } from "@/types/customUser";
import { useTranslations } from "next-intl";

interface MemberListProps {
  filteredMembers: User[];
  subGroupedMembers: { [key: string]: User[] };
  sortedSubGroupKeys: string[];
  setSelectedUser: (user: User | null) => void;
}

export default function MemberList({
  filteredMembers,
  subGroupedMembers,
  sortedSubGroupKeys,
  setSelectedUser,
}: MemberListProps) {
  const t = useTranslations();

  return (
    <>
      {filteredMembers.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 italic text-center text-sm"
        >
          {t("noMembers")}
        </motion.p>
      ) : (
        <div className="space-y-6">
          {sortedSubGroupKeys.map((subGroupKey) => (
            <motion.section
              key={subGroupKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200"
              aria-labelledby={`subgroup-${subGroupKey.replace(/\s/g, "-")}`}
            >
              <h2
                id={`subgroup-${subGroupKey.replace(/\s/g, "-")}`}
                className="text-lg font-semibold text-gray-800 mb-4"
              >
                {subGroupKey}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subGroupedMembers[subGroupKey].map((user) => (
                  <MemberCard
                    key={user.id}
                    user={user}
                    onClick={setSelectedUser}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </>
  );
}
