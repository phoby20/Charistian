// src/components/scores/ScoreInfo.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileMusic } from "lucide-react";
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
  const [activeLyricsTab, setActiveLyricsTab] = useState<"ko" | "en" | "ja">(
    "ko"
  );
  const [selectedKey, setSelectedKey] = useState<string>("");

  const lyricsContent = {
    ko: score.lyrics || t("none"),
    en: score.lyricsEn || t("none"),
    ja: score.lyricsJa || t("none"),
  };

  // View PDF 버튼 클릭 시 새 창 열기
  const handleViewPdf = () => {
    if (selectedKey) {
      window.open(
        `${appUrl}/api/proxy/creation/${score.id}/file?key=${encodeURIComponent(selectedKey)}`,
        "_blank"
      );
    }
  };

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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("description")}
            </h2>
            <p
              className="mt-3 text-gray-700 rounded-lg border border-gray-200 p-3"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {score.description}
            </p>
          </div>
        )}

        {/* Lyrics */}
        {(score.lyrics || score.lyricsEn || score.lyricsJa) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("lyrics")}
            </h2>
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
            <p
              className="mt-3 text-gray-700 rounded-lg border border-gray-200 p-3"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {lyricsContent[activeLyricsTab]}
            </p>
          </div>
        )}

        {/* Other Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Composer */}
          {score.composer && (
            <div className="flex items-center rounded-lg border border-gray-200 p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("composer")}
              </span>
              <p className="flex-1 text-gray-700">{score.composer}</p>
            </div>
          )}

          {/* Lyricist */}
          {score.lyricist && (
            <div className="flex items-center rounded-lg border border-gray-200 p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("lyricist")}
              </span>
              <p className="flex-1 text-gray-700">{score.lyricist}</p>
            </div>
          )}

          {/* Is Original */}
          <div className="flex items-center rounded-lg border border-gray-200 p-3">
            <span className="w-28 font-medium text-gray-900">
              {t("isOriginal")}
            </span>
            <p className="flex-1 text-gray-700">
              {score.isOriginal ? t("isOriginalTrue") : t("isOriginalFalse")}
            </p>
          </div>

          {/* Price */}
          {score.price && (
            <div className="flex items-center rounded-lg border border-gray-200 p-3">
              <span className="w-28 font-medium text-gray-900">
                {t("price")}
              </span>
              <p className="flex-1 text-gray-700">
                ₩{score.price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Is Open */}
          <div className="flex items-center rounded-lg border border-gray-200 p-3">
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
          className="flex flex-col gap-4 sm:flex-row mt-20"
        >
          {user?.churchId === score.churchId && score.scoreKeys.length > 0 && (
            <div className="flex-1">
              {score.scoreKeys.length === 1 ? (
                <a
                  href={`${appUrl}/api/proxy/creation/${score.id}/file?key=${encodeURIComponent(score.scoreKeys[0].key)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    aria-label={`${t("viewPdf")} (${score.scoreKeys[0].key})`}
                  >
                    <FileMusic className="h-5 w-5" />
                    <span>
                      {t("viewPdf")} ({score.scoreKeys[0].key})
                    </span>
                  </Button>
                </a>
              ) : (
                <div className="space-y-3">
                  <label
                    htmlFor="key-select"
                    className="text-sm font-medium text-gray-900"
                  >
                    {t("selectKey")}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <select
                      id="key-select"
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">{t("selectKey")}</option>
                      {score.scoreKeys.map((sk) => (
                        <option key={sk.key} value={sk.key}>
                          {sk.key}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleViewPdf}
                      isDisabled={!selectedKey}
                      aria-label={`${t("viewPdf")} ${selectedKey ? `(${selectedKey})` : ""}`}
                    >
                      <FileMusic className="h-5 w-5" />
                      <span>{t("viewPdf")}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
