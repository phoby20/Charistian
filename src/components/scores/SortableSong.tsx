// src/components/scores/SortableSong.tsx
"use client";
import { Trash2, Play, Pause } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import { useLocale, useTranslations } from "next-intl";
import { SelectedSong } from "@/types/score";
import { motion } from "framer-motion";
import Chip from "../Chip";

export interface SortableSongProps {
  song: SelectedSong;
  index: number;
  count: number;
  onRemoveSong: (index: number) => void;
  onPlayPause: (songId: string) => void;
  isOver: boolean;
  isDraggingAny: boolean;
  currentPlayingId: string | null;
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
const getFirstYouTubeVideoId = (urls?: string[]): string | undefined => {
  if (!urls || urls.length === 0) return undefined;
  for (const url of urls) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) return videoId;
  }
  return undefined;
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? "none"
      : transition || "transform 0.2s ease, opacity 0.2s ease",
    opacity: isDragging ? 0.9 : 1,
    transformOrigin: "center",
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "none",
    marginTop: isOver && isDraggingAny && !isDragging ? "20px" : "0",
    marginBottom: isOver && isDraggingAny && !isDragging ? "20px" : "8px",
    zIndex: isDragging ? 10 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  // locale에 따라 표시할 제목 선택
  const displayTitle = getDisplayTitle(
    song.title,
    song.titleEn,
    song.titleJa,
    locale
  );

  // YouTube 비디오 ID 확인
  const youtubeVideoId = getFirstYouTubeVideoId(song.referenceUrls);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center bg-gray-50 rounded-lg transition-all duration-200 ${
        isDragging
          ? "shadow-lg"
          : currentPlayingId === song.id
            ? "bg-blue-100 shadow-sm"
            : "shadow-sm"
      }`}
    >
      <div
        className="flex items-center space-x-3 grow p-5"
        {...attributes}
        {...listeners}
      >
        <span>{index + 1}</span>
        <div className="flex sm:flex-row flex-col items-center">
          <Chip label={song.key} />
          <span className="text-sm text-gray-700 truncate">
            {displayTitle} {count > 1 ? `(${count})` : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {youtubeVideoId && (
          <motion.button
            type="button"
            whileHover={{ scale: isDragging ? 1 : 1.1 }}
            whileTap={{ scale: isDragging ? 1 : 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause(song.id);
            }}
            className="text-red-500 hover:text-red-600 cursor-pointer p-2"
            aria-label={currentPlayingId === song.id ? t("pause") : t("play")}
            disabled={isDragging}
          >
            {currentPlayingId === song.id ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </motion.button>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: isDragging ? 1 : 1.1 }}
          whileTap={{ scale: isDragging ? 1 : 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSong(index);
          }}
          className="text-red-500 hover:text-red-600 cursor-pointer p-2"
          aria-label={t("remove")}
          style={{ pointerEvents: "auto" }}
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
