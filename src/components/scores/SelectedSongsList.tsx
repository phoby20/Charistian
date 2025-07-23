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
import { toast } from "react-toastify";
import { Volume2, VolumeX } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [pendingPlay, setPendingPlay] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoTitles, setVideoTitles] = useState<{
    [songId: string]: YouTubeVideo[];
  }>({});
  const playerRef = useRef<YouTubePlayer | null>(null);

  // iOS 디바이스 감지
  const isIOS = useCallback((): boolean => {
    const userAgent: string = navigator.userAgent || "";
    const vendor: string = navigator.vendor || "";
    return /iPad|iPhone|iPod/.test(userAgent) && vendor.includes("Apple");
  }, []);

  useEffect(() => {
    console.log("Is iOS device:", isIOS());
  }, [isIOS]);

  const getYouTubeVideoId = (url?: string): string | undefined => {
    if (!url) return undefined;
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  };

  const getFirstYouTubeVideoId = (urls?: string[]): string | undefined => {
    if (!urls || urls.length === 0) return undefined;
    for (const url of urls) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) return videoId;
    }
    return undefined;
  };

  const handlePlayPause = useCallback(
    debounce(async (scoreId: string) => {
      // 플레이어 준비 상태와 playerRef 확인
      if (!playerRef.current || !isPlayerReady) {
        console.warn("Player is not ready yet, adding to pending play");
        setPendingPlay(scoreId);
        return;
      }

      try {
        if (currentPlayingId === scoreId) {
          // 현재 재생 중인 비디오 일시정지
          await playerRef.current.pauseVideo();
          setCurrentPlayingId(null);
          setPendingPlay(null);
          setIsMuted(false);
        } else {
          // 새로운 비디오 재생
          if (currentPlayingId) {
            await playerRef.current.pauseVideo();
          }
          setCurrentPlayingId(scoreId);
          const score = selectedSongs.find((s) => s.id === scoreId);
          const videoId = score?.referenceUrls[0]
            ? getYouTubeVideoId(score?.referenceUrls[0])
            : getFirstYouTubeVideoId(score?.referenceUrls);
          if (videoId) {
            await playerRef.current.loadVideoById(videoId);
            await playerRef.current.playVideo();
            setIsMuted(isIOS());
            if (isIOS()) {
              try {
                await playerRef.current.unMute();
                setIsMuted(false);
              } catch (unmuteErr: unknown) {
                console.warn("Failed to unmute video on iOS:", unmuteErr);
                setIsMuted(true);
                toast.warn(t("unmuteWarning"), {
                  position: "top-right",
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              }
            }
          } else {
            throw new Error("No valid YouTube URL found");
          }
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : t("youtubeError");
        console.error("Error loading/playing video:", err);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setCurrentPlayingId(null);
        setPendingPlay(null);
        setIsMuted(false);
      }
    }, 300),
    [currentPlayingId, isPlayerReady, t, isIOS]
  );

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    setDuration(event.target.getDuration());
    setIsMuted(isIOS());
    if (pendingPlay) {
      handlePlayPause(pendingPlay);
    } else if (currentPlayingId) {
      const score = selectedSongs.find((s) => s.id === currentPlayingId);
      const videoId = score?.referenceUrls[0]
        ? getYouTubeVideoId(score?.referenceUrls[0])
        : getFirstYouTubeVideoId(score?.referenceUrls);
      if (videoId) {
        event.target.loadVideoById(videoId);
        event.target.playVideo();
      }
    }
  };

  const onStateChange = (event: { target: YouTubePlayer; data: number }) => {
    if (event.data === 1) {
      setDuration(event.target.getDuration());
      setIsMuted(event.target.isMuted());
    } else if (event.data === 2 || event.data === 0) {
      setCurrentPlayingId(null);
      setPendingPlay(null);
      setIsMuted(false);
    }
  };

  const onError = (event: { data: number }) => {
    console.error("YouTube player error code:", event.data);
    let errorMessage = t("youtubeError");
    if (event.data === 150 || event.data === 101) {
      errorMessage = t("youtubeRestricted");
    }
    setError(errorMessage);
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    setCurrentPlayingId(null);
    setPendingPlay(null);
    setIsMuted(false);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current || !isPlayerReady) {
      toast.warn(t("playerNotReady"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (err: unknown) {
      console.warn("Failed to toggle mute:", err);
    }
  };

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

  const handleUrlSelect = (songId: string, url: string) => {
    onUrlSelect(songId, url);
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      handlePlayPause(songId); // 선택 시 즉시 재생
    }
  };

  useEffect(() => {
    if (currentPlayingId && playerRef.current && isPlayerReady) {
      const interval = setInterval(() => {
        setCurrentTime(playerRef.current!.getCurrentTime());
        setIsMuted(playerRef.current!.isMuted());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentPlayingId, isPlayerReady]);

  useEffect(() => {
    return () => {
      playerRef.current = null;
      setIsPlayerReady(false);
      setPendingPlay(null);
      setIsMuted(false);
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
      <h2 className="font-semibold text-gray-800 mb-3">{t("selectedSongs")}</h2>
      {selectedSongs.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noSelectedSongs")}</p>
      ) : (
        <>
          <YouTube
            key={currentVideoId || "default"}
            videoId={currentVideoId}
            opts={{
              width: 1,
              height: 1,
              playerVars: {
                autoplay: 0,
                controls: 1,
                mute: isIOS() ? 1 : 0,
                playsinline: 1,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            onError={onError}
          />
          {error && <div>{error}</div>}
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
                    <div key={`${song.id}-${index}`}>
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
              className="mt-4 bg-white shadow-lg p-4 flex items-center gap-4 rounded-lg mb-8"
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
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleMute}
                className="text-gray-600 hover:text-gray-800 p-2"
                aria-label={isMuted ? t("unmute") : t("mute")}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" aria-label={t("mute")} />
                ) : (
                  <Volume2 className="w-5 h-5" aria-label={t("unmute")} />
                )}
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
