// src/components/scores/SelectedSongsList.tsx
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
import { debounce } from "lodash";

interface SelectedSongsListProps {
  selectedSongs: SelectedSong[];
  onRemoveSong: (index: number) => void;
  onReorderSongs: (newSongs: SelectedSong[]) => void;
  t: ReturnType<typeof useTranslations<"Setlist">>;
  onUrlSelect: (songId: string, url: string) => void;
  selectedUrls: { [key: string]: string };
}

interface YouTubeVideo {
  url: string;
  title: string;
  videoId: string;
}

const getYouTubeVideoId = (url?: string): string | undefined => {
  if (!url) return undefined;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : undefined;
};

const getYouTubeUrls = (urls?: string[]): string[] => {
  if (!urls || urls.length === 0) return [];
  return urls.filter(
    (url) => url.includes("youtube.com") || url.includes("youtu.be")
  );
};

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
  onUrlSelect,
  selectedUrls,
}: SelectedSongsListProps) {
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitles, setVideoTitles] = useState<{
    [songId: string]: YouTubeVideo[];
  }>({});
  const playerRef = useRef<YouTubePlayer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  // YouTube 비디오 타이틀 가져오기
  useEffect(() => {
    const fetchTitles = async () => {
      const titles: { [songId: string]: YouTubeVideo[] } = {};
      const cachedTitles = sessionStorage.getItem("videoTitles");
      if (cachedTitles) {
        try {
          Object.assign(titles, JSON.parse(cachedTitles));
        } catch (err) {
          console.error("Error parsing cached video titles:", err);
        }
      }

      for (const song of selectedSongs) {
        if (!titles[song.id]) {
          const youtubeUrls = getYouTubeUrls(song.referenceUrls);
          if (youtubeUrls.length > 0) {
            try {
              const response = await fetch("/api/youtube-titles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls: youtubeUrls }),
              });
              if (!response.ok) {
                throw new Error("Failed to fetch YouTube titles");
              }
              const { videos } = await response.json();
              titles[song.id] = videos;
            } catch (error) {
              console.error(
                `Failed to fetch titles for song ${song.id}:`,
                error
              );
              titles[song.id] = youtubeUrls.map((url, idx) => ({
                url,
                title: `YouTube URL ${idx + 1}`,
                videoId: getYouTubeVideoId(url) || "",
              }));
            }
          }
        }
      }
      setVideoTitles(titles);
      sessionStorage.setItem("videoTitles", JSON.stringify(titles));
    };
    fetchTitles();
  }, [selectedSongs]);

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

  const handlePlayPause = useCallback(
    debounce(async (songId: string, videoId?: string) => {
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
        const selectedUrl = videoId
          ? videoId
          : getYouTubeVideoId(selectedUrls[songId]) ||
            getYouTubeVideoId(
              getYouTubeUrls(
                selectedSongs.find((s) => s.id === songId)?.referenceUrls
              )[0]
            );
        if (selectedUrl && playerRef.current) {
          try {
            await playerRef.current.loadVideoById(selectedUrl);
          } catch (err) {
            console.error("Error loading new video:", err);
          }
        }
      }
    }, 300),
    [currentPlayingId, selectedSongs, selectedUrls]
  );

  const handleUrlSelect = (songId: string, url: string) => {
    onUrlSelect(songId, url);
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      handlePlayPause(songId, videoId); // 선택 시 즉시 재생
    }
  };

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    if (currentPlayingId) {
      event.target.playVideo();
    }
  };

  const onStateChange = (event: { target: YouTubePlayer; data: number }) => {
    if (event.data === 1) {
      setDuration(event.target.getDuration());
    } else if (event.data === 2 || event.data === 0) {
      setCurrentPlayingId(null);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    if (currentPlayingId && playerRef.current) {
      const interval = setInterval(() => {
        setCurrentTime(playerRef.current!.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentPlayingId]);

  useEffect(() => {
    return () => {
      playerRef.current = null;
    };
  }, []);

  const currentVideoId = currentPlayingId
    ? getYouTubeVideoId(
        selectedUrls[currentPlayingId] ||
          getYouTubeUrls(
            selectedSongs.find((s) => s.id === currentPlayingId)?.referenceUrls
          )[0]
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
          {currentPlayingId && currentVideoId && (
            <div className="hidden">
              <YouTube
                key={currentVideoId}
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
                  const youtubeUrls = getYouTubeUrls(song.referenceUrls);
                  const titles = videoTitles[song.id] || [];
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      className={`flex items-center justify-between bg-gray-50 rounded-xl p-4 shadow-sm ${
                        overIndex === index ? "bg-blue-100" : ""
                      }`}
                    >
                      <SortableSong
                        song={song}
                        index={index}
                        count={count}
                        onRemoveSong={onRemoveSong}
                        onPlayPause={handlePlayPause}
                        isOver={overIndex === index}
                        isDraggingAny={isDraggingAny}
                        currentPlayingId={currentPlayingId}
                        youtubeUrls={youtubeUrls}
                        titles={titles}
                        selectedUrls={selectedUrls}
                        handleUrlSelect={handleUrlSelect}
                      />
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
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
