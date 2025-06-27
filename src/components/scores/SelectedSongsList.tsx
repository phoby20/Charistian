"use client";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { SortableSong } from "./SortableSong";
import { SelectedSong } from "@/types/score";

interface SelectedSongsListProps {
  selectedSongs: SelectedSong[];
  onRemoveSong: (index: number) => void;
  onReorderSongs: (newSongs: SelectedSong[]) => void;
  t: ReturnType<typeof useTranslations<"Setlist">>;
}

export default function SelectedSongsList({
  selectedSongs,
  onRemoveSong,
  onReorderSongs,
  t,
}: SelectedSongsListProps) {
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  // 센서 설정: 마우스와 터치 이벤트 지원
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 터치 지연으로 스크롤 방지
        tolerance: 5,
      },
    })
  );

  const handleDragStart = () => {
    setIsDraggingAny(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverIndex(null);
    setIsDraggingAny(false);

    if (active.id !== over?.id) {
      const oldIndex = selectedSongs.findIndex(
        (song, idx) => `${song.id}-${idx}` === active.id
      );
      const newIndex = selectedSongs.findIndex(
        (song, idx) => `${song.id}-${idx}` === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSongs = [...selectedSongs];
        const [movedSong] = newSongs.splice(oldIndex, 1);
        newSongs.splice(newIndex, 0, movedSong);
        onReorderSongs(newSongs);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const index = selectedSongs.findIndex(
        (song, idx) => `${song.id}-${idx}` === over.id
      );
      setOverIndex(index);
    } else {
      setOverIndex(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t("selectedSongs")}
      </h2>
      {selectedSongs.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noSelectedSongs")}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SortableContext
            items={selectedSongs.map((song, index) => `${song.id}-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
              {selectedSongs.map((song, index) => {
                const count = selectedSongs
                  .slice(0, index + 1)
                  .filter((s) => s.id === song.id).length;
                return (
                  <SortableSong
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    count={count}
                    onRemoveSong={onRemoveSong}
                    isOver={overIndex === index}
                    isDraggingAny={isDraggingAny}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
