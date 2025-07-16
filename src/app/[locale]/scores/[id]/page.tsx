// src/app/[locale]/scores/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Edit2,
  Heart,
  ImageOff,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ApiErrorResponse, ScoreResponse } from "@/types/score";
import CommentsSection from "@/components/scores/CommentsSection";
import ScoreInfo from "@/components/scores/ScoreInfo";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
import Chip from "@/components/Chip";
import { GENRES } from "@/data/genre";

const getYouTubeVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
};

export default function ScoreDetailPage() {
  const t = useTranslations("ScoreDetail");
  const router = useRouter();
  const params = useParams();
  const { id, locale } = params;
  const { user } = useAuth();
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [appUrl, setAppUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const getGenreLabel = (genreValue: string | undefined) => {
    if (!genreValue) return t("noGenre");
    const genre = GENRES.find((g) => g.value === genreValue);
    return locale === "ja" ? genre?.ja : genre?.ko;
  };

  useEffect(() => {
    if (!id) return;

    const fetchScore = async () => {
      try {
        const response = await fetch(`/api/scores/${id}`);
        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error || t("error"));
        }
        const data = await response.json();
        setScore(data);
        setLikeCount(data._count?.likes || 0);
        setIsLiked(data.isLiked || false);
        setAppUrl(data.appUrl);
      } catch (error: unknown) {
        let errorMessage = t("error");
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        console.error(error);
      }
    };

    fetchScore();
  }, [id, t]);

  const handleLike = async () => {
    if (!score || isLiking) return;
    setIsLiking(true);

    try {
      const response = await fetch(`/api/scores/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("likeError"));
      }

      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (error: unknown) {
      let errorMessage = t("likeError");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLiking(false);
    }
  };

  const handleClose = async () => {
    if (!score || isClosing) return;
    if (!confirm(t("confirmDeleteScore"))) return;

    setIsClosing(true);

    try {
      const response = await fetch(`/api/scores/${id}`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("closeError"));
      }

      router.push(`/${locale}/scores`);
    } catch (error: unknown) {
      let errorMessage = t("closeError");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsClosing(false);
    }
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
            <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-xl font-semibold">{error}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores`)}
            className="cursor-pointer flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all"
            aria-label={t("backToList")}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t("backToList")}</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!score) {
    return <Loading />;
  }

  const canEdit =
    user &&
    score.isOpen &&
    (user.id === score.creatorId ||
      ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role));

  const canClose =
    user &&
    score.isOpen &&
    (user.id === score.creatorId ||
      ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role));

  return (
    <>
      <Head>
        <title>{score.title}</title>
        <meta
          name="description"
          content={score.description || t("descriptionMeta")}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12 px-4 font-sans">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/${locale}/scores`)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-8 font-semibold"
              aria-label={t("backToList")}
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-base">{t("backToList")}</span>
            </motion.button>
            <div className="flex flex-wrap mb-6">
              <Chip label={score.key ?? ""} color="red" />
              <Chip label={(score.tempo ?? "") + " BPM"} color="yellow" />
              <Chip label={getGenreLabel(score.genre) ?? ""} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-4xl font-extrabold text-gray-900"
              >
                {getDisplayTitle(
                  score.title,
                  score.titleEn ?? score.title,
                  score.titleJa ?? score.title,
                  locale as string
                )}
              </motion.h1>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-full shadow-md transition-all cursor-pointer ${
                    isLiked
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-white" : ""}`} />
                  <span className="text-base font-medium">
                    {t("like")} ({likeCount})
                  </span>
                </motion.button>
                {canEdit && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        (window.location.href = `/${locale}/scores/${id}/edit`)
                      }
                      className="flex items-center space-x-2 px-5 py-3 rounded-full shadow-md bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                      aria-label={t("editScore")}
                    >
                      <Edit2 className="w-6 h-6" />
                      <span className="text-base font-medium">
                        {t("editScore")}
                      </span>
                    </motion.button>
                  </>
                )}
                {canClose && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    disabled={isClosing}
                    className={`flex items-center space-x-2 px-5 py-3 rounded-full shadow-md bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white transition-all cursor-pointer ${
                      isClosing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label={t("deleteScore")}
                  >
                    <Trash2 className="w-6 h-6" />
                  </motion.button>
                )}
              </div>
            </div>
            <ScoreInfo
              user={user}
              score={score}
              imageError={imageError}
              appUrl={appUrl}
              setImageError={setImageError}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {t("referenceUrls")}
              </h2>
              <div className="text-gray-600">
                {score.referenceUrls && score.referenceUrls.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {score.referenceUrls.map((ref, index) => {
                      const videoId = getYouTubeVideoId(ref);
                      const thumbnailUrl = videoId
                        ? getYouTubeThumbnail(videoId)
                        : null;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="bg-gray-50 rounded-xl shadow-sm overflow-hidden"
                        >
                          {thumbnailUrl && !imageError.includes(ref) ? (
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={thumbnailUrl}
                                alt={`Thumbnail for ${ref}`}
                                className="w-full h-32 object-cover"
                                onError={() =>
                                  setImageError((prev) => [...prev, ref])
                                }
                              />
                            </a>
                          ) : imageError.includes(ref) ? (
                            <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                              <div className="text-center text-gray-500">
                                <ImageOff className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-xs">{t("noThumbnail")}</p>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-4"
                            >
                              <p className="text-sm text-blue-600 truncate">
                                {ref}
                              </p>
                            </a>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t("none")}</p>
                )}
              </div>
            </motion.div>
            <CommentsSection
              score={score}
              setScore={setScore}
              locale={locale as string}
              id={id as string}
              setError={setError}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
