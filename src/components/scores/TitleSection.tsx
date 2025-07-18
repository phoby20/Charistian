// src/components/scores/TitleSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface TitleSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const TitleSection: React.FC<TitleSectionProps> = ({
  register,
  errors,
}) => {
  const t = useTranslations("ScoreUpload");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("titleLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title", { required: t("titleRequired") })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          placeholder={t("titlePlaceholder")}
          aria-label={t("titleLabel")}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("titleEnLabel")}
          </label>
          <input
            {...register("titleEn")}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder={t("titleEnPlaceholder")}
            aria-label={t("titleEnLabel")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("titleJaLabel")}
          </label>
          <input
            {...register("titleJa")}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder={t("titleJaPlaceholder")}
            aria-label={t("titleJaLabel")}
          />
        </div>
      </div>
    </div>
  );
};
