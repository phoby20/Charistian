"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Upload } from "lucide-react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";
import { constants } from "@/constants/intex";

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

      <Controller
        name={`scoreKeys.${index}.file`}
        control={control}
        rules={{ required: t("required") }}
        render={({ field }) => (
          <>
            {!localPdfPreviews[index]?.url ? (
              <div
                className={`relative w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 mt-4 ${
                  validationErrors[index]
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
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
                  className="flex items-center justify-center w-full text-gray-600 text-sm sm:text-base"
                >
                  <Upload className="w-5 h-5 text-gray-500 mr-2" />
                  <span>{t("selectOrDrag")}</span>
                </label>
              </div>
            ) : (
              <div className="relative mt-4">
                {isClient &&
                localPdfPreviews[index]?.url &&
                !localPdfPreviews[index]?.url.endsWith(".pdf") ? (
                  <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={localPdfPreviews[index].url!}
                      alt="PDF Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm sm:text-base text-center">
                    {t("loadingPreview")}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    removePdfPreview(index);
                    field.onChange(null); // Form 상태 초기화
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-sm"
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-xs sm:text-sm mt-2 flex items-center"
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
          className="absolute top-2 right-10 p-1.5 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
