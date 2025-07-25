// src/components/setList/TeamList.tsx
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Team {
  id: string;
  name: string;
}

interface TeamListProps {
  teams: Team[];
  emptyMessage: string;
}

export const TeamList = ({ teams, emptyMessage }: TeamListProps) => {
  const t = useTranslations("Setlist");

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t("sharedTeams")}
      </h3>
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {team.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-800 truncate">
                {team.name}
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
