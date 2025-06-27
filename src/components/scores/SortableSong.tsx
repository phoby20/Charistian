"use client";
import { Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import { useLocale } from "next-intl";
import { SelectedSong } from "@/types/score";

export interface SortableSongProps {
  song: SelectedSong;
  index: number;
  count: number;
  onRemoveSong: (index: number) => void;
  isOver: boolean;
  isDraggingAny: boolean;
}

export function SortableSong({
  song,
  index,
  count,
  onRemoveSong,
  isOver,
  isDraggingAny,
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), // dnd-kit의 transform 유지
    transition: isDragging
      ? "none"
      : transition || "transform 0.2s ease, opacity 0.2s ease", // 드래그 중 transition 비활성화
    opacity: isDragging ? 0.9 : 1, // 드래그 시 희미하게
    transformOrigin: "center",
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "none", // 드래그 시 그림자
    marginTop: isOver && isDraggingAny && !isDragging ? "20px" : "0", // 드래그 오버 시 삽입 공간
    marginBottom: isOver && isDraggingAny && !isDragging ? "20px" : "8px", // 기본 간격 + 드래그 오버 시 공간
    zIndex: isDragging ? 10 : 1, // 드래그 중인 항목 위로
    cursor: isDragging ? "grabbing" : "grab", // 커서 피드백
    touchAction: "none", // 모바일 스크롤 방지
  };

  // locale에 따라 표시할 제목 선택
  const displayTitle = getDisplayTitle(
    song.title,
    song.titleEn,
    song.titleJa,
    locale
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center bg-gray-50 rounded-lg transition-all duration-200 ${
        isDragging ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <div
        className="flex items-center space-x-3 grow p-5"
        {...attributes}
        {...listeners}
      >
        <span>{index + 1}</span>
        <span className="text-sm text-gray-700 truncate">
          {displayTitle} {count > 1 ? `(${count})` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // 드래그 이벤트와 충돌 방지
          onRemoveSong(index);
        }}
        className="text-red-500 hover:text-red-600"
        style={{ pointerEvents: "auto" }} // 항상 클릭 가능
      >
        <Trash2 className="w-5 h-5 cursor-pointer m-3" />
      </button>
    </div>
  );
}
