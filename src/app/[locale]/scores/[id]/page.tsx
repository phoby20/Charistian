// src/app/[locale]/scores/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Heart, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { ApiErrorResponse, ScoreResponse } from "@/types/score";
import CommentsSection from "@/components/scores/CommentsSection";
import ScoreInfo from "@/components/scores/ScoreInfo";

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
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-3 max-w-md w-full"
        >
          <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-lg font-medium">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

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
      <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-lg p-8 md:p-12"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
              <motion.h1
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-5xl font-extrabold text-gray-900"
              >
                {score.title}
              </motion.h1>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => router.push(`/${locale}/scores`)}
                  className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition-colors"
                  aria-label={t("backToList")}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("backToList")}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    isLiked
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-red-600" : ""}`}
                  />
                  <span className="text-sm font-medium">
                    {t("like")} ({likeCount})
                  </span>
                </motion.button>
              </div>
            </div>

            <ScoreInfo
              score={score}
              imageError={imageError}
              setImageError={setImageError}
              locale={locale as string}
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {t("referenceUrls")}
              </h2>
              <div className="text-gray-600">
                {score.referenceUrls && score.referenceUrls.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-4">
                    {score.referenceUrls.map((ref, index) => {
                      const videoId = getYouTubeVideoId(ref);
                      const thumbnailUrl = videoId
                        ? getYouTubeThumbnail(videoId)
                        : null;

                      return (
                        <li key={index} className="flex items-center gap-4">
                          {thumbnailUrl && !imageError.includes(ref) ? (
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={thumbnailUrl}
                                alt={`Thumbnail for ${ref}`}
                                className="w-48 h-32 rounded-md border border-gray-200 object-cover"
                                onError={() =>
                                  setImageError((prev) => [...prev, ref])
                                }
                              />
                            </a>
                          ) : imageError.includes(ref) ? (
                            <div className="w-48 h-32 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                              <div className="text-center text-gray-500">
                                <ImageOff className="w-6 h-6 mx-auto" />
                                <p className="text-xs">{t("noThumbnail")}</p>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {ref}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm">{t("none")}</p>
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
