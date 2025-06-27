// src/components/MobileFilterDropdowns.tsx
"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface MobileFilterDropdownsProps {
  groups: string[];
  subGroups: string[];
  teams: string[];
  selectedGroups: string[];
  selectedSubGroups: string[];
  selectedTeams: string[];
  setSelectedGroups: Dispatch<SetStateAction<string[]>>;
  setSelectedSubGroups: Dispatch<SetStateAction<string[]>>;
  setSelectedTeams: Dispatch<SetStateAction<string[]>>;
  isGroupMenuOpen: boolean;
  isSubGroupMenuOpen: boolean;
  isTeamMenuOpen: boolean;
  setIsGroupMenuOpen: Dispatch<SetStateAction<boolean>>;
  setIsSubGroupMenuOpen: Dispatch<SetStateAction<boolean>>;
  setIsTeamMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export default function MobileFilterDropdowns({
  groups,
  subGroups,
  teams,
  selectedGroups,
  selectedSubGroups,
  selectedTeams,
  setSelectedGroups,
  setSelectedSubGroups,
  setSelectedTeams,
  isGroupMenuOpen,
  isSubGroupMenuOpen,
  isTeamMenuOpen,
  setIsGroupMenuOpen,
  setIsSubGroupMenuOpen,
  setIsTeamMenuOpen,
}: MobileFilterDropdownsProps) {
  const t = useTranslations();

  const handleGroupSelect = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
    setIsGroupMenuOpen(false);
  };

  const handleSubGroupSelect = (subGroup: string) => {
    setSelectedSubGroups((prev) =>
      prev.includes(subGroup)
        ? prev.filter((sg) => sg !== subGroup)
        : [...prev, subGroup]
    );
    setIsSubGroupMenuOpen(false);
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
    setIsTeamMenuOpen(false);
  };

  return (
    <div className="flex space-x-2 mb-6 md:hidden">
      {/* 그룹 선택 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          aria-expanded={isGroupMenuOpen}
          aria-haspopup="true"
        >
          <span className="truncate max-w-[120px]">
            {selectedGroups.length > 0
              ? selectedGroups.join(", ")
              : t("selectGroups")}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{
              transform: isGroupMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        <AnimatePresence>
          {isGroupMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
            >
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => handleGroupSelect(group)}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 ${
                    selectedGroups.includes(group) ? "bg-blue-100" : ""
                  }`}
                  role="menuitem"
                >
                  {group}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 서브그룹 선택 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setIsSubGroupMenuOpen(!isSubGroupMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          aria-expanded={isSubGroupMenuOpen}
          aria-haspopup="true"
        >
          <span className="truncate max-w-[120px]">
            {selectedSubGroups.length > 0
              ? selectedSubGroups.join(", ")
              : t("selectSubGroups")}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{
              transform: isSubGroupMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        <AnimatePresence>
          {isSubGroupMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
            >
              {subGroups.map((subGroup) => (
                <button
                  key={subGroup}
                  onClick={() => handleSubGroupSelect(subGroup)}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 ${
                    selectedSubGroups.includes(subGroup) ? "bg-purple-100" : ""
                  }`}
                  role="menuitem"
                >
                  {subGroup}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 팀 선택 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          aria-expanded={isTeamMenuOpen}
          aria-haspopup="true"
        >
          <span className="truncate max-w-[120px]">
            {selectedTeams.length > 0
              ? selectedTeams.join(", ")
              : t("selectTeams")}
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{
              transform: isTeamMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        <AnimatePresence>
          {isTeamMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 overflow-hidden"
            >
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => handleTeamSelect(team)}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 ${
                    selectedTeams.includes(team) ? "bg-green-100" : ""
                  }`}
                  role="menuitem"
                >
                  {team}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
