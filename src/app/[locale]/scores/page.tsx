"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Upload,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocale } from "next-intl";
import { ApiErrorResponse } from "@/types/score";
import { GENRES } from "@/data/genre";
import Loading from "@/components/Loading";

interface Score {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  genre?: string;
  tempo?: number;
  key?: string; // 추가
  creator: { name: string };
  composer?: string;
  lyricist?: string;
  _count: { likes: number; comments: number };
  likes: { id: string }[];
}

export default function ScoreList() {
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedScores, setSelectedScores] = useState<string[]>([]);
  const [minAvailableTempo, setMinAvailableTempo] = useState(0);
  const [maxAvailableTempo, setMaxAvailableTempo] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const locale = useLocale();

  // 템포 범위 계산
  const maxTempoLimit = Math.max(
    ...scores.map((score) => score.tempo ?? 0),
    200
  );
  const minTempoLimit = Math.min(
    ...scores.map((score) => score.tempo ?? Infinity),
    0
  );

  // 템포 변경 핸들러
  const handleMinTempoChange = (value: number) => {
    if (value <= maxAvailableTempo) {
      setMinAvailableTempo(value);
      setCurrentPage(1);
    }
  };

  const handleMaxTempoChange = (value: number) => {
    if (value >= minAvailableTempo) {
      setMaxAvailableTempo(value);
      setCurrentPage(1);
    }
  };

  // 검색 및 필터링된 악보 목록
  const filteredScores = scores.filter((score) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      score.title.toLowerCase().includes(searchLower) ||
      (score.description?.toLowerCase().includes(searchLower) ?? false) ||
      score.creator.name.toLowerCase().includes(searchLower) ||
      (score.composer?.toLowerCase().includes(searchLower) ?? false) ||
      (score.lyricist?.toLowerCase().includes(searchLower) ?? false);
    const matchesGenre =
      selectedGenres.length === 0 || selectedGenres.includes(score.genre ?? "");
    const matchesTempo =
      score.tempo !== undefined &&
      score.tempo >= minAvailableTempo &&
      score.tempo <= maxAvailableTempo;
    return matchesSearch && matchesGenre && matchesTempo;
  });

  // 페이징 계산
  const totalPages = Math.ceil(filteredScores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScores = filteredScores.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // 페이지 네비게이션
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (scoreId: string) => {
    setSelectedScores((prev) =>
      prev.includes(scoreId)
        ? prev.filter((id) => id !== scoreId)
        : [...prev, scoreId]
    );
  };

  // 장르 체크박스 핸들러
  const handleGenreChange = (genreValue: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreValue)
        ? prev.filter((g) => g !== genreValue)
        : [...prev, genreValue]
    );
    setCurrentPage(1);
  };

  // 검색 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // 장르 라벨 가져오기
  const getGenreLabel = (genreValue: string) => {
    const genre = GENRES.find((g) => g.value === genreValue);
    return genre ? (locale === "ja" ? genre.ja : genre.ko) : "";
  };

  useEffect(() => {
    const fetchScores = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/scores");
        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(
            errorData.error ||
              (locale === "ja"
                ? "楽譜一覧の取得に失敗しました。"
                : "악보 목록을 불러오지 못했습니다.")
          );
        }
        const data = await response.json();
        setScores(data);
        setError(null);
      } catch (error: unknown) {
        let errorMessage =
          locale === "ja"
            ? "楽譜一覧の取得に失敗しました。"
            : "악보 목록을 불러오지 못했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScores();
  }, [locale]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {isLoading && <Loading />}
      <style jsx>{`
        .range-slider {
          position: relative;
          width: 100%;
          height: 20px;
        }
        .range-slider input[type="range"] {
          position: absolute;
          width: 100%;
          margin: 0;
          pointer-events: none;
          -webkit-appearance: none;
          background: transparent;
        }
        .range-slider input[type="range"]::-webkit-slider-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          -webkit-appearance: none;
          z-index: 10;
        }
        .range-slider input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        .range-track {
          position: absolute;
          top: 6px;
          height: 4px;
          background: #e5e7eb;
          width: 100%;
          z-index: 1;
        }
        .range-selected {
          position: absolute;
          top: 6px;
          height: 4px;
          background: #3b82f6;
          z-index: 2;
        }
      `}</style>
      <div className="container mx-auto max-w-6xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {locale === "ja" ? "楽譜一覧" : "악보 목록"}
          </h1>
          <Link href={`/${locale}/scores/upload`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              <Upload className="w-5 h-5" />
              <span>
                {locale === "ja" ? "楽譜アップロード" : "악보 업로드"}
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* 검색창, 장르 필터, 템포 레인지 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 flex flex-col gap-4"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={
              locale === "ja"
                ? "タイトル、説明、作成者、作曲者、作詞者で検索"
                : "타이틀, 설명, 작성자, 작곡가, 작사자로 검색"
            }
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <label key={genre.value} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.value)}
                  onChange={() => handleGenreChange(genre.value)}
                  className="form-checkbox text-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {locale === "ja" ? genre.ja : genre.ko}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {locale === "ja" ? "テンポ範囲" : "템포 범위"}:{" "}
              {minAvailableTempo} - {maxAvailableTempo} BPM
            </label>
            <div className="range-slider">
              <div
                className="range-track"
                style={{
                  left: 0,
                  width: "100%",
                }}
              />
              <div
                className="range-selected"
                style={{
                  left: `${
                    ((minAvailableTempo - minTempoLimit) /
                      (maxTempoLimit - minTempoLimit)) *
                    100
                  }%`,
                  width: `${
                    ((maxAvailableTempo - minAvailableTempo) /
                      (maxTempoLimit - minTempoLimit)) *
                    100
                  }%`,
                }}
              />
              <input
                type="range"
                min={minTempoLimit}
                max={maxTempoLimit}
                value={minAvailableTempo}
                onChange={(e) => handleMinTempoChange(Number(e.target.value))}
                className="z-10"
              />
              <input
                type="range"
                min={minTempoLimit}
                max={maxTempoLimit}
                value={maxAvailableTempo}
                onChange={(e) => handleMaxTempoChange(Number(e.target.value))}
                className="z-10"
              />
            </div>
          </div>
        </motion.div>

        {/* 페이징 컨트롤 */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">
              {locale === "ja" ? "ページごとの項目数" : "페이지당 항목 수"}:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border border-gray-300 rounded-md"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            {getPageNumbers().map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

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
        {paginatedScores.length === 0 && !error && !isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 py-12"
          >
            <p className="text-lg">
              {locale === "ja"
                ? "まだ登録された楽譜がありません。"
                : "아직 등록된 악보가 없습니다."}
            </p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedScores(
                          e.target.checked
                            ? paginatedScores.map((s) => s.id)
                            : []
                        )
                      }
                      checked={
                        paginatedScores.length > 0 &&
                        paginatedScores.every((score) =>
                          selectedScores.includes(score.id)
                        )
                      }
                      className="form-checkbox text-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 w-16">
                    {locale === "ja" ? "サムネイル" : "섬네일"}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "タイトル" : "타이틀"}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "ジャンル" : "장르"}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "テンポ" : "템포"}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "キー" : "키"} {/* 추가 */}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "作成者" : "작성자"}
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "いいね" : "좋아요"}
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    {locale === "ja" ? "コメント" : "댓글"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedScores.map((score, index) => (
                  <motion.tr
                    key={score.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedScores.includes(score.id)}
                        onChange={() => handleCheckboxChange(score.id)}
                        className="form-checkbox text-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      {score.thumbnailUrl ? (
                        <img
                          src={score.thumbnailUrl}
                          alt={score.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs text-gray-500 rounded">
                          {locale === "ja" ? "なし" : "없음"}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/${locale}/scores/${score.id}`}>
                        <span className="text-blue-600 hover:underline truncate block max-w-xs">
                          {score.title}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[100px]">
                      {score.genre
                        ? getGenreLabel(score.genre)
                        : locale === "ja"
                          ? "なし"
                          : "없음"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[80px]">
                      {score.tempo
                        ? `${score.tempo} BPM`
                        : locale === "ja"
                          ? "なし"
                          : "없음"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[80px]">
                      {score.key || (locale === "ja" ? "なし" : "없음")}{" "}
                      {/* 추가 */}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-xs">
                      {score.creator.name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{score._count.likes}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span>{score._count.comments}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
