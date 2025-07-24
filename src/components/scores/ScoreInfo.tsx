// src/components/scores/ScoreInfo.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileMusic } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScoreResponse } from "@/types/score";
import { User } from "@prisma/client";
import Button from "@/components/Button";

interface ScoreInfoProps {
  user: User | null;
  score: ScoreResponse;
  appUrl: string;
}

export default function ScoreInfo({ user, score, appUrl }: ScoreInfoProps) {
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

  // 프록시 URL 생성
  const proxyFileUrl =
    score.id && score.fileUrl
      ? `${appUrl}/api/proxy/creation/${score.id}/file`
      : "#";

  return (
    <div className="mx-auto">
      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 bg-white"
      >
        {/* Description */}
        {score.description && (
          <div className="rounded-lg border border-gray-200 p-4">
            <button
              onClick={toggleDescription}
              className="flex w-full items-center justify-between text-lg font-semibold text-gray-900"
              aria-expanded={isDescriptionOpen}
            >
              <span>{t("description")}</span>
              {score.description.length > 100 && (
                <motion.span
                  animate={{ rotate: isDescriptionOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDescriptionOpen ? (
                    <ChevronUp className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  )}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: isDescriptionOpen ? "auto" : "4rem",
                  opacity: 1,
                }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 overflow-hidden text-gray-700"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {score.description}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Lyrics */}
        {(score.lyrics || score.lyricsEn || score.lyricsJa) && (
          <div className="rounded-lg border border-gray-200  p-4">
            <button
              onClick={toggleLyrics}
              className="cursor-pointer flex w-full items-center justify-between text-lg font-semibold text-gray-900"
              aria-expanded={isLyricsOpen}
            >
              <span>{t("lyrics")}</span>
              {lyricsContent[activeLyricsTab].length > 100 && (
                <motion.span
                  animate={{ rotate: isLyricsOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isLyricsOpen ? (
                    <ChevronUp className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  )}
                </motion.span>
              )}
            </button>
            <div className="mt-3 flex space-x-2 rounded-md bg-gray-100 p-1">
              {["ko", "en", "ja"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLyricsTab(lang as "ko" | "en" | "ja")}
                  className={`cursor-pointer flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    activeLyricsTab === lang
                      ? "bg-[#fc089e] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {lang === "ko"
                    ? "한국어"
                    : lang === "en"
                      ? "English"
                      : "日本語"}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeLyricsTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: isLyricsOpen ? "auto" : "4rem",
                }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-3 overflow-hidden text-gray-700"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {lyricsContent[activeLyricsTab]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Other Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Composer */}
          {score.composer && (
            <div className="flex items-center rounded-lg border border-gray-200  p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("composer")}
              </span>
              <p className="flex-1 text-gray-700">{score.composer}</p>
            </div>
          )}

          {/* Lyricist */}
          {score.lyricist && (
            <div className="flex items-center rounded-lg border border-gray-200  p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("lyricist")}
              </span>
              <p className="flex-1 text-gray-700">{score.lyricist}</p>
            </div>
          )}

          {/* Is Original */}
          <div className="flex items-center rounded-lg border border-gray-200  p-3">
            <span className="w-28 font-medium text-gray-900">
              {t("isOriginal")}
            </span>
            <p className="flex-1 text-gray-700">
              {score.isOriginal ? t("isOriginalTrue") : t("isOriginalFalse")}
            </p>
          </div>

          {/* Price */}
          {score.price && (
            <div className="flex items-center rounded-lg border border-gray-200  p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("price")}
              </span>
              <p className="flex-1 text-gray-700">
                ₩{score.price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Is Open */}
          <div className="flex items-center rounded-lg border border-gray-200  p-3">
            <span className="w-28 font-medium text-gray-900">
              {t("isOpen")}
            </span>
            <p className="flex-1 text-gray-700">
              {score.isOpen ? t("open") : t("closed")}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          {user?.churchId === score.churchId && score.fileUrl && (
            <a
              href={proxyFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                className="shadow-lg cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff66c4] to-[#ffde59] hover:from-[#ffde59] hover:to-[#ff66c4] py-3"
                aria-label={t("viewPdf")}
              >
                <FileMusic className="h-5 w-5" />
                <span>{t("viewPdf")}</span>
              </Button>
            </a>
          )}
          {score.isForSale && score.price && (
            <Button
              className="cursor-pointer w-full flex-1 rounded-lg bg-green-600 py-3 text-white hover:bg-green-700"
              aria-label={t("purchase")}
            >
              {t("purchase")} (₩{score.price.toLocaleString()})
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
