"use client";

import { useTranslations, useLocale } from "next-intl";
import { GENRES } from "@/data/genre";
import TempoRangeFilter from "./TempoRangeFilter";

interface SearchFiltersProps {
  searchQuery: string;
  selectedGenres: string[];
  selectedKeys: string[];
  selectedSharp: "all" | "sharp" | "natural" | "flat";
  selectedTone: "Major" | "Minor" | "";
  minAvailableTempo: number;
  maxAvailableTempo: number;
  minTempoLimit: number;
  maxTempoLimit: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenreChange: (genreValue: string) => void;
  onKeyChange: (keyValue: string) => void;
  onSharpChange: (sharp: "all" | "sharp" | "natural" | "flat") => void;
  onToneChange: (tone: "Major" | "Minor" | "") => void;
  onMinTempoChange: (value: number) => void;
  onMaxTempoChange: (value: number) => void;
}

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];

export default function SearchFilters({
  searchQuery,
  selectedGenres,
  selectedKeys,
  selectedSharp,
  selectedTone,
  minAvailableTempo,
  maxAvailableTempo,
  minTempoLimit,
  maxTempoLimit,
  onSearchChange,
  onGenreChange,
  onKeyChange,
  onSharpChange,
  onToneChange,
  onMinTempoChange,
  onMaxTempoChange,
}: SearchFiltersProps) {
  const t = useTranslations("Score");
  const locale = useLocale();

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-2 mb-6">
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t("searchPlaceholder")}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Genre */}
      <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg flex items-center">
        <label className="w-[70px] sm:w-[30px] text-sm font-semibold text-gray-700 block">
          {t("genreFilter")}
        </label>
        <div className="flex flex-wrap gap-1 ml-4">
          {GENRES.map((genre) => {
            const label = locale === "ja" ? genre.ja : genre.ko;
            const selected = selectedGenres.includes(genre.value);
            return (
              <button
                key={genre.value}
                onClick={() => onGenreChange(genre.value)}
                className={`cursor-pointer px-3 py-1 rounded-full text-sm font-medium border transition ${
                  selected
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Key */}
      <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg flex items-center">
        <label className="text-sm font-semibold text-gray-700 block">
          {t("keyFilter")}
        </label>
        <div className="flex flex-wrap gap-2 ml-5">
          {KEYS.map((key) => {
            const selected = selectedKeys.includes(key);
            return (
              <button
                key={key}
                onClick={() => onKeyChange(key)}
                className={`cursor-pointer px-2.5 py-1.5 rounded-md text-sm font-medium border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sharp / Flat */}
      <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg flex items-center">
        <label className="text-sm font-semibold text-gray-700 block">
          {t("sharpFilter")}
        </label>
        <div className="flex gap-2 ml-5">
          {(["all", "natural", "sharp", "flat"] as const).map((type) => {
            const selected = selectedSharp === type;
            return (
              <button
                key={type}
                onClick={() => onSharpChange(type)}
                className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
              >
                {t(type)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg flex items-center">
        <label className="text-sm font-semibold text-gray-700 block">
          {t("toneFilter")}
        </label>
        <div className="flex gap-2 ml-10">
          {(["", "Major", "Minor"] as const).map((tone) => {
            const selected = selectedTone === tone;
            return (
              <button
                key={tone}
                onClick={() => onToneChange(tone)}
                className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
              >
                {tone === "" ? t("all") : t(tone.toLowerCase())}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tempo */}
      <TempoRangeFilter
        minAvailableTempo={minAvailableTempo}
        maxAvailableTempo={maxAvailableTempo}
        minTempoLimit={minTempoLimit}
        maxTempoLimit={maxTempoLimit}
        onMinTempoChange={onMinTempoChange}
        onMaxTempoChange={onMaxTempoChange}
      />
    </div>
  );
}
