// src/components/DesktopFilterTabs.tsx
"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";

interface DesktopFilterTabsProps {
  groups: string[];
  subGroups: string[];
  teams: string[];
  selectedGroups: string[];
  selectedSubGroups: string[];
  selectedTeams: string[];
  setSelectedGroups: Dispatch<SetStateAction<string[]>>;
  setSelectedSubGroups: Dispatch<SetStateAction<string[]>>;
  setSelectedTeams: Dispatch<SetStateAction<string[]>>;
}

export default function DesktopFilterTabs({
  groups,
  subGroups,
  teams,
  selectedGroups,
  selectedSubGroups,
  selectedTeams,
  setSelectedGroups,
  setSelectedSubGroups,
  setSelectedTeams,
}: DesktopFilterTabsProps) {
  const t = useTranslations();

  const handleGroupSelect = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleSubGroupSelect = (subGroup: string) => {
    setSelectedSubGroups((prev) =>
      prev.includes(subGroup)
        ? prev.filter((sg) => sg !== subGroup)
        : [...prev, subGroup]
    );
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  return (
    <div className="hidden md:block space-y-4 bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 mb-6">
      <p className="font-bold">{t("filter")}</p>
      <div className="flex items-center space-x-4 p-1">
        <span className="w-24 min-w-24">{t("selectGroups")}</span>
        <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
          {groups.map((group) => (
            <motion.button
              key={group}
              onClick={() => handleGroupSelect(group)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                selectedGroups.includes(group)
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-200"
              }`}
              aria-selected={selectedGroups.includes(group)}
              role="tab"
            >
              {group}
            </motion.button>
          ))}
        </nav>
      </div>
      <div className="flex items-center space-x-4 p-1">
        <span className="w-24 min-w-24">{t("selectSubGroups")}</span>
        <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
          {subGroups.map((subGroup) => (
            <motion.button
              key={subGroup}
              onClick={() => handleSubGroupSelect(subGroup)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                selectedSubGroups.includes(subGroup)
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-200"
              }`}
              aria-selected={selectedSubGroups.includes(subGroup)}
              role="tab"
            >
              {subGroup}
            </motion.button>
          ))}
        </nav>
      </div>
      <div className="flex items-center space-x-4 p-1">
        <span className="w-24 min-w-24">{t("selectTeams")}</span>
        <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-full">
          {teams.map((team) => (
            <motion.button
              key={team}
              onClick={() => handleTeamSelect(team)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                selectedTeams.includes(team)
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-200"
              }`}
              aria-selected={selectedTeams.includes(team)}
              role="tab"
            >
              {team}
            </motion.button>
          ))}
        </nav>
      </div>
    </div>
  );
}
