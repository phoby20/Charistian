// src/components/scores/SelectedSongsList.tsx
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
import { useState, useRef, useEffect, useCallback } from "react";
import { SortableSong } from "./SortableSong";
import { SelectedSong } from "@/types/score";
import YouTube, { YouTubePlayer } from "react-youtube";
import { motion } from "framer-motion";
import { debounce } from "lodash"; // lodash 디바운스 사용 (설치 필요: npm install lodash)

interface SelectedSongsListProps {
  selectedSongs: SelectedSong[];
  onRemoveSong: (index: number) => void;
  onReorderSongs: (newSongs: SelectedSong[]) => void;
  t: ReturnType<typeof useTranslations<"Setlist">>;
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

// 시간 포맷팅 (초 -> MM:SS)
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export default function SelectedSongsList({
  selectedSongs,
  onRemoveSong,
  onReorderSongs,
  t,
}: SelectedSongsListProps) {
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // 센서 설정: 마우스와 터치 이벤트 지원
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
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

  // 디바운싱된 재생/정지 핸들러
  const handlePlayPause = useCallback(
    debounce(async (songId: string) => {
      if (currentPlayingId === songId) {
        if (playerRef.current) {
          try {
            await playerRef.current.pauseVideo();
            setCurrentPlayingId(null);
          } catch (err) {
            console.error("Error pausing video:", err);
          }
        }
      } else {
        if (playerRef.current && currentPlayingId) {
          try {
            await playerRef.current.pauseVideo();
          } catch (err) {
            console.error("Error pausing current video:", err);
          }
        }
        setCurrentPlayingId(songId);
        const videoId = getFirstYouTubeVideoId(
          selectedSongs.find((s) => s.id === songId)?.referenceUrls
        );
        if (videoId && playerRef.current) {
          try {
            await playerRef.current.loadVideoById(videoId);
          } catch (err) {
            console.error("Error loading new video:", err);
          }
        }
      }
    }, 300), // 300ms 디바운스
    [currentPlayingId, selectedSongs]
  );

  // YouTube 플레이어 준비 완료
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    if (currentPlayingId) {
      event.target.playVideo();
    }
  };

  // YouTube 상태 변경 감지
  const onStateChange = (event: { target: YouTubePlayer; data: number }) => {
    if (event.data === 1) {
      setDuration(event.target.getDuration());
    } else if (event.data === 2 || event.data === 0) {
      setCurrentPlayingId(null);
    }
  };

  // 레인지바로 시간 이동
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  // 현재 시간 업데이트
  useEffect(() => {
    if (currentPlayingId && playerRef.current) {
      const interval = setInterval(() => {
        setCurrentTime(playerRef.current!.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentPlayingId]);

  // 컴포넌트 언마운트 시 playerRef 정리
  useEffect(() => {
    return () => {
      playerRef.current = null;
    };
  }, []);

  // 현재 재생 중인 비디오 ID
  const currentVideoId = currentPlayingId
    ? getFirstYouTubeVideoId(
        selectedSongs.find((s) => s.id === currentPlayingId)?.referenceUrls
      )
    : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t("selectedSongs")}
      </h2>
      {selectedSongs.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noSelectedSongs")}</p>
      ) : (
        <>
          {/* YouTube 플레이어 (숨김) */}
          {currentPlayingId && currentVideoId && (
            <div className="hidden">
              <YouTube
                key={currentVideoId} // videoId 변경 시 컴포넌트 리마운트
                videoId={currentVideoId}
                opts={{
                  width: 0,
                  height: 0,
                  playerVars: { autoplay: 0, controls: 0, showinfo: 0 },
                }}
                onReady={onPlayerReady}
                onStateChange={onStateChange}
                onError={(e) => console.error("YouTube 플레이어 오류:", e)}
              />
            </div>
          )}
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
                      onPlayPause={handlePlayPause}
                      isOver={overIndex === index}
                      isDraggingAny={isDraggingAny}
                      currentPlayingId={currentPlayingId}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
          {/* 레인지바 */}
          {currentPlayingId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 bg-white shadow-lg p-4 flex items-center gap-4 rounded-lg"
            >
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label={t("seek")}
                aria-valuenow={currentTime}
                aria-valuemin={0}
                aria-valuemax={duration}
              />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
