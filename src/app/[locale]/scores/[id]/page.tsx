"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Share2,
  ImageOff,
} from "lucide-react";
import { ApiErrorResponse, ScoreResponse } from "@/types/score";

export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id, locale } = params;
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

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

  // 공유 기능 (브라우저의 Web Share API 사용)
  const handleShare = async () => {
    if (navigator.share && score) {
      try {
        await navigator.share({
          title: score.title,
          text: score.description || "이 악보를 확인해보세요!",
          url: window.location.href,
        });
      } catch (err) {
        console.error("공유 실패:", err);
      }
    } else {
      alert("공유 기능이 지원되지 않는 브라우저입니다.");
    }
  };

  // 에러 상태
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

  // 로딩 상태
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
        <title>{score.title} | 악보 상세</title>
        <meta
          name="description"
          content={score.description || "악보 상세 페이지"}
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
            {/* 헤더와 버튼 그룹 */}
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
                  aria-label="목록으로 돌아가기"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">목록</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="악보 공유"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">공유</span>
                </motion.button>
              </div>
            </div>

            <div className="grid gap-10 md:grid-cols-2">
              {/* 섬네일 섹션 */}
              {score.thumbnailUrl && !imageError ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative group"
                >
                  <img
                    src={score.thumbnailUrl}
                    alt={score.title}
                    className="w-full max-w-sm rounded-2xl border border-gray-200 object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={() => setImageError(true)}
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
                    <p className="text-sm">섬네일 없음</p>
                  </div>
                </motion.div>
              )}

              {/* 악보 정보 섹션 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-800">
                  악보 정보
                </h2>
                <div className="grid gap-4 text-gray-600">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">설명</span>
                    <p className="text-sm flex-1">
                      {score.description || "없음"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">템포</span>
                    <p className="text-sm flex-1">
                      {score.tempo || "없음"} BPM
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">가사</span>
                    <p className="text-sm flex-1 whitespace-pre-wrap">
                      {score.lyrics || "없음"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">
                      작곡가
                    </span>
                    <p className="text-sm flex-1">{score.composer || "없음"}</p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">
                      작사자
                    </span>
                    <p className="text-sm flex-1">{score.lyricist || "없음"}</p>
                  </div>
                  {score.isForSale && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-900 w-24">
                        판매가격
                      </span>
                      <p className="text-sm flex-1">
                        {score.isForSale
                          ? `₩${score.price?.toString()}`
                          : "무료"}
                      </p>
                    </div>
                  )}

                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">
                      공개 여부
                    </span>
                    <p className="text-sm flex-1">
                      {score.isPublic ? "공개" : "비공개인원"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium text-gray-900 w-24">
                      자작곡 여부
                    </span>
                    <p className="text-sm flex-1">
                      {score.isOriginal ? "자작곡" : "비자작곡"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 액션 버튼 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 flex flex-col sm:flex-row gap-4"
            >
              <a href={score.fileUrl} download className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center justify-center space-x-2"
                  aria-label="악보 다운로드"
                >
                  <Download className="w-5 h-5" />
                  <span>다운로드</span>
                </motion.button>
              </a>
              {score.isForSale && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 px-6 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition-all duration-300"
                  aria-label="구매하기"
                >
                  구매하기 (₩{score.price?.toLocaleString()})
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
