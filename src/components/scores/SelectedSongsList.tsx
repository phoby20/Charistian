"use client";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SelectedSong {
  id: string;
  title: string;
  titleEn: string;
  titleJa: string;
}

interface SelectedSongsListProps {
  selectedSongs: SelectedSong[];
  onRemoveSong: (index: number) => void;
  t: ReturnType<typeof useTranslations<"Setlist">>;
}

export default function SelectedSongsList({
  selectedSongs,
  onRemoveSong,
  t,
}: SelectedSongsListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t("selectedSongs")}
      </h2>
      {selectedSongs.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noSelectedSongs")}</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {selectedSongs.map((song, index) => {
            const count = selectedSongs
              .slice(0, index + 1)
              .filter((s) => s.id === song.id).length;
            return (
              <motion.div
                key={`${song.id}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex justify-between items-center bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  <span>{index + 1}</span>
                  <span className="text-sm text-gray-700 truncate">
                    {song.title} {count > 1 ? `(${count})` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSong(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5 cursor-pointer m-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
