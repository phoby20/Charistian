// src/components/scores/DesktopSelectedSongList.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import {
  isSetlistCreationDisabled,
  shouldShowUpgradeButton,
} from "@/utils/setlistUtils";
import { UsageLimits } from "@/types/score";

interface DesktopSelectedSongListProps {
  selectedSongList: {
    id: string;
    title: string;
    titleEn: string;
    titleJa: string;
  }[];
  handleRemoveSong: (id: string, index: number) => void;
  locale: string;
  usageLimits: UsageLimits | null;
}

const DesktopSelectedSongList = ({
  selectedSongList,
  handleRemoveSong,
  locale,
  usageLimits,
}: DesktopSelectedSongListProps) => {
  const t = useTranslations("Score");

  // createSetlist 버튼 비활성화 조건
  const isCreateDisabled: boolean = isSetlistCreationDisabled(
    selectedSongList,
    usageLimits
  );

  return (
    <div className="relative overflow-visible">
      {/* 선곡 리스트 패널 (고정 패널) */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed w-auto max-w-xs top-20 min-w-60 bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-h-[80vh] overflow-y-auto z-40"
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
                  <div className="flex items-center space-x-3 p-2">
                    <span>{index + 1}</span>
                    <span className="text-sm text-gray-700 truncate">
                      {displayTitle} {count > 1 ? `(${count})` : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSong(song.id, index)}
                    className="text-red-500 hover:text-red-600 text-xs cursor-pointer p-4"
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
            className={`mt-4 w-full bg-[#fc089e] text-white py-2 rounded-lg hover:bg-[#ff66c4] transition-colors disabled:bg-gray-400 text-sm ${isCreateDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
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
    </div>
  );
};

export default DesktopSelectedSongList;
