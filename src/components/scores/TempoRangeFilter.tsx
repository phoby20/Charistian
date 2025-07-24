"use client";
import { useTranslations } from "next-intl";

interface TempoRangeFilterProps {
  minAvailableTempo: number;
  maxAvailableTempo: number;
  minTempoLimit: number;
  maxTempoLimit: number;
  onMinTempoChange: (value: number) => void;
  onMaxTempoChange: (value: number) => void;
}

export default function TempoRangeFilter({
  minAvailableTempo,
  maxAvailableTempo,
  minTempoLimit,
  maxTempoLimit,
  onMinTempoChange,
  onMaxTempoChange,
}: TempoRangeFilterProps) {
  const t = useTranslations("Score");

  return (
    <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
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
          background: #fc089e;
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
          background: #ff59bf;
          z-index: 2;
        }
      `}</style>
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
            aria-label={t("minTempo")}
          />
          <input
            type="range"
            min={minTempoLimit}
            max={maxTempoLimit}
            value={maxAvailableTempo}
            onChange={(e) => onMaxTempoChange(Number(e.target.value))}
            className="z-10"
            aria-label={t("maxTempo")}
          />
        </div>
      </div>
    </div>
  );
}
