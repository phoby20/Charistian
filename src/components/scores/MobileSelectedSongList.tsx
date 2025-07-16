// src/components/scores/MobileSelectedSongList.tsx
"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import {
  isSetlistCreationDisabled,
  shouldShowUpgradeButton,
} from "@/utils/setlistUtils";
import { Plan } from "@prisma/client";

interface UsageLimits {
  plan: Plan;
  maxUsers: number;
  remainingUsers: number;
  weeklySetlists: number;
  remainingWeeklySetlists: number;
  monthlySetlists: number;
  remainingMonthlySetlists: number;
  maxScores: number;
  remainingScores: number;
}

interface MobileSelectedSongListProps {
  selectedSongList: {
    id: string;
    title: string;
    titleEn: string;
    titleJa: string;
  }[];
  handleRemoveSong: (id: string, index: number) => void;
  locale: string;
  isOpen: boolean;
  toggleOpen: () => void;
  usageLimits: UsageLimits | null;
}

const MobileSelectedSongList = ({
  selectedSongList,
  handleRemoveSong,
  locale,
  isOpen,
  toggleOpen,
  usageLimits,
}: MobileSelectedSongListProps) => {
  const t = useTranslations("Score");

  // createSetlist 버튼 비활성화 조건
  const isCreateDisabled: boolean = isSetlistCreationDisabled(
    selectedSongList,
    usageLimits
  );

  return (
    <div className="relative">
      {/* 모바일 토글 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-3 rounded-full shadow-lg flex items-center space-x-2"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <span className="text-sm">{t("selectedSongs")}</span>
        )}
      </motion.button>

      {/* 선곡 리스트 패널 (바텀 시트) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 right-0 w-full bg-white shadow-lg p-4 border border-gray-200 max-h-[60vh] overflow-y-auto z-40"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("selectedSongs")}
            </h2>
            {selectedSongList.length === 0 ? (
              <p className="text-sm text-gray-500">{t("noSelectedSongs")}</p>
            ) : (
              <ul className="space-y-2">
                {selectedSongList.map((song, index) => {
                  const count = selectedSongList
                    .slice(0, index + 1)
                    .filter((s) => s.id === song.id).length;
                  const displayTitle = getDisplayTitle(
                    song.title,
                    song.titleEn,
                    song.titleJa,
                    locale
                  );
                  return (
                    <motion.li
                      key={`${song.id}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{index + 1}</span>
                        <span className="text-sm text-gray-700 truncate">
                          {displayTitle} {count > 1 ? `(${count})` : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSong(song.id, index)}
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
            {shouldShowUpgradeButton(isCreateDisabled, usageLimits) ? (
              <span className="text-xs mt-4 text-red-600 whitespace-pre-wrap">
                {t("noMakeSetlist")}
              </span>
            ) : (
              ""
            )}
            <Link href={`/${locale}/setlists/create`}>
              <motion.button
                whileHover={{ scale: isCreateDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isCreateDisabled ? 1 : 0.95 }}
                className={`mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 text-sm ${isCreateDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                disabled={isCreateDisabled}
              >
                {t("createSetlist")}
              </motion.button>
            </Link>
            {shouldShowUpgradeButton(isCreateDisabled, usageLimits) && (
              <Link href={`/${locale}/plans`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer mt-2 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  {t("upgradePlan")}
                </motion.button>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSelectedSongList;
