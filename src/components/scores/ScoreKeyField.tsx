// src/components/ScoreKeyField.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Upload } from "lucide-react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";
import { constants } from "@/constants/intex";
import Image from "next/image";

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
  removePdfPreview: (index: number) => void;
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
  removePdfPreview,
  removeScoreKey,
  scoreKeyFieldsLength,
}) => {
  const t = useTranslations("FileUploadSection");

  return (
    <div key={field.id} className="border p-4 rounded-md relative">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
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
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <p className="text-red-500 text-sm flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.scoreKeys[index]?.key?.message}</span>
            </p>
          )}
        </div>
      </div>

      <Controller
        name={`scoreKeys.${index}.file`}
        control={control}
        rules={{ required: t("required") }}
        render={({ field }) => (
          <>
            {!localPdfPreviews[index]?.url ? (
              <div
                className={`relative w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  validationErrors[index]
                    ? "border-red-500"
                    : "border-gray-300 hover:border-blue-500"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0] || null;
                  await handleFile(index, file, null);
                  field.onChange(file);
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0] || null;
                    await handleFile(index, file, e.target);
                    field.onChange(file);
                  }}
                  className="hidden"
                  id={`file-upload-${index}`}
                />
                <label
                  htmlFor={`file-upload-${index}`}
                  className="flex items-center justify-center w-full"
                >
                  <Upload className="w-6 h-6 text-gray-500 mr-2" />
                  <span className="text-gray-600">{t("selectOrDrag")}</span>
                </label>
              </div>
            ) : (
              <div className="relative mt-4">
                {isClient &&
                localPdfPreviews[index]?.url &&
                !localPdfPreviews[index]?.url.endsWith(".pdf") ? (
                  <Image
                    src={localPdfPreviews[index].url!}
                    alt="PDF Preview"
                    className="w-full rounded-md shadow"
                    width={56}
                    height={56}
                  />
                ) : (
                  <div>loading Preview...</div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    removePdfPreview(index);
                    field.onChange(null); // Form 상태 초기화
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      />

      <AnimatePresence>
        {(fileError ||
          errors.scoreKeys?.[index]?.file?.message ||
          validationErrors[index]) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            {validationErrors[index] ||
              fileError ||
              errors.scoreKeys?.[index]?.file?.message}
          </motion.p>
        )}
      </AnimatePresence>

      {scoreKeyFieldsLength > 1 && (
        <button
          type="button"
          onClick={() => removeScoreKey(index)}
          className="absolute top-2 right-12 p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
