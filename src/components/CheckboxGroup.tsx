// src/app/[locale]/setlists/create/CheckboxGroup.tsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MemberList } from "./setList/MemberList";

interface Member {
  id: string;
  name: string;
  profileImage: string | null;
  teams: { id: string; name: string }[];
}

interface CheckboxGroupProps<T extends { id: string; name: string }> {
  items: T[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  emptyMessage: string;
}

export const CheckboxGroup = <T extends { id: string; name: string }>({
  items,
  selectedIds,
  setSelectedIds,
  emptyMessage,
}: CheckboxGroupProps<T>) => {
  const t = useTranslations("Setlist");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (selectedIds.length === 0) {
        setMembers([]);
        return;
      }

      setIsLoadingMembers(true);
      setError(null);

      try {
        const response = await fetch("/api/members", {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(t("fetchMembersError"));
        }

        const data = await response.json();
        if (!data.members || !Array.isArray(data.members)) {
          throw new Error(t("fetchMembersError"));
        }

        const filteredMembers = data.members.filter((member: Member) =>
          member.teams.some((team) => selectedIds.includes(team.id))
        );
        setMembers(filteredMembers);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("fetchMembersError"));
        console.error("Error fetching members:", err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [selectedIds, t]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <motion.label
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  htmlFor={`checkbox-${item.id}`}
                  className={`cursor-pointer px-2.5 py-1.5 rounded-md text-sm font-medium border transition ${
                    selected
                      ? "bg-[#fc089e] hover:bg-[#ff66c4] text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <input
                      type="checkbox"
                      id={`checkbox-${item.id}`}
                      checked={selected}
                      onChange={() => handleToggle(item.id)}
                      className="hidden"
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                </motion.label>
              );
            })}
          </div>
        )}
      </div>

      {/* 멤버 정보 표시 */}
      {isLoadingMembers ? (
        <p className="text-sm text-gray-500">{t("loadingMembers")}</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="mt-8">
          <MemberList members={members} emptyMessage={t("noMembers")} />
        </div>
      )}
    </div>
  );
};
