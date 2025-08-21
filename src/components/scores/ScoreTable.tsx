"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Play, Pause } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScoreResponse } from "@/types/score";
import YouTube, { YouTubePlayer } from "react-youtube";
import { useState, useEffect, useRef } from "react";
import { getDisplayTitle, getSecondaryTitles } from "@/utils/getDisplayTitle";
import Chip from "../Chip";

interface ScoreTableProps {
  scores: ScoreResponse[];
  onAddSong: (score: ScoreResponse) => void; // 타입 변경
  locale: string;
  getGenreLabel: (genreValue: string) => string;
}

const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getFirstYouTubeVideoId = (urls?: string[]): string | null => {
  if (!urls || urls.length === 0) return null;
  for (const url of urls) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) return videoId;
  }
  return null;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export default function ScoreTable({
  scores,
  onAddSong,
  locale,
  getGenreLabel,
}: ScoreTableProps) {
  const t = useTranslations("Score");
  const [currentPlayingId, setCurrentPlayingId] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRefs = useRef<Record<string, YouTubePlayer>>({});

  const handlePlayPause = async (scoreId: string) => {
    const player = playerRefs.current[scoreId];
    if (!player) return;

    if (currentPlayingId === scoreId) {
      await player.pauseVideo();
      setCurrentPlayingId("");
    } else {
      if (currentPlayingId && playerRefs.current[currentPlayingId]) {
        await playerRefs.current[currentPlayingId].pauseVideo();
      }
      await player.playVideo();
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    const player = playerRefs.current[currentPlayingId ?? ""];
    if (player) {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    if (currentPlayingId && playerRefs.current[currentPlayingId]) {
      const interval = setInterval(() => {
        const time = playerRefs.current[currentPlayingId].getCurrentTime();
        setCurrentTime(time);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentPlayingId]);

  return (
    <div className="overflow-x-auto relative mb-4">
      {/* YouTube Players */}
      {scores.map((score) => {
        const youtubeVideoId = getFirstYouTubeVideoId(score.referenceUrls);
        if (!youtubeVideoId) return null;

        return (
          <div key={score.id} className="hidden">
            <YouTube
              videoId={youtubeVideoId}
              opts={{
                playerVars: { autoplay: 0, controls: 0, showinfo: 0 },
              }}
              onReady={(e) => {
                playerRefs.current[score.id] = e.target;
              }}
              onStateChange={(e) => {
                const state = e.data;
                const player = e.target;

                if (state === 1) {
                  const duration = player.getDuration();
                  setDuration(duration);
                  setCurrentPlayingId(score.id);
                } else if (state === 2 || state === 0) {
                  setCurrentPlayingId("");
                }
              }}
              onError={(e) =>
                console.error(`YouTube error for ${score.id}:`, e)
              }
            />
          </div>
        );
      })}

      <table className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-sm font-semibold text-gray-700 w-12"></th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-sm font-semibold text-gray-700 min-w-[100px] sm:min-w-[150px]">
              {t("titleHeader")}
            </th>
            <th className="flex flex-col py-2 sm:py-3 px-2 sm:px-4 text-left text-sm font-semibold text-gray-700 min-w-[70px] sm:min-w-[90px]">
              <span>{t("genre")} / </span>
              <span>{t("tempo")}</span>
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-sm font-semibold text-gray-700 min-w-[50px] sm:min-w-[70px]">
              {t("timeSignature")}
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-sm font-semibold text-gray-700 min-w-[50px] sm:min-w-[70px]">
              {t("key")}
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-sm font-semibold text-gray-700 w-12">
              {t("action")}
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => {
            const youtubeVideoId = getFirstYouTubeVideoId(score.referenceUrls);
            return (
              <motion.tr
                key={score.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                  {youtubeVideoId && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayPause(score.id)}
                      className="cursor-pointer text-red-500 hover:text-red-600 p-2"
                    >
                      {currentPlayingId === score.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </motion.button>
                  )}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    {score.isGlobal ? (
                      <Chip label="free" color="green" />
                    ) : null}
                    {score.isPublic ? (
                      <Chip label="public" color="purple" />
                    ) : null}
                    <Link
                      href={`/${locale}/scores/${score.id}`}
                      className="text-blue-600 hover:underline truncate block"
                    >
                      <span className="block max-w-[100px] sm:max-w-[200px] text-sm truncate">
                        {getDisplayTitle(
                          score.title,
                          score.titleEn,
                          score.titleJa,
                          locale
                        )}
                      </span>
                      <span className="flex flex-col text-gray-600 text-[10px] truncate">
                        {getSecondaryTitles(
                          score.title,
                          score.titleEn,
                          score.titleJa,
                          locale
                        ).map((title, index) => (
                          <span key={index}>{title}</span>
                        ))}
                      </span>
                    </Link>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 text-sm truncate">
                  <div className="flex flex-col gap-1">
                    <span>
                      {score.genre ? getGenreLabel(score.genre) : t("none")}
                    </span>
                    <span>{score.tempo ? `${score.tempo}` : t("none")}</span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 text-sm truncate">
                  <span>
                    {score.timeSignature ? `${score.timeSignature}` : t("none")}
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 text-sm truncate">
                  {score.scoreKeys.length > 0
                    ? score.scoreKeys.map((sk) => sk.key).join(", ")
                    : t("none")}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={
                      () => onAddSong(score) // ScoreResponse 객체 직접 전달
                    }
                    className="text-[#ff66c4] hover:text-[#ff59bf] cursor-pointer p-2 sm:p-3"
                  >
                    <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                  </motion.button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-3 flex items-center gap-3 z-50">
          <span className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
            aria-label={t("seek")}
          />
        </div>
      )}
    </div>
  );
}
