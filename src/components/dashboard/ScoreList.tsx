"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { getDisplayTitle } from "@/utils/getDisplayTitle";
// import Link from "next/link";
import { PartyPopper } from "lucide-react";

interface FrequentScore {
  creationId: string;
  title: string;
  titleEn: string | null;
  titleJa: string | null;
  genre: string | null;
  usageCount: number;
}

interface ScoreListProps {
  title: string; // 섹션 제목 (예: "최근 한 달 인기 악보")
  scores: FrequentScore[]; // 악보 목록
}

const ScoreList: React.FC<ScoreListProps> = ({ title, scores }) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  // 장르 번역 매핑
  const genreMap: Record<string, string> = {
    BRIGHT: t("genre.bright"),
    CALM: t("genre.calm"),
    DARK: t("genre.dark"),
    DRAMATIC: t("genre.dramatic"),
    FUNKY: t("genre.funky"),
    HAPPY: t("genre.happy"),
    INSPIRATIONAL: t("genre.inspirational"),
    ROMANTIC: t("genre.romantic"),
    SAD: t("genre.sad"),
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <PartyPopper className="w-5 h-5 text-gray-700" />
        <h3 className="text-base font-medium text-gray-700">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.length > 0 ? (
          scores.map((score, index) => (
            // TODO: 아래의 코드는 악보 공유 기능이 활성화되면 사용
            // <Link key={score.creationId} href={`scores/${score.creationId}`}>
            <motion.div
              key={score.creationId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <span className="block max-w-[100px] sm:max-w-[200px] font-medium text-gray-800 truncate">
                {getDisplayTitle(
                  score.title,
                  score.titleEn,
                  score.titleJa,
                  locale
                )}
              </span>

              <p className="text-xs text-gray-600 mt-1">
                {t("genreTitle")}:{" "}
                {score.genre ? genreMap[score.genre] : t("none")}
              </p>
            </motion.div>
            // </Link>
          ))
        ) : (
          <p className="text-gray-500 text-sm">{t("noData")}</p>
        )}
      </div>
    </section>
  );
};

export default ScoreList;
