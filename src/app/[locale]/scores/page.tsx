"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Upload } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ApiErrorResponse, SelectedSong, UsageLimits } from "@/types/score";
import { GENRES } from "@/data/genre";
import Loading from "@/components/Loading";
import ScoreTable from "@/components/scores/ScoreTable";
import SearchFilters from "@/components/scores/SearchFilters";
import PaginationControls from "@/components/scores/PaginationControls";
import SelectedSongList from "@/components/scores/SelectedSongFlotingList";
import { Score } from "@/types/score";

export default function ScoreList() {
  const [scores, setScores] = useState<Score[]>([]);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedSharp, setSelectedSharp] = useState<
    "all" | "sharp" | "natural" | "flat"
  >("all");
  const [selectedTone, setSelectedTone] = useState<"Major" | "Minor" | "">("");
  const [minAvailableTempo, setMinAvailableTempo] = useState(0);
  const [maxAvailableTempo, setMaxAvailableTempo] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSongList, setSelectedSongList] = useState<SelectedSong[]>([]);
  const [isSongListOpen, setIsSongListOpen] = useState(true);
  const locale = useLocale();
  const t = useTranslations("Score");

  // 키 정규화 함수
  const normalizeKey = (key: string): string => {
    // 샤프(#) 또는 플랫(b)을 제거하고 기본 음계만 반환
    return key.split(" ")[0].replace(/[#b]/, "");
  };

  // 세션 스토리지에서 선곡 리스트 불러오기
  useEffect(() => {
    const stored = sessionStorage.getItem("selectedSongList");
    if (stored) {
      try {
        setSelectedSongList(JSON.parse(stored));
      } catch (err) {
        console.error("선곡 리스트 파싱 오류:", err);
      }
    }
  }, []);

  // 선곡 리스트 세션 스토리지에 저장
  useEffect(() => {
    sessionStorage.setItem(
      "selectedSongList",
      JSON.stringify(selectedSongList)
    );
  }, [selectedSongList]);

  // 악보 및 사용량 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const scoresResponse = await fetch("/api/scores");
        if (!scoresResponse.ok) {
          const errorData: ApiErrorResponse = await scoresResponse.json();
          throw new Error(errorData.error || t("noScores"));
        }
        const scoresData = await scoresResponse.json();
        setScores(scoresData);

        const usageResponse = await fetch("/api/secure/usage-limits");
        if (!usageResponse.ok) {
          const errorData: ApiErrorResponse = await usageResponse.json();
          throw new Error(errorData.error || t("usageFetchError"));
        }
        const usageData = await usageResponse.json();
        setUsageLimits(usageData);

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
    fetchData();
  }, [locale, t]);

  // 곡 추가 핸들러
  const handleAddSong = (score: SelectedSong) => {
    setSelectedSongList((prev) => [
      ...prev,
      {
        id: score.id,
        title: score.title,
        titleEn: score.titleEn,
        titleJa: score.titleJa,
        key: score.key,
        referenceUrls: score.referenceUrls,
        fileUrl: score.fileUrl,
      },
    ]);
  };

  // 곡 삭제 핸들러
  const handleRemoveSong = (id: string, index: number) => {
    setSelectedSongList((prev) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
  };

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

  // 샤프/플랫/내추럴 라디오 버튼 핸들러
  const handleSharpChange = (sharp: "all" | "sharp" | "natural" | "flat") => {
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
      (score.titleJa?.toLowerCase().includes(searchLower) ?? false) ||
      (score.titleEn?.toLowerCase().includes(searchLower) ?? false) ||
      (score.description?.toLowerCase().includes(searchLower) ?? false) ||
      score.creator.name.toLowerCase().includes(searchLower) ||
      (score.composer?.toLowerCase().includes(searchLower) ?? false) ||
      (score.lyrics?.toLowerCase().includes(searchLower) ?? false) ||
      (score.lyricsEn?.toLowerCase().includes(searchLower) ?? false) ||
      (score.lyricsJa?.toLowerCase().includes(searchLower) ?? false);
    const matchesGenre =
      selectedGenres.length === 0 || selectedGenres.includes(score.genre ?? "");
    const matchesTempo =
      score.tempo !== undefined &&
      score.tempo >= minAvailableTempo &&
      score.tempo <= maxAvailableTempo;

    // 키 필터링: 샤프/플랫을 제거한 기본 음계로 비교
    const matchesKey =
      selectedKeys.length === 0 ||
      (score.key && selectedKeys.includes(normalizeKey(score.key)));

    // 샤프/플랫/내추럴 필터링
    const matchesSharp =
      selectedSharp === "all" ||
      (score.key &&
        (selectedSharp === "sharp"
          ? score.key.includes("#")
          : selectedSharp === "flat"
            ? score.key.includes("b")
            : !score.key.includes("#") && !score.key.includes("b")));

    // 조 필터링
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

  // 업로드 버튼 비활성화 여부 확인
  const isUploadButtonDisabled = (usageLimits: UsageLimits | null): boolean => {
    if (usageLimits?.plan === "ENTERPRISE") {
      return false;
    }
    return (
      !!usageLimits && usageLimits.remainingScores >= usageLimits.maxScores
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-8 px-4 pb-20 sm:px-6 lg:px-8">
      {isLoading && <Loading />}
      <div className="container mx-auto max-w-[95vw] sm:max-w-[90vw] md:max-w-5xl lg:max-w-6xl">
        <div className="w-auto max-w-5xl grid grid-cols-1 md:grid-cols-[3fr_1fr] lg:grid-cols-[3fr_1fr] gap-4">
          <div className="">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex sm:flex-row justify-between mb-4 sm:mb-6 gap-4"
            >
              <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
              <div className="flex flex-col justify-end text-right items-end-safe">
                <Link
                  href={
                    isUploadButtonDisabled(usageLimits)
                      ? "#"
                      : `/${locale}/scores/upload`
                  }
                >
                  <motion.button
                    whileHover={{
                      scale: isUploadButtonDisabled(usageLimits) ? 1 : 1.05,
                    }}
                    whileTap={{
                      scale: isUploadButtonDisabled(usageLimits) ? 1 : 0.95,
                    }}
                    disabled={isUploadButtonDisabled(usageLimits)}
                    className={`flex items-center space-x-2 py-2 px-4 rounded-lg shadow-md text-white font-semibold text-sm transition-all duration-300 ${
                      isUploadButtonDisabled(usageLimits)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                    }`}
                    aria-label={t("uploadScore")}
                  >
                    <Upload className="w-5 h-5" />
                    <span>{t("uploadScore")}</span>
                  </motion.button>
                </Link>
                {isUploadButtonDisabled(usageLimits) ? (
                  <span className="text-xs text-red-500 whitespace-pre-wrap mt-1">
                    {t("noUploadScore")}
                  </span>
                ) : null}
              </div>
            </motion.div>

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

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center space-x-3"
                >
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {paginatedScores.length === 0 && !error && !isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-600 py-12"
              >
                <p className="text-base sm:text-lg">{t("noScores")}</p>
              </motion.div>
            ) : (
              <ScoreTable
                scores={paginatedScores}
                onAddSong={handleAddSong}
                locale={locale}
                getGenreLabel={getGenreLabel}
              />
            )}

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              onPageChange={setCurrentPage}
            />
          </div>

          <div className="sm:block">
            <SelectedSongList
              selectedSongList={selectedSongList}
              handleRemoveSong={handleRemoveSong}
              locale={locale}
              isOpen={isSongListOpen}
              toggleOpen={() => setIsSongListOpen(!isSongListOpen)}
              usageLimits={usageLimits}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
