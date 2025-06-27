// src/components/members/MobileFilterDropdowns.tsx
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFilterDropdownsProps {
  groups: string[];
  teams: string[];
  selectedGroups: string[];
  selectedTeams: string[];
  isGroupMenuOpen: boolean;
  isTeamMenuOpen: boolean;
  setIsGroupMenuOpen: (open: boolean) => void;
  setIsTeamMenuOpen: (open: boolean) => void;
  handleGroupSelect: (group: string) => void;
  handleTeamSelect: (team: string) => void;
}

export default function MobileFilterDropdowns({
  groups,
  teams,
  selectedGroups,
  selectedTeams,
  isGroupMenuOpen,
  isTeamMenuOpen,
  setIsGroupMenuOpen,
  setIsTeamMenuOpen,
  handleGroupSelect,
  handleTeamSelect,
}: MobileFilterDropdownsProps) {
  const t = useTranslations();

  return (
    <div className="flex space-x-2">
      {/* 모바일 그룹 선택 드롭다운 */}
      <div className="relative md:hidden">
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
      {/* 모바일 팀 선택 드롭다운 */}
      <div className="relative md:hidden">
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
