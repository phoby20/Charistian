// src/components/scores/FileUploadSection.tsx
"use client";
import { useState, useEffect } from "react";
import { FieldErrors, Control } from "react-hook-form";
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

  // 클라이언트에서만 pdfjs-dist 로드
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

  // 초기 pdfPreviews를 로컬 상태로 복사
  useEffect(() => {
    setLocalPdfPreviews([...initialPdfPreviews]);
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
  }, [pdfjsLib, localPdfPreviews.length]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("label")} <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            removePdfPreview={removePdfPreview}
            removeScoreKey={removeScoreKey}
            scoreKeyFieldsLength={scoreKeyFields.length}
          />
        ))}
        <div className="border border-dashed border-gray-400 p-4 rounded-md relative flex items-center justify-center">
          <Button
            variant="outline"
            onClick={() => {
              appendScoreKey({ key: "", file: null });
              setLocalPdfPreviews((prev) => [...prev, { key: "", url: null }]);
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
