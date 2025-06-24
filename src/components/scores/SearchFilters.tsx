"use client";
import { useTranslations, useLocale } from "next-intl";
import { GENRES } from "@/data/genre";

interface SearchFiltersProps {
  searchQuery: string;
  selectedGenres: string[];
  selectedKeys: string[];
  selectedSharp: "all" | "sharp" | "natural";
  selectedTone: "Major" | "Minor" | "";
  minAvailableTempo: number;
  maxAvailableTempo: number;
  minTempoLimit: number;
  maxTempoLimit: number;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenreChange: (genreValue: string) => void;
  onKeyChange: (keyValue: string) => void;
  onSharpChange: (sharp: "all" | "sharp" | "natural") => void;
  onToneChange: (tone: "Major" | "Minor" | "") => void;
  onMinTempoChange: (value: number) => void;
  onMaxTempoChange: (value: number) => void;
}

// 코드 키와 조 상수
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
    <div>
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
      <div className="mb-16 flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md">
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
          className="w-full md:w-[50%] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <div className="flex flex-col gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("genreFilter")}
            </label>
            <div className="flex flex-wrap gap-3">
              {GENRES.map((genre) => (
                <label
                  key={genre.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre.value)}
                    onChange={() => onGenreChange(genre.value)}
                    className="form-checkbox h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {locale === "ja" ? genre.ja : genre.ko}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("keyFilter")}
            </label>
            <div className="flex flex-wrap gap-6">
              {KEYS.map((key) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(key)}
                    onChange={() => onKeyChange(key)}
                    className="form-checkbox h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{key}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("sharpFilter")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="sharp"
                  checked={selectedSharp === "all"}
                  onChange={() => onSharpChange("all")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("all")}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="sharp"
                  checked={selectedSharp === "sharp"}
                  onChange={() => onSharpChange("sharp")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("sharp")}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="sharp"
                  checked={selectedSharp === "natural"}
                  onChange={() => onSharpChange("natural")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("natural")}</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("toneFilter")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tone"
                  checked={selectedTone === ""}
                  onChange={() => onToneChange("")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("all")}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tone"
                  checked={selectedTone === "Major"}
                  onChange={() => onToneChange("Major")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("major")}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tone"
                  checked={selectedTone === "Minor"}
                  onChange={() => onToneChange("Minor")}
                  className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t("minor")}</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("tempoRange")}: {minAvailableTempo} - {maxAvailableTempo} BPM
            </label>
            <div className="range-slider">
              <div className="range-track" style={{ left: 0, width: "100%" }} />
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
                onChange={(e) => onMinTempoChange(Number(e.target.value))}
                className="z-10"
              />
              <input
                type="range"
                min={minTempoLimit}
                max={maxTempoLimit}
                value={maxAvailableTempo}
                onChange={(e) => onMaxTempoChange(Number(e.target.value))}
                className="z-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
