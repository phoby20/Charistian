// src/app/[locale]/setlists/[id]/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  FileMusic,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import Loading from "@/components/Loading";
import { format } from "date-fns";
import { ko, ja } from "date-fns/locale";
import { SetlistResponse } from "@/types/score";
import Chip from "@/components/Chip";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import YouTube, { YouTubePlayer } from "react-youtube";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import CommentSection from "@/components/setList/CommentSection";
import { TeamList } from "@/components/setList/TeamList";
import { MemberList } from "@/components/setList/MemberList";
import Button from "@/components/Button";

interface Member {
  id: string;
  name: string;
  profileImage: string | null;
  teams: { id: string; name: string }[];
}

export default function SetlistDetailPage() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const { id } = useParams();
  const { user } = useAuth();
  const [setlist, setSetlist] = useState<SetlistResponse | null>(null);
  const [appUrl, setAppUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [pendingPlay, setPendingPlay] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
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

  const dateLocale = locale === "ko" ? ko : ja;

  // PDF 링크 클릭 핸들러
  const handleViewPdf = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlayPause = useCallback(
    debounce(async (scoreId: string) => {
      if (!playerRef.current || !isPlayerReady) {
        console.warn("Player is not ready yet, adding to pending play");
        setPendingPlay(scoreId);
        return;
      }

      try {
        if (currentPlayingId === scoreId) {
          await playerRef.current.pauseVideo();
          setCurrentPlayingId(null);
          setPendingPlay(null);
          setIsMuted(false);
        } else {
          if (currentPlayingId) {
            await playerRef.current.pauseVideo();
          }
          setCurrentPlayingId(scoreId);
          const score = setlist?.scores.find((s) => s.id === scoreId);
          const videoId = score?.selectedReferenceUrl
            ? getYouTubeVideoId(score.selectedReferenceUrl)
            : getFirstYouTubeVideoId(score?.creation.referenceUrls);
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
            throw new Error(t("noValidYouTubeUrl"));
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
    [currentPlayingId, setlist, isPlayerReady, t, isIOS]
  );

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    setDuration(event.target.getDuration());
    setIsMuted(isIOS());
    if (pendingPlay) {
      handlePlayPause(pendingPlay);
    } else if (currentPlayingId) {
      const score = setlist?.scores.find((s) => s.id === currentPlayingId);
      const videoId = score?.selectedReferenceUrl
        ? getYouTubeVideoId(score.selectedReferenceUrl)
        : getFirstYouTubeVideoId(score?.creation.referenceUrls);
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

  useEffect(() => {
    const fetchSetlistAndMembers = async () => {
      try {
        if (typeof id !== "string") {
          throw new Error(t("invalidId"));
        }
        const setlistResponse = await fetch(`/api/setlists/${id}`);
        if (!setlistResponse.ok) {
          throw new Error(
            (await setlistResponse.json()).error || t("fetchError")
          );
        }
        const setlistData: { setlist: SetlistResponse; appUrl: string } =
          await setlistResponse.json();
        setSetlist(setlistData.setlist);
        setAppUrl(setlistData.appUrl);

        const teamIds = setlistData.setlist.shares
          .filter((share) => share.team)
          .map((share) => share.team!.id);
        if (teamIds.length > 0) {
          const memberResponse = await fetch("/api/members", {
            headers: { "Content-Type": "application/json" },
          });
          if (!memberResponse.ok) {
            throw new Error(t("fetchMembersError"));
          }
          const memberData = await memberResponse.json();
          if (!Array.isArray(memberData.members)) {
            throw new Error(t("fetchMembersError"));
          }
          const filteredMembers = memberData.members.filter((member: Member) =>
            member.teams.some((team) => teamIds.includes(team.id))
          );
          setMembers(filteredMembers);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : t("fetchError");
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };
    fetchSetlistAndMembers();
  }, [id, t]);

  const canEdit: boolean =
    user != null &&
    (user.id === setlist?.creatorId ||
      ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role));

  const proxyFileUrl: string = setlist?.id
    ? `${appUrl}/api/proxy/setlist/${setlist.id}/file`
    : "#";

  const currentVideoId: string | undefined = currentPlayingId
    ? getYouTubeVideoId(
        setlist?.scores.find((s) => s.id === currentPlayingId)
          ?.selectedReferenceUrl ||
          getFirstYouTubeVideoId(
            setlist?.scores.find((s) => s.id === currentPlayingId)?.creation
              .referenceUrls
          )
      )
    : undefined;

  // scoreKeys에서 selectedKey에 해당하는 fileUrl 조회
  const getScoreFileUrl = (
    score: SetlistResponse["scores"][number]
  ): string => {
    if (score.selectedKey) {
      const selectedKeyObj = score.creation.scoreKeys.find(
        (key) => key.key === score.selectedKey
      );
      return (
        selectedKeyObj?.fileUrl || score.creation.scoreKeys[0].fileUrl || "#"
      );
    }
    return score.creation.scoreKeys[0].fileUrl || "#";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-6 max-w-md w-full"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-lg font-semibold">{error}</p>
          </div>
          <Link href={`/${locale}/setlists`}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
              aria-label={t("backToList")}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t("backToList")}</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="relative min-h-screen bg-gray-100 py-12 px-4">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          <div className="relative w-[1px] h-[1px] overflow-hidden">
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
          </div>
          <div className="flex flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center space-x-4">
              <Link href={`/${locale}/setlists`}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer flex items-center space-x-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-xl shadow-sm hover:bg-gray-300 transition-colors"
                  aria-label={t("backToList")}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("backToList")}</span>
                </motion.button>
              </Link>
            </div>
            {canEdit && (
              <Link href={`/${locale}/setlists/${id}/edit`}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer flex items-center space-x-2 bg-[#fc089e] text-white py-2 px-4 rounded-xl shadow-sm hover:bg-[#ff59bf] transition-colors"
                  aria-label={t("edit")}
                >
                  <Edit className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("edit")}</span>
                </motion.button>
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {setlist.title}
          </h1>
          <p className="text-gray-600 mb-8 text-sm">
            {t("date")}:{" "}
            {format(new Date(setlist.date), "yyyy-MM-dd", {
              locale: dateLocale,
            })}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("description")}
            </h2>
            <p className="text-gray-600 bg-gray-100 p-4 rounded-xl">
              {setlist.description || t("noDescription")}
            </p>
          </motion.div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("songs")}
          </h2>
          <ul className="space-y-3 mb-8">
            {setlist.scores
              .sort((a, b) => a.order - b.order)
              .map((score, index) => {
                const youtubeVideoId = score.selectedReferenceUrl
                  ? getYouTubeVideoId(score.selectedReferenceUrl)
                  : getFirstYouTubeVideoId(score.creation.referenceUrls);
                const scoreFileUrl = getScoreFileUrl(score);
                return (
                  <motion.li
                    key={score.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`flex items-center justify-between bg-gray-100 rounded-xl p-4 shadow-sm ${
                      currentPlayingId === score.id ? "bg-blue-100" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700 font-medium">
                        {index + 1}.
                      </span>
                      {youtubeVideoId && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePlayPause(score.id)}
                          className="text-[#fc089e] hover:text-[#ff59bf] cursor-pointer p-2"
                          aria-label={
                            currentPlayingId === score.id
                              ? t("pause")
                              : t("play")
                          }
                        >
                          {currentPlayingId === score.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </motion.button>
                      )}
                      <div className="flex sm:flex-row flex-col gap-2">
                        <Chip
                          label={score.selectedKey || t("noKey")}
                          color="yellow"
                        />
                        <span className="text-gray-800">
                          {getDisplayTitle(
                            score.creation.title,
                            score.creation.titleEn,
                            score.creation.titleJa,
                            locale
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <a
                        href={scoreFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#fc089e] hover:text-[#ff59bf] transition-colors"
                        aria-label={`View ${score.creation.title}`}
                        onClick={() => handleViewPdf(scoreFileUrl)}
                      >
                        <FileMusic className="w-5 h-5" />
                      </a>
                    </div>
                  </motion.li>
                );
              })}
          </ul>
          {currentPlayingId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 bg-white shadow-lg p-4 flex items-center gap-4 rounded-xl mb-8"
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <div className="space-y-6">
              <TeamList
                teams={setlist.shares
                  .filter((share) => share.team)
                  .map((share) => share.team!)}
                emptyMessage={t("noShares")}
              />
              <MemberList members={members} emptyMessage={t("noMembers")} />
            </div>
          </motion.div>
          {setlist.fileUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <Button
                variant="primary"
                onClick={() => handleViewPdf(proxyFileUrl)}
                aria-label={t("viewPdf")}
              >
                <FileMusic className="w-5 h-5" />
                <span className="text-sm font-medium">{t("viewPdf")}</span>
              </Button>
            </motion.div>
          )}
          <CommentSection
            setlist={setlist}
            user={user}
            locale={locale}
            id={id}
            setSetlist={setSetlist}
          />
        </motion.div>
      </div>
    </div>
  );
}
