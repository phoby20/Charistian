// src/components/scores/ScoreInfo.tsx

"use client";

import { motion } from "framer-motion";
import { Download, ImageOff } from "lucide-react"; // lucide-react 아이콘 사용
import { useTranslations } from "next-intl";
import { ScoreResponse } from "@/types/score";
import { GENRES } from "@/data/genre"; // genre 데이터 경로 확인
import { User } from "@prisma/client";

interface ScoreInfoProps {
  user: User | null;
  score: ScoreResponse;
  imageError: string[];
  setImageError: React.Dispatch<React.SetStateAction<string[]>>;
  locale: string;
}

export default function ScoreInfo({
  user,
  score,
  imageError,
  setImageError,
  locale,
}: ScoreInfoProps) {
  const t = useTranslations("ScoreDetail");

  const getGenreLabel = (genreValue: string | undefined) => {
    if (!genreValue) return t("noGenre");
    const genre = GENRES.find((g) => g.value === genreValue);
    return locale === "ja" ? genre?.ja : genre?.ko;
  };

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {score.thumbnailUrl && !imageError.includes("main") ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative group"
        >
          <img
            src={score.thumbnailUrl}
            alt={score.title}
            className="w-full max-w-sm rounded-2xl border border-gray-200 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setImageError((prev) => [...prev, "main"])}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center w-full max-w-sm h-48 bg-gray-100 rounded-2xl border border-gray-200"
        >
          <div className="text-center text-gray-500">
            <ImageOff className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{t("noThumbnail")}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800">{t("info")}</h2>
        <div className="grid gap-4 text-gray-600">
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("description")}
            </span>
            <p className="text-sm flex-1">{score.description || t("none")}</p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">{t("tempo")}</span>
            <p className="text-sm flex-1">
              {score.tempo ? `${score.tempo} BPM` : t("none")}
            </p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">{t("key")}</span>
            <p className="text-sm flex-1">{score.key || t("none")}</p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("lyrics")}
            </span>
            <p className="text-sm flex-1 whitespace-pre-wrap">
              {score.lyrics || t("none")}
            </p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("composer")}
            </span>
            <p className="text-sm flex-1">{score.composer || t("none")}</p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("lyricist")}
            </span>
            <p className="text-sm flex-1">{score.lyricist || t("none")}</p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">{t("genre")}</span>
            <p className="text-sm flex-1">
              {getGenreLabel(score.genre) || t("none")}
            </p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("isPublic")}
            </span>
            <p className="text-sm flex-1">
              {score.isPublic ? t("isPublicTrue") : t("isPublicFalse")}
            </p>
          </div>
          <div className="flex items-start">
            <span className="font-medium text-gray-900 w-24">
              {t("isOriginal")}
            </span>
            <p className="text-sm flex-1">
              {score.isOriginal ? t("isOriginalTrue") : t("isOriginalFalse")}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            {/* 해당 악보의 교회ID가 로그인 유저의 ID와 일치할 때만 다운로드 버튼이 보이도록 수정 */}
            {user?.churchId === score.churchId && (
              <a href={score.fileUrl} download className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center justify-center space-x-2"
                  aria-label={t("download")}
                >
                  <Download className="w-5 h-5" />
                  <span>{t("download")}</span>
                </motion.button>
              </a>
            )}

            {score.isForSale && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 px-6 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition-all duration-300"
                aria-label={t("purchase")}
              >
                {t("purchase")} (₩{score.price?.toLocaleString()})
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
