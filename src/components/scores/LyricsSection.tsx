// src/components/scores/LyricsSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface LyricsSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const LyricsSection: React.FC<LyricsSectionProps> = ({
  register,
  errors,
}) => {
  const t = useTranslations("ScoreUpload");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("lyricsLabel")} <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("lyrics", { required: t("lyricsRequired") })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
          rows={4}
          placeholder={t("lyricsPlaceholder")}
          aria-label={t("lyricsLabel")}
        />
        {errors.lyrics && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.lyrics.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("lyricsEnLabel")}
        </label>
        <textarea
          {...register("lyricsEn")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
          rows={4}
          placeholder={t("lyricsEnPlaceholder")}
          aria-label={t("lyricsEnLabel")}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("lyricsJaLabel")}
        </label>
        <textarea
          {...register("lyricsJa")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
          rows={4}
          placeholder={t("lyricsJaPlaceholder")}
          aria-label={t("lyricsJaLabel")}
        />
      </div>
    </div>
  );
};
