// src/components/scores/TempoSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface TempoSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const TempoSection: React.FC<TempoSectionProps> = ({
  register,
  errors,
}) => {
  const t = useTranslations("ScoreUpload");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("tempoLabel")} <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        {...register("tempo", {
          required: t("tempoRequired"),
          valueAsNumber: true,
        })}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        placeholder={t("tempoPlaceholder")}
        aria-label={t("tempoLabel")}
        min="1"
      />
      {errors.tempo && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.tempo.message}
        </p>
      )}
    </div>
  );
};
