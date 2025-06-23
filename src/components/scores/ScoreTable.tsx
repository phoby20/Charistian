"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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

interface ScoreTableProps {
  scores: Score[];
  selectedScores: string[];
  onCheckboxChange: (scoreId: string | string[]) => void;
  locale: string;
  getGenreLabel: (genreValue: string) => string;
}

export default function ScoreTable({
  scores,
  selectedScores,
  onCheckboxChange,
  locale,
  getGenreLabel,
}: ScoreTableProps) {
  const t = useTranslations("Score");

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-10">
              <input
                type="checkbox"
                onChange={(e) =>
                  onCheckboxChange(
                    e.target.checked ? scores.map((s) => s.id) : []
                  )
                }
                checked={
                  scores.length > 0 &&
                  scores.every((score) => selectedScores.includes(score.id))
                }
                className="form-checkbox text-blue-500"
              />
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 w-16">
              {/* {t("thumbnail")} */}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("titleHeader")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("genre")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("tempo")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("key")}
            </th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
              {t("creator")}
            </th>
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
              {t("likes")}
            </th>
            <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
              {t("comments")}
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
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
                  onChange={() => onCheckboxChange(score.id)}
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
                    {t("none")}
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
                {score.genre ? getGenreLabel(score.genre) : t("none")}
              </td>
              <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[80px]">
                {score.tempo ? `${score.tempo} BPM` : t("none")}
              </td>
              <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[80px]">
                {score.key || t("none")}
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
  );
}
