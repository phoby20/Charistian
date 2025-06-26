import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface DesktopFilterTabsProps {
  groups: string[];
  teams: string[];
  selectedGroups: string[];
  selectedTeams: string[];
  handleGroupSelect: (group: string) => void;
  handleTeamSelect: (team: string) => void;
}

export default function DesktopFilterTabs({
  groups,
  teams,
  selectedGroups,
  selectedTeams,
  handleGroupSelect,
  handleTeamSelect,
}: DesktopFilterTabsProps) {
  const t = useTranslations();

  return (
    <div className="hidden md:block space-y-4 bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-200">
      <p className="font-bold">{t("filter")}</p>
      <div className="flex items-center space-x-4 p-1">
        <span className="w-24 min-w-24">{t("selectGroups")}</span>
        <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-screen">
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
        <span className="w-24 min-w-24">{t("selectTeams")}</span>
        <nav className="flex space-x-1 bg-gray-100 p-1 pl-4 rounded-full border border-gray-200 items-center w-screen">
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
