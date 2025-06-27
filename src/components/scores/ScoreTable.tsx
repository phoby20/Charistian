"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle, Plus, Play, Pause } from "lucide-react";
import { useTranslations } from "next-intl";
import { Score, SelectedSong } from "@/types/score";
import YouTube, { YouTubePlayer } from "react-youtube";
import { useState, useEffect, useRef } from "react";

interface ScoreTableProps {
  scores: Score[];
  onAddSong: (score: SelectedSong) => void;
  locale: string;
  getGenreLabel: (genreValue: string) => string;
}

const THUMBNAIL_SIZE = 40; // Thumbnail size in pixels

// YouTube URL에서 videoId 추출
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// 첫 번째 YouTube URL의 videoId 가져오기
const getFirstYouTubeVideoId = (urls?: string[]): string | null => {
  if (!urls || urls.length === 0) return null;
  for (const url of urls) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) return videoId; // 첫 번째 유효한 YouTube URL 반환
  }
  return null;
};

// 시간 포맷팅 (초 -> MM:SS)
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
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // 재생/정지 핸들러
  const handlePlayPause = async (scoreId: string) => {
    if (currentPlayingId === scoreId) {
      // 현재 재생 중인 항목 정지
      if (playerRef.current) {
        await playerRef.current.pauseVideo();
        setCurrentPlayingId(null);
      }
    } else {
      // 다른 항목 정지 후 새 항목 재생
      if (playerRef.current && currentPlayingId) {
        await playerRef.current.pauseVideo();
      }
      setCurrentPlayingId(scoreId);
    }
  };

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
      // 재생 중
      setDuration(event.target.getDuration());
    } else if (event.data === 2 || event.data === 0) {
      // 정지 또는 종료
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
        setCurrentTime(playerRef.current.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentPlayingId]);

  return (
    <div className="overflow-x-auto relative">
      {/* YouTube 플레이어 (숨김) */}
      {currentPlayingId && (
        <div className="hidden">
          <YouTube
            videoId={
              getFirstYouTubeVideoId(
                scores.find((s) => s.id === currentPlayingId)?.referenceUrls
              )!
            }
            opts={{
              playerVars: { autoplay: 0, controls: 0, showinfo: 0 },
            }}
            onReady={onPlayerReady}
            onStateChange={onStateChange}
            onError={(e) => console.error("YouTube 플레이어 오류:", e)}
          />
        </div>
      )}

      {/* 테이블 */}
      <table className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 w-18">
              {/* {t("thumbnail")} */}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("titleHeader")} / {t("creator")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("genre")} / {t("tempo")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("key")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("likes")} / {t("comments")}
            </th>
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-20">
              {t("youtube")}
            </th>
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-20">
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
                <td className="py-3 px-4">
                  {score.thumbnailUrl ? (
                    <img
                      src={score.thumbnailUrl}
                      alt={score.title}
                      className={`w-[${THUMBNAIL_SIZE}px] h-[${THUMBNAIL_SIZE}px] object-cover rounded`}
                    />
                  ) : (
                    <div
                      className={`w-[${THUMBNAIL_SIZE}px] h-[${THUMBNAIL_SIZE}px] bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 rounded`}
                    >
                      {t("none")}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/${locale}/scores/${score.id}`}
                    className="text-blue-600 hover:underline truncate"
                  >
                    {locale === "ko" ? (
                      <>
                        <span className="block max-w-xs">{score.title}</span>
                        <span className="text-gray-600 text-sm">
                          {score.titleJa}{" "}
                          {score.titleJa && score.titleEn && "/"}{" "}
                          {score.titleEn}
                        </span>
                      </>
                    ) : locale === "ja" ? (
                      <>
                        <span className="block max-w-xs">{score.titleJa}</span>
                        <span className="text-gray-600 text-sm">
                          {score.title} {score.title && score.titleEn && "/"}{" "}
                          {score.titleEn}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block max-w-xs">{score.titleEn}</span>
                        <span className="text-gray-600 text-sm">
                          {score.title} {score.title && score.titleJa && "/"}{" "}
                          {score.titleJa}
                        </span>
                      </>
                    )}
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[100px]">
                  <div className="flex flex-col gap-1">
                    <span>
                      {score.genre ? getGenreLabel(score.genre) : t("none")}
                    </span>
                    <span>{score.tempo ? `${score.tempo}` : t("none")}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[80px]">
                  {score.key || t("none")}
                </td>
                <td className="py-3 px-4 text-center text-gray-600 text-sm">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{score._count.likes}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{score._count.comments}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {youtubeVideoId && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePlayPause(score.id)}
                      className="text-red-500 hover:text-red-600 cursor-pointer p-4"
                      aria-label={
                        currentPlayingId === score.id ? t("pause") : t("play")
                      }
                    >
                      {currentPlayingId === score.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </motion.button>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      onAddSong({
                        id: score.id,
                        title: score.title,
                        titleEn: score.titleEn,
                        titleJa: score.titleJa,
                        key: score.key ?? "",
                        referenceUrls: score.referenceUrls ?? [],
                        fileUrl: score.fileUrl,
                      })
                    }
                    className="text-blue-500 hover:text-blue-600 cursor-pointer p-4"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* 레인지바 */}
      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex items-center gap-4 z-50">
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
        </div>
      )}
    </div>
  );
}
