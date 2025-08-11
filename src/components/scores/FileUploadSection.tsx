// FileUploadSection.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, X } from "lucide-react";
import { FieldErrors, Control, Controller } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";
import { constants } from "@/constants/intex";
import type * as PDFJS from "pdfjs-dist";
import { getPdfFirstPagePreview } from "@/utils/pdf-preview";

const { KEYS, TONES } = constants;

interface FileUploadSectionProps {
  fileError: string | null;
  pdfPreviews: { key: string; url: string | null }[];
  handleFileChange: (index: number, file: File | null) => void;
  removePdfPreview: (index: number) => void;
  errors: FieldErrors<ScoreFormData>;
  control: Control<ScoreFormData>;
  scoreKeyFields: { id: string }[];
  appendScoreKey: (value: { key: string; file: File | null }) => void;
  removeScoreKey: (index: number) => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  fileError,
  pdfPreviews: initialPdfPreviews,
  handleFileChange,
  removePdfPreview,
  errors,
  control,
  scoreKeyFields,
  appendScoreKey,
  removeScoreKey,
}) => {
  const t = useTranslations("FileUploadSection");
  const [validationErrors, setValidationErrors] = useState<(string | null)[]>(
    []
  );
  const [pdfjsLib, setPdfjsLib] = useState<typeof PDFJS | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [localPdfPreviews, setLocalPdfPreviews] = useState<
    { key: string; url: string | null }[]
  >([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ 클라이언트에서만 pdfjs-dist 로드
  useEffect(() => {
    (async () => {
      const pdfjs: typeof PDFJS = await import("pdfjs-dist");
      const workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      setPdfjsLib(pdfjs);
    })();
  }, []);

  // 초기 pdfPreviews를 로컬 상태로 복사하고 미리보기 생성 트리거
  useEffect(() => {
    setLocalPdfPreviews([...initialPdfPreviews]); // props를 mutable하게 수정하지 않도록 복사
  }, [initialPdfPreviews]);

  const validatePdf = async (file: File): Promise<boolean> => {
    try {
      const header = await file.slice(0, 5).text();
      if (!header.startsWith("%PDF-")) return false;
      if (file.size > 10 * 1024 * 1024) return false;
      return true;
    } catch {
      return false;
    }
  };

  const handleFile = async (
    index: number,
    file: File | null,
    inputElement: HTMLInputElement | null
  ) => {
    setValidationErrors((prev) => {
      const newErrors = [...prev];
      newErrors[index] = null;
      return newErrors;
    });

    if (file) {
      const isValid = await validatePdf(file);
      if (isValid && pdfjsLib) {
        try {
          const previewUrl = await getPdfFirstPagePreview(file, pdfjsLib);
          setLocalPdfPreviews((prev) => {
            const newPreviews = [...prev];
            newPreviews[index] = { key: file.name, url: previewUrl };
            return newPreviews;
          });
          handleFileChange(index, file);
        } catch (error) {
          console.error("미리보기 생성 실패:", error);
          setValidationErrors((prev) => {
            const newErrors = [...prev];
            newErrors[index] = t("invalidPdf");
            return newErrors;
          });
        }
      } else {
        if (inputElement) inputElement.value = "";
        handleFileChange(index, null);
        setValidationErrors((prev) => {
          const newErrors = [...prev];
          newErrors[index] = t("invalidPdf");
          return newErrors;
        });
      }
    } else {
      handleFileChange(index, null);
    }
  };

  useEffect(() => {
    if (!pdfjsLib || localPdfPreviews.length === 0) return;

    const generatePreviews = async () => {
      const newPreviews = [...localPdfPreviews];
      let hasChanges = false;

      for (let index = 0; index < newPreviews.length; index++) {
        const preview = newPreviews[index];
        if (preview.url && preview.url.endsWith(".pdf")) {
          // PDF URL인지 체크
          try {
            const previewUrl = await getPdfFirstPagePreview(
              preview.url,
              pdfjsLib
            );
            newPreviews[index].url = previewUrl;
            hasChanges = true;
          } catch (error) {
            console.error("미리보기 생성 실패:", error);
            setValidationErrors((prev) => {
              const newErrors = [...prev];
              newErrors[index] = "PDF 미리보기 생성 실패";
              return newErrors;
            });
          }
        }
      }

      if (hasChanges) {
        setLocalPdfPreviews(newPreviews);
      }
    };

    generatePreviews();
  }, [pdfjsLib, localPdfPreviews.length]); // localPdfPreviews.length에 의존하여 초기 로드 시 실행

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("label")} <span className="text-red-500">*</span>
      </label>
      {scoreKeyFields.map((field, index) => (
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
                      onChange={async (
                        e: React.ChangeEvent<HTMLInputElement>
                      ) => {
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
                      <img
                        src={localPdfPreviews[index].url!}
                        alt="PDF Preview"
                        className="w-full rounded-md shadow"
                      />
                    ) : (
                      <div>Loading preview...</div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        removePdfPreview(index);
                        setLocalPdfPreviews((prev) => {
                          const newPreviews = [...prev];
                          newPreviews[index] = { key: "", url: null }; // 미리보기 삭제
                          return newPreviews;
                        });
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

          {scoreKeyFields.length > 1 && (
            <button
              type="button"
              onClick={() => {
                removeScoreKey(index);
                setValidationErrors((prev) =>
                  prev.filter((_, i) => i !== index)
                );
                setLocalPdfPreviews((prev) =>
                  prev.filter((_, i) => i !== index)
                );
              }}
              className="absolute top-2 right-12 p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          appendScoreKey({ key: "", file: null });
          setLocalPdfPreviews((prev) => [...prev, { key: "", url: null }]);
        }}
        className="mt-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {t("addKey")}
      </button>
    </div>
  );
};
