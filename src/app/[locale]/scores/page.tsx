// app/scores/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Upload, Heart, MessageCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { ApiErrorResponse } from "@/types/score";

interface Score {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  creator: { name: string };
  _count: { likes: number; comments: number };
  likes: { id: string }[];
}

export default function ScoreList() {
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch("/api/scores");
        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(
            errorData.error || "악보 목록을 불러오지 못했습니다."
          );
        }
        const data = await response.json();
        setScores(data);
        setError(null);
      } catch (error: unknown) {
        let errorMessage = "악보 목록을 불러오지 못했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        console.error(error);
      }
    };
    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            악보 목록
          </h1>
          <Link href={`/${locale}/scores/upload`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              <Upload className="w-5 h-5" />
              <span>악보 업로드</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 악보 목록 */}
        {scores.length === 0 && !error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 py-12"
          >
            <p className="text-lg">아직 등록된 악보가 없습니다.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scores.map((score, index) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* 섬네일 */}
                {score.thumbnailUrl ? (
                  <img
                    src={score.thumbnailUrl}
                    alt={score.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">섬네일 없음</p>
                  </div>
                )}

                {/* 카드 내용 */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                    {score.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {score.description || "설명 없음"}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>By {score.creator.name}</span>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-red-500" />
                        {score._count.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1 text-blue-500" />
                        {score._count.comments}
                      </div>
                    </div>
                  </div>
                  <Link href={`/${locale}/scores/${score.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      상세보기
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
