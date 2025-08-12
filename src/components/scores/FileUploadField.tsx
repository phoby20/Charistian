// src/components/scores/FileUploadField.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Upload, X } from "lucide-react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";

interface FileUploadFieldProps {
  index: number;
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
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  index,
  control,
  errors,
  validationErrors,
  fileError,
  localPdfPreviews,
  isClient,
  handleFile,
  removePdfPreview,
}) => {
  const t = useTranslations("FileUploadSection");

  return (
    <>
      <Controller
        name={`scoreKeys.${index}.file`}
        control={control}
        rules={{ required: t("required") }}
        render={({ field }) => (
          <>
            {!localPdfPreviews[index]?.url ? (
              <div
                className={`relative w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 mt-4 ${
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
                  className="flex items-center justify-center w-full text-gray-600 text-sm sm:text-base cursor-pointer"
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
    </>
  );
};
