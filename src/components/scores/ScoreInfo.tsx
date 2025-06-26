// src/components/scores/ScoreInfo.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ImageOff, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScoreResponse } from "@/types/score";
import { User } from "@prisma/client";
import Button from "@/components/Button"; // Button 컴포넌트 임포트

interface ScoreInfoProps {
  user: User | null;
  score: ScoreResponse;
  imageError: string[];
  setImageError: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ScoreInfo({
  user,
  score,
  imageError,
  setImageError,
}: ScoreInfoProps) {
  const t = useTranslations("ScoreDetail");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [activeLyricsTab, setActiveLyricsTab] = useState<"ko" | "en" | "ja">(
    "ko"
  );

  const toggleDescription = () => setIsDescriptionOpen(!isDescriptionOpen);
  const toggleLyrics = () => setIsLyricsOpen(!isLyricsOpen);

  const lyricsContent = {
    ko: score.lyrics || t("none"),
    en: score.lyricsEn || t("none"),
    ja: score.lyricsJa || t("none"),
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Thumbnail Section */}
      {score.thumbnailUrl && !imageError.includes("main") ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative group"
        >
          <img
            src={score.thumbnailUrl}
            alt={score.title}
            className="w-full h-64 object-cover rounded-t-2xl border-b border-gray-200 shadow-md transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError((prev) => [...prev, "main"])}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"></div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-t-2xl border-b border-gray-200"
        >
          <div className="text-center text-gray-500">
            <ImageOff className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">{t("noThumbnail")}</p>
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="p-8 space-y-6"
      >
        <h2 className="text-3xl font-bold text-gray-800">{t("info")}</h2>
        <div className="space-y-4 text-gray-600">
          {/* Description */}
          {score.description && (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {t("description")}
              </span>
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm mt-4 whitespace-pre-wrap"
                style={{
                  maxHeight: isDescriptionOpen ? "none" : "4rem",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {score.description}
              </motion.p>
              {score.description.length > 100 && (
                <motion.button
                  onClick={toggleDescription}
                  className="mt-2 text-blue-600 text-sm font-medium flex items-center space-x-1 cursor-pointer w-fit"
                  aria-expanded={isDescriptionOpen}
                >
                  <span>
                    {isDescriptionOpen ? t("showLess") : t("showMore")}
                  </span>
                  {isDescriptionOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </div>
          )}

          {/* Lyrics */}
          {(score.lyrics || score.lyricsEn || score.lyricsJa) && (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{t("lyrics")}</span>
              <div className="flex space-x-4 mt-2">
                <button
                  onClick={() => setActiveLyricsTab("ko")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeLyricsTab === "ko"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setActiveLyricsTab("en")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeLyricsTab === "en"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setActiveLyricsTab("ja")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeLyricsTab === "ja"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  日本語
                </button>
              </div>
              <motion.p
                key={activeLyricsTab} // 탭 전환 시 애니메이션 재생
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm mt-4 whitespace-pre-wrap"
                style={{
                  maxHeight: isLyricsOpen ? "none" : "4rem",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {lyricsContent[activeLyricsTab]}
              </motion.p>
              {lyricsContent[activeLyricsTab].length > 100 && (
                <motion.button
                  onClick={toggleLyrics}
                  className="mt-2 text-blue-600 text-sm font-medium"
                  aria-expanded={isLyricsOpen}
                >
                  <div className="flex items-center cursor-pointer w-fit">
                    <span>{isLyricsOpen ? t("showLess") : t("showMore")}</span>
                    {isLyricsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </motion.button>
              )}
            </div>
          )}

          {/* Composer */}
          {score.composer && (
            <div className="flex items-start gap-4">
              <span className="font-medium text-gray-900 w-28">
                {t("composer")}
              </span>
              <p className="text-sm flex-1">{score.composer}</p>
            </div>
          )}

          {/* Lyricist */}
          {score.lyricist && (
            <div className="flex items-start gap-4">
              <span className="font-medium text-gray-900 w-28">
                {t("lyricist")}
              </span>
              <p className="text-sm flex-1">{score.lyricist}</p>
            </div>
          )}

          {/* Is Original */}
          <div className="flex items-start gap-4">
            <span className="font-medium text-gray-900 w-28">
              {t("isOriginal")}
            </span>
            <p className="text-sm flex-1">
              {score.isOriginal ? t("isOriginalTrue") : t("isOriginalFalse")}
            </p>
          </div>

          {/* Price */}
          {score.price && (
            <div className="flex items-start gap-4">
              <span className="font-medium text-gray-900 w-28">
                {t("price")}
              </span>
              <p className="text-sm flex-1">₩{score.price.toLocaleString()}</p>
            </div>
          )}

          {/* Is Open */}
          <div className="flex items-start gap-4">
            <span className="font-medium text-gray-900 w-28">
              {t("isOpen")}
            </span>
            <p className="text-sm flex-1">
              {score.isOpen ? t("open") : t("closed")}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-6"
        >
          {user?.churchId === score.churchId && score.fileUrl && (
            <a href={score.fileUrl} download className="flex-1">
              <Button variant="outline" aria-label={t("download")}>
                <Download className="w-5 h-5" />
                <span>{t("download")}</span>
              </Button>
            </a>
          )}
          {score.isForSale && score.price && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all duration-300"
              aria-label={t("purchase")}
            >
              {t("purchase")} (₩{score.price.toLocaleString()})
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
