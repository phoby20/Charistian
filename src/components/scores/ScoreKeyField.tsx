// src/components/scores/ScoreKeyField.tsx
"use client";
import { motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { Control, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";
import { constants } from "@/constants/intex";
import { FileUploadField } from "./FileUploadField";

const { KEYS, TONES } = constants;

interface ScoreKeyFieldProps {
  index: number;
  field: { id: string };
  control: Control<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
  validationErrors: (string | null)[];
  fileError: string | null;
  localPdfPreviews: { key: string; url: string | null }[];
  isClient: boolean;
  handleFile: (
    index: number,
    file: File | null,
    inputElement: HTMLInputElement | null
  ) => void;
  removeScoreKey: (index: number) => void;
  scoreKeyFieldsLength: number;
}

export const ScoreKeyField: React.FC<ScoreKeyFieldProps> = ({
  index,
  field,
  control,
  errors,
  validationErrors,
  fileError,
  localPdfPreviews,
  isClient,
  handleFile,
  removeScoreKey,
  scoreKeyFieldsLength,
}) => {
  const t = useTranslations("FileUploadSection");

  return (
    <div
      key={field.id}
      className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <label className="block text-sm font-semibold text-gray-800 mb-1 sm:text-base">
            {t("keyLabel")}
          </label>
          <select
            {...control.register(`scoreKeys.${index}.key`, {
              required: t("keyRequired"),
              validate: (value) => {
                if (!value) return t("keyRequired");
                const [key, tone] = value.split(" ");
                if (
                  !KEYS.includes(key as (typeof KEYS)[number]) ||
                  !TONES.includes(tone as (typeof TONES)[number])
                ) {
                  return t("keyRequired");
                }
                return true;
              },
            })}
            className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
          >
            <option value="">{t("keyPlaceholder")}</option>
            {KEYS.flatMap((key) =>
              TONES.map((tone) => (
                <option key={`${key} ${tone}`} value={`${key} ${tone}`}>
                  {`${key} ${tone}`}
                </option>
              ))
            )}
          </select>
          {errors.scoreKeys?.[index]?.key && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 text-xs sm:text-sm flex items-center space-x-1 mt-1"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.scoreKeys[index]?.key?.message}</span>
            </motion.p>
          )}
        </div>
      </div>

      <FileUploadField
        index={index}
        control={control}
        errors={errors}
        validationErrors={validationErrors}
        fileError={fileError}
        localPdfPreviews={localPdfPreviews}
        isClient={isClient}
        handleFile={handleFile}
      />

      {scoreKeyFieldsLength > 1 && (
        <button
          type="button"
          onClick={() => removeScoreKey(index)}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
