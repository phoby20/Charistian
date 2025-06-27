import { motion } from "framer-motion";
import MemberCard from "@/components/MemberCard";
import { CustomUser } from "@/types/customUser";
import { useTranslations } from "next-intl";

interface MemberListProps {
  filteredMembers: CustomUser[];
  subGroupedMembers: { [key: string]: CustomUser[] };
  sortedSubGroupKeys: string[];
  setSelectedUser: (user: CustomUser | null) => void;
}

export default function MemberList({
  filteredMembers,
  subGroupedMembers,
  sortedSubGroupKeys,
  setSelectedUser,
}: MemberListProps) {
  const t = useTranslations();

  // 서브그룹 키에 해당하는 그룹 이름 찾기
  const getGroupNameForSubGroup = (subGroupKey: string) => {
    // subGroupKey가 t("noSubGroup")인 경우
    if (subGroupKey === t("noSubGroup")) {
      // filteredMembers에서 group이 없는 사용자의 그룹 이름을 반환
      const userWithoutSubGroup = filteredMembers.find(
        (user) => !user.subGroup?.name
      );
      return userWithoutSubGroup
        ? userWithoutSubGroup.group?.name || t("noGroup")
        : t("noGroup");
    }

    // subGroupKey에 해당하는 사용자의 그룹 이름 찾기
    const userWithSubGroup = filteredMembers.find(
      (user) => user.subGroup?.name === subGroupKey
    );
    return userWithSubGroup
      ? userWithSubGroup.group?.name || t("noGroup")
      : t("noGroup");
  };

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
          {sortedSubGroupKeys.map((subGroupKey) => {
            const groupName = getGroupNameForSubGroup(subGroupKey);
            const displayName =
              subGroupKey === t("noSubGroup")
                ? `${groupName}-${t("noSubGroup")}`
                : `${groupName}-${subGroupKey}`;

            return (
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
                  {displayName}
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
            );
          })}
        </div>
      )}
    </>
  );
}
