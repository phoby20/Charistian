"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Upload } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ApiErrorResponse } from "@/types/score";
import { GENRES } from "@/data/genre";
import Loading from "@/components/Loading";
import ScoreTable from "@/components/scores/ScoreTable";
import SearchFilters from "@/components/scores/SearchFilters";
import PaginationControls from "@/components/scores/PaginationControls";

interface Score {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  genre?: string;
  tempo?: number;
  key?: string;
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedSharp, setSelectedSharp] = useState<
    "all" | "sharp" | "natural"
  >("all");
  const [selectedTone, setSelectedTone] = useState<"Major" | "Minor" | "">("");
  const [selectedScores, setSelectedScores] = useState<string[]>([]);
  const [minAvailableTempo, setMinAvailableTempo] = useState(0);
  const [maxAvailableTempo, setMaxAvailableTempo] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const locale = useLocale();
  const t = useTranslations("Score");

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

  // 키 체크박스 핸들러
  const handleKeyChange = (keyValue: string) => {
    setSelectedKeys((prev) =>
      prev.includes(keyValue)
        ? prev.filter((k) => k !== keyValue)
        : [...prev, keyValue]
    );
    setCurrentPage(1);
  };

  // 샤프 라디오 버튼 핸들러
  const handleSharpChange = (sharp: "all" | "sharp" | "natural") => {
    setSelectedSharp(sharp);
    setCurrentPage(1);
  };

  // 조 라디오 버튼 핸들러
  const handleToneChange = (tone: "Major" | "Minor" | "") => {
    setSelectedTone(tone);
    setCurrentPage(1);
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
    const matchesKey =
      selectedKeys.length === 0 ||
      (score.key && selectedKeys.includes(score.key.split(" ")[0]));
    const matchesSharp =
      selectedSharp === "all" ||
      (score.key &&
        (selectedSharp === "sharp"
          ? score.key.split(" ")[0].includes("#")
          : !score.key.split(" ")[0].includes("#")));
    const matchesTone =
      selectedTone === "" || (score.key && score.key.endsWith(selectedTone));
    return (
      matchesSearch &&
      matchesGenre &&
      matchesTempo &&
      matchesKey &&
      matchesSharp &&
      matchesTone
    );
  });

  // 페이징 계산
  const totalPages = Math.ceil(filteredScores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScores = filteredScores.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // 체크박스 핸들러
  const handleCheckboxChange = (scoreId: string | string[]) => {
    if (Array.isArray(scoreId)) {
      setSelectedScores(scoreId);
    } else {
      setSelectedScores((prev) =>
        prev.includes(scoreId)
          ? prev.filter((id) => id !== scoreId)
          : [...prev, scoreId]
      );
    }
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

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchScores = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/scores");
        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error || t("noScores"));
        }
        const data = await response.json();
        setScores(data);
        setError(null);
      } catch (error: unknown) {
        let errorMessage = t("noScores");
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
  }, [locale, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {isLoading && <Loading />}
      <div className="container mx-auto max-w-6xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <Link href={`/${locale}/scores/upload`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              <Upload className="w-5 h-5" />
              <span>{t("uploadScore")}</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* 검색 및 필터링 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SearchFilters
            searchQuery={searchQuery}
            selectedGenres={selectedGenres}
            selectedKeys={selectedKeys}
            selectedSharp={selectedSharp}
            selectedTone={selectedTone}
            minAvailableTempo={minAvailableTempo}
            maxAvailableTempo={maxAvailableTempo}
            minTempoLimit={minTempoLimit}
            maxTempoLimit={maxTempoLimit}
            onSearchChange={handleSearchChange}
            onGenreChange={handleGenreChange}
            onKeyChange={handleKeyChange}
            onSharpChange={handleSharpChange}
            onToneChange={handleToneChange}
            onMinTempoChange={handleMinTempoChange}
            onMaxTempoChange={handleMaxTempoChange}
          />
        </motion.div>

        {/* 페이징 컨트롤 */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          onPageChange={setCurrentPage}
        />

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
            <p className="text-lg">{t("noScores")}</p>
          </motion.div>
        ) : (
          <ScoreTable
            scores={paginatedScores}
            selectedScores={selectedScores}
            onCheckboxChange={handleCheckboxChange}
            locale={locale}
            getGenreLabel={getGenreLabel}
          />
        )}
      </div>
    </div>
  );
}
