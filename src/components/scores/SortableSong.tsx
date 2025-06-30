"use client";
import { Trash2, Play, Pause, ChevronDown } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import { useLocale, useTranslations } from "next-intl";
import { SelectedSong } from "@/types/score";
import { motion } from "framer-motion";
import { useRef } from "react";
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

export function SortableSong({
  song,
  index,
  count,
  onRemoveSong,
  onPlayPause,
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition || "all 0.2s ease",
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging
      ? "0 8px 24px rgba(0, 0, 0, 0.15)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    marginBottom: isOver && isDraggingAny && !isDragging ? "16px" : "8px",
    zIndex: isDragging ? 10 : 1,
    touchAction: "none",
    backgroundColor: currentPlayingId === song.id ? "#e6f0ff" : "#ffffff",
  };

  // locale에 따라 표시할 제목 선택
  const displayTitle = getDisplayTitle(
    song.title,
    song.titleEn,
    song.titleJa,
    locale
  );

  // YouTube 비디오 ID는 selectedUrls[song.id]에서 가져옴
  const youtubeVideoId = getYouTubeVideoId(selectedUrls[song.id]);

  // 드롭다운 활성화 함수
  const handleDropdownClick = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    if (selectRef.current && !isDragging) {
      selectRef.current.focus();
      // 모바일에서 드롭다운을 강제로 열기 위해 change 이벤트 트리거
      const event = new Event("change", { bubbles: true });
      selectRef.current.dispatchEvent(event);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 w-full flex flex-col touch-manipulation relative"
    >
      <span className="text-gray-600 text-xs w-5 h-5 border rounded-full text-center font-black absolute">
        {index + 1}
      </span>
      <div className="flex sm:flex-row flex-col items-center gap-5 sm:gap-1">
        <motion.button
          type="button"
          whileHover={{ scale: isDragging ? 1 : 1.1 }}
          whileTap={{ scale: isDragging ? 1 : 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSong(index);
          }}
          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors mr-4 h-8"
          aria-label={t("remove")}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
        <div className="w-full">
          {/* 상단: 곡 정보 및 삭제 버튼 */}
          <div className="flex items-center justify-between border border-gray-200 p-5 cursor-grab rounded-full">
            <div
              className="flex items-center gap-3 grow"
              {...attributes}
              {...listeners}
            >
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Chip label={song.key} color="yellow" />
                <span className="text-sm font-medium text-gray-800 truncate max-w-[180px] sm:max-w-[300px]">
                  {displayTitle} {count > 1 ? `(${count})` : ""}
                </span>
              </div>
            </div>
            {youtubeVideoId ? (
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

          {/* 하단: YouTube 드롭다운 */}
          <div className="flex items-center justify-end gap-2 mt-6">
            {youtubeUrls.length > 1 ? (
              <div
                className="relative flex-1 max-w-[250px] cursor-pointer"
                onClick={handleDropdownClick}
                onTouchStart={handleDropdownClick} // 모바일 터치 이벤트 추가
                style={{ pointerEvents: isDragging ? "none" : "auto" }} // 드래그 중 클릭 방지
              >
                <div className="flex items-center">
                  <span className="text-sm w-36 text-gray-500">
                    {t("selecteReference")}:
                  </span>
                  <select
                    ref={selectRef}
                    value={selectedUrls[song.id] || ""}
                    onChange={(e) => {
                      handleUrlSelect(song.id, e.target.value);
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
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
