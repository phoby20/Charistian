// src/components/scores/FileUploadSection.tsx
"use client";
import { useState, useEffect } from "react";
import { FieldErrors, Control, UseFieldArrayAppend } from "react-hook-form"; // UseFieldArrayAppend로 변경
import { ScoreFormData } from "@/types/score";
import { useTranslations } from "next-intl";
import type * as PDFJS from "pdfjs-dist";
import { getPdfFirstPagePreview } from "@/utils/pdf-preview";
import { ScoreKeyField } from "./ScoreKeyField";
import Button from "../Button";
import { Plus } from "lucide-react";

interface FileUploadSectionProps {
  fileError: string | null;
  pdfPreviews: { key: string; url: string | null }[];
  handleFileChange: (index: number, file: File | null) => void;
  errors: FieldErrors<ScoreFormData>;
  control: Control<ScoreFormData>;
  scoreKeyFields: { id: string }[];
  appendScoreKey: UseFieldArrayAppend<ScoreFormData, "scoreKeys">; // UseFieldArrayAppend 사용
  removeScoreKey: (index: number) => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  fileError,
  pdfPreviews: initialPdfPreviews,
  handleFileChange,
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

  // 클라이언트에서만 pdfjs-dist 로드
  useEffect(() => {
    (async () => {
      try {
        const pdfjs: typeof PDFJS = await import("pdfjs-dist");
        const workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error("pdfjs-dist 로드 실패:", error);
      }
    })();
  }, []);

  // 초기 pdfPreviews를 로컬 상태로 복사
  useEffect(() => {
    setLocalPdfPreviews(
      initialPdfPreviews.length
        ? initialPdfPreviews
        : scoreKeyFields.map(() => ({ key: "", url: null }))
    );
  }, [initialPdfPreviews, scoreKeyFields]);

  const validatePdf = async (file: File): Promise<boolean> => {
    try {
      if (file.type !== "application/pdf") {
        console.warn("파일 타입이 PDF가 아님:", file.type);
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        console.warn("파일 크기 초과:", file.size);
        return false;
      }
      const header = await file.slice(0, 5).text();
      if (!header.startsWith("%PDF-")) {
        console.warn("유효하지 않은 PDF 헤더:", header);
        return false;
      }
      return true;
    } catch (error) {
      console.error("PDF 유효성 검사 실패:", error);
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

    if (!pdfjsLib) {
      console.warn("pdfjsLib이 아직 로드되지 않음");
      setValidationErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = t("pdfjsNotLoaded");
        return newErrors;
      });
      if (inputElement) inputElement.value = "";
      handleFileChange(index, null);
      return;
    }

    if (file) {
      const isValid = await validatePdf(file);
      if (isValid) {
        try {
          const previewUrl = await getPdfFirstPagePreview(file, pdfjsLib);

          setLocalPdfPreviews((prev) => {
            const newPreviews = [...prev];
            if (index >= newPreviews.length) {
              newPreviews.push({ key: file.name, url: previewUrl });
            } else {
              newPreviews[index] = { key: file.name, url: previewUrl };
            }
            return newPreviews;
          });
          handleFileChange(index, file);
        } catch (error) {
          console.error("PDF 미리보기 생성 실패:", error);
          setValidationErrors((prev) => {
            const newErrors = [...prev];
            newErrors[index] = t("invalidPdf");
            return newErrors;
          });
          if (inputElement) inputElement.value = "";
          handleFileChange(index, null);
        }
      } else {
        console.warn("유효하지 않은 PDF 파일:", file.name);
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
      setLocalPdfPreviews((prev) => {
        const newPreviews = [...prev];
        if (index < newPreviews.length) {
          newPreviews[index] = { key: "", url: null };
        }
        return newPreviews;
      });
    }
  };

  // 기존 PDF URL에 대한 미리보기 생성 (새 파일은 handleFile에서 처리)
  useEffect(() => {
    if (!pdfjsLib || !initialPdfPreviews.length) return;

    const generatePreviews = async () => {
      const newPreviews = [...localPdfPreviews];
      let hasChanges = false;

      for (let index = 0; index < initialPdfPreviews.length; index++) {
        const preview = initialPdfPreviews[index];
        if (
          preview.url &&
          preview.url.endsWith(".pdf") &&
          (preview.url.startsWith("http://") ||
            preview.url.startsWith("https://"))
        ) {
          try {
            const previewUrl = await getPdfFirstPagePreview(
              preview.url,
              pdfjsLib
            );
            newPreviews[index] = { ...newPreviews[index], url: previewUrl };
            hasChanges = true;
          } catch (error) {
            console.error("기존 PDF 미리보기 생성 실패:", error);
            setValidationErrors((prev) => {
              const newErrors = [...prev];
              newErrors[index] = t("invalidPdf");
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
  }, [pdfjsLib, initialPdfPreviews, t]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("label")} <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {scoreKeyFields.map((field, index) => (
          <ScoreKeyField
            key={field.id}
            index={index}
            field={field}
            control={control}
            errors={errors}
            validationErrors={validationErrors}
            fileError={fileError}
            localPdfPreviews={localPdfPreviews}
            isClient={isClient}
            handleFile={handleFile}
            removeScoreKey={removeScoreKey}
            scoreKeyFieldsLength={scoreKeyFields.length}
          />
        ))}
        <div className="border border-dashed border-gray-400 p-4 rounded-md relative flex items-center justify-center">
          <Button
            type="button" // 폼 제출 방지
            variant="outline"
            onClick={() => {
              appendScoreKey({ key: "", file: null });
              setLocalPdfPreviews((prev) => [...prev, { key: "", url: null }]);
              setValidationErrors((prev) => [...prev, null]);
            }}
          >
            <Plus className="w-6 h-6 mr-2" />
            {t("addKey")}
          </Button>
        </div>
      </div>
    </div>
  );
};
