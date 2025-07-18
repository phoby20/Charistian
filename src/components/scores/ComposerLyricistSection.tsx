// src/components/scores/ComposerLyricistSection.tsx
import { UseFormRegister } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";

interface ComposerLyricistSectionProps {
  register: UseFormRegister<ScoreFormData>;
}

export const ComposerLyricistSection: React.FC<
  ComposerLyricistSectionProps
> = ({ register }) => {
  const t = useTranslations("ScoreUpload");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("composerLabel")}
        </label>
        <input
          {...register("composer")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          placeholder={t("composerPlaceholder")}
          aria-label={t("composerLabel")}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("lyricistLabel")}
        </label>
        <input
          {...register("lyricist")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          placeholder={t("lyricistPlaceholder")}
          aria-label={t("lyricistLabel")}
        />
      </div>
    </div>
  );
};
