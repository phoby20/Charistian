"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface Score {
  id: string;
  title: string;
  description?: string;
  tempo?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  price?: number;
  lyrics?: string;
  composer?: string;
  lyricist?: string;
  isPublic: boolean;
  isForSale: boolean;
  isOriginal: boolean;
}

interface ApiErrorResponse {
  error: string;
}

export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id, locale } = params;
  const [score, setScore] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchScore = async () => {
      try {
        const response = await fetch(`/api/scores/${id}`);
        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error || "악보를 불러오지 못했습니다.");
        }
        const data = await response.json();
        setScore(data);
      } catch (error: unknown) {
        let errorMessage = "악보를 불러오지 못했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        console.error(error);
      }
    };

    fetchScore();
  }, [id]);

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
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

  // 로딩 상태
  if (!score) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-10"
        >
          {/* 헤더와 뒤로 가기 버튼 */}
          <div className="flex items-center justify-between mb-8">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-gray-900"
            >
              {score.title}
            </motion.h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/${locale}/scores`)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">목록으로 돌아가기</span>
            </motion.button>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* 섬네일 섹션 */}
            {score.thumbnailUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex justify-center"
              >
                <img
                  src={score.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full max-w-xs rounded-lg shadow-md object-cover"
                />
              </motion.div>
            )}

            {/* 악보 정보 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-800">악보 정보</h2>
              <div className="space-y-4 text-gray-600">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">설명</span>
                  <p className="text-sm">{score.description || "없음"}</p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">템포</span>
                  <p className="text-sm">{score.tempo || "없음"} BPM</p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">가사</span>
                  <p className="text-sm whitespace-pre-wrap">
                    {score.lyrics || "없음"}
                  </p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">작곡가</span>
                  <p className="text-sm">{score.composer || "없음"}</p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">작사자</span>
                  <p className="text-sm">{score.lyricist || "없음"}</p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">판매 여부</span>
                  <p className="text-sm">
                    {score.isForSale
                      ? `₩${score.price?.toLocaleString()}`
                      : "무료"}
                  </p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">공개 여부</span>
                  <p className="text-sm">
                    {score.isPublic ? "공개" : "비공개"}
                  </p>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">자작곡 여부</span>
                  <p className="text-sm">
                    {score.isOriginal ? "자작곡" : "비자작곡"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
