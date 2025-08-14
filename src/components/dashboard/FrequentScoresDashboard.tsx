"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import Button from "../Button";
import ScoreList from "./ScoreList";

interface FrequentScore {
  creationId: string;
  title: string;
  titleEn: string | null;
  titleJa: string | null;
  genre: string | null;
  usageCount: number;
}

interface FrequentScoresResponse {
  monthly: FrequentScore[];
  weekly: FrequentScore[];
}

const FrequentScoresDashboard: React.FC = () => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [data, setData] = useState<FrequentScoresResponse>({
    monthly: [],
    weekly: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/frequent-scores"); // 올바른 API 경로
        if (!response.ok) {
          throw new Error(t("fetchError"));
        }
        const result: FrequentScoresResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(t("fetchError"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200"
    >
      {/* 제목과 링크 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {t("popularScores")}
          </h2>
          <span className="text-sm text-gray-500">
            전국의 모든 교회의 통계입니다
          </span>
        </div>
        <Link href={`/${locale}/scores`}>
          <Button variant="outline" aria-label={t("viewAllScores")}>
            {t("viewAllScores")}
          </Button>
        </Link>
      </div>

      {/* 최근 한 달 인기 악보 */}
      <ScoreList title={t("monthlyPopularScores")} scores={data.monthly} />

      {/* 최근 일주일 인기 악보 */}
      <ScoreList title={t("weeklyPopularScores")} scores={data.weekly} />
    </motion.div>
  );
};

export default FrequentScoresDashboard;
