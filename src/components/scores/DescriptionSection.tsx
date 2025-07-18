// src/components/scores/DescriptionSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface DescriptionSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  register,
  errors,
}) => {
  const t = useTranslations("ScoreUpload");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("descriptionLabel")} <span className="text-red-500">*</span>
      </label>
      <textarea
        {...register("description", { required: t("descriptionRequired") })}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm whitespace-pre-wrap"
        rows={5}
        placeholder={t("descriptionPlaceholder")}
        aria-label={t("descriptionLabel")}
      />
      {errors.description && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.description.message}
        </p>
      )}
    </div>
  );
};
