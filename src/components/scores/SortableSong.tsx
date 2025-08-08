// src/components/scores/SortableSong.tsx
"use client";
import { Trash2, Play, Pause, ChevronDown, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import { useLocale, useTranslations } from "next-intl";
import { SelectedSong } from "@/types/score";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import Chip from "../Chip";

interface YouTubeVideo {
  url: string;
  title: string;
  videoId: string;
}

export interface SortableSongProps {
  song: SelectedSong;
  index: number;
  count: number;
  onRemoveSong: (index: number) => void;
  onPlayPause: (songId: string) => void;
  onKeySelect: (index: number, key: string) => void;
  isOver: boolean;
  isDraggingAny: boolean;
  currentPlayingId: string | null;
  youtubeUrls: string[];
  titles: YouTubeVideo[];
  selectedUrls: { [key: string]: string };
  handleUrlSelect: (songId: string, url: string) => void;
}

// YouTube URL에서 videoId 추출
const getYouTubeVideoId = (url?: string): string | undefined => {
  if (!url) return undefined;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : undefined;
};

// 첫 번째 YouTube URL의 videoId 가져오기
const getFirstYouTubeVideoId = (urls?: string[]): string | null => {
  if (!urls || urls.length === 0) return null;
  for (const url of urls) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) return videoId;
  }
  return null;
};

export function SortableSong({
  song,
  index,
  count,
  onRemoveSong,
  onPlayPause,
  onKeySelect,
  isOver,
  isDraggingAny,
  currentPlayingId,
  youtubeUrls,
  titles,
  selectedUrls,
  handleUrlSelect,
}: SortableSongProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${song.id}-${index}` });

  const locale = useLocale();
  const t = useTranslations("Setlist");
  const selectRef = useRef<HTMLSelectElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>(
    song.scoreKeys[0]?.key || "" // scoreKeys 사용
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition || "all 0.2s ease",
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging
      ? "0 8px 24px rgba(0, 0, 0, 0.15)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    marginBottom: isOver && isDraggingAny && !isDragging ? "16px" : "16px",
    zIndex: isDragging ? 10 : 1,
    touchAction: "none",
    backgroundColor: currentPlayingId === song.id ? "#e6f0ff" : "#ffffff",
  };

  const firstYoutubeVideoId = getFirstYouTubeVideoId(song.referenceUrls);
  const displayTitle = getDisplayTitle(
    song.title,
    song.titleEn,
    song.titleJa,
    locale
  );
  const youtubeVideoId = getYouTubeVideoId(selectedUrls[song.id]);

  // 드롭다운 토글 함수
  const handleDropdownToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setIsDropdownOpen((prev) => !prev);
      if (!isDropdownOpen && selectRef.current) {
        selectRef.current.focus();
      }
    }
  };

  // 키 선택 핸들러
  const handleKeySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = e.target.value;
    setSelectedKey(newKey);
    onKeySelect(index, newKey);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 w-full flex flex-col touch-manipulation relative border border-gray-200"
    >
      <span className="text-xs w-5 h-5 border rounded-full text-center text-white bg-[#ff66c4] absolute">
        {index + 1}
      </span>
      <div className="flex sm:flex-row flex-col items-center gap-5 sm:gap-1">
        <motion.button
          type="button"
          className="cursor-pointer"
          whileHover={{ scale: isDragging ? 1 : 1.1 }}
          whileTap={{ scale: isDragging ? 1 : 0.9 }}
          onClick={handleDropdownToggle}
          onTouchStart={handleDropdownToggle}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </motion.button>
        <div className="w-full">
          {/* 상단: 곡 정보 및 버튼 */}
          <div className="flex justify-between p-3 sm:flex-row flex-col">
            <div className="flex items-center gap-3 grow">
              <div className="flex flex-row gap-2 items-center">
                {song.scoreKeys.length > 1 ? ( // scoreKeys 사용
                  <div className="relative">
                    <select
                      value={selectedKey}
                      onChange={handleKeySelect}
                      className="rounded-lg border-gray-200 bg-gray-50 text-gray-800 text-sm py-1.5 px-3 pr-8 appearance-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all hover:bg-gray-100"
                      disabled={isDragging}
                    >
                      <option value="" disabled>
                        {t("selectKey") || "Select Key"}
                      </option>
                      {song.scoreKeys.map((k) => (
                        <option key={k.key} value={k.key}>
                          {k.key}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                ) : (
                  <Chip
                    label={
                      selectedKey ||
                      song.scoreKeys[0]?.key ||
                      t("noKey") ||
                      "No Key"
                    } // scoreKeys 사용
                    color="yellow"
                  />
                )}
                <span className="text-sm font-medium text-gray-800 truncate max-w-[180px] sm:max-w-[300px]">
                  {displayTitle} {count > 1 ? `(${count})` : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0 justify-end">
              <motion.button
                type="button"
                whileHover={{ scale: isDragging ? 1 : 1.1 }}
                whileTap={{ scale: isDragging ? 1 : 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSong(index);
                }}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors h-8"
                aria-label={t("remove")}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
              {youtubeVideoId || firstYoutubeVideoId ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: isDragging ? 1 : 1.1 }}
                  whileTap={{ scale: isDragging ? 1 : 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause(song.id);
                  }}
                  className={`p-2 rounded-full ${
                    currentPlayingId === song.id
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } transition-colors`}
                  aria-label={
                    currentPlayingId === song.id ? t("pause") : t("play")
                  }
                  disabled={isDragging}
                >
                  {currentPlayingId === song.id ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </motion.button>
              ) : (
                <span
                  className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
                  aria-label={t("noSelectedUrl")}
                >
                  <Play className="w-5 h-5" />
                </span>
              )}
            </div>
          </div>

          {/* 하단: YouTube 드롭다운 */}
          {youtubeUrls.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-end gap-2 mt-2"
            >
              <div className="relative flex-1 max-w-[250px]">
                <div className="flex items-center">
                  <span className="text-sm w-36 text-gray-500">
                    {t("selecteReference")}:
                  </span>
                  <select
                    ref={selectRef}
                    value={selectedUrls[song.id] || ""}
                    onChange={(e) => {
                      handleUrlSelect(song.id, e.target.value);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-800 text-sm py-2 pl-3 pr-8 appearance-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all hover:bg-gray-100 truncate"
                    disabled={isDragging}
                  >
                    {titles.map((video, idx) => (
                      <option key={idx} value={video.url} className="truncate">
                        {video.title.length > 30
                          ? `${video.title.substring(0, 27)}...`
                          : video.title}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
