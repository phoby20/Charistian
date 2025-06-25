import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, X } from "lucide-react";
import { FieldErrors, Control } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";

interface FileUploadSectionProps {
  fileError: string | null;
  pdfPreview: string | null;
  handleFileChange: (file: File | null) => void;
  removePdfPreview: () => void;
  errors: FieldErrors<ScoreFormData>;
  control: Control<ScoreFormData>;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  fileError,
  pdfPreview,
  handleFileChange,
  removePdfPreview,
  errors,
  control,
}) => {
  const t = useTranslations("FileUploadSection");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validatePdf = async (file: File): Promise<boolean> => {
    try {
      const header = await file.slice(0, 5).text();
      if (!header.startsWith("%PDF-")) {
        setValidationError(t("invalidPdf"));
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError(t("fileTooLarge"));
        return false;
      }
      return true;
    } catch {
      setValidationError(t("fileReadError"));
      return false;
    }
  };

  const handleFile = async (
    file: File | null,
    inputElement: HTMLInputElement | null
  ) => {
    setValidationError(null);
    if (file) {
      const isValid = await validatePdf(file);
      if (isValid) {
        handleFileChange(file); // Update UI state
      } else {
        if (inputElement) inputElement.value = ""; // Reset input
        handleFileChange(null);
      }
    } else {
      handleFileChange(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("label")} <span className="text-red-500">*</span>
      </label>
      <Controller
        name="file"
        control={control}
        rules={{ required: t("required") }}
        render={({ field }) => (
          <div
            className={`relative w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0] || null;
              if (file) {
                const isValid = await validatePdf(file);
                if (isValid) {
                  field.onChange(file); // Update react-hook-form state
                  handleFileChange(file); // Update UI state
                } else {
                  field.onChange(null);
                  handleFileChange(null);
                }
              }
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] || null;
                await handleFile(file, e.target);
                field.onChange(file); // Update react-hook-form state
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full"
            >
              <Upload className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-gray-600">{t("selectOrDrag")}</span>
            </label>
          </div>
        )}
      />
      {pdfPreview && (
        <div className="relative mt-4">
          <div className="text-sm text-gray-600">
            {t("fileSelected", { fileName: pdfPreview.split("/").pop() || "" })}
          </div>
          <button
            type="button"
            onClick={removePdfPreview}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <AnimatePresence>
        {(fileError || errors.file?.message || validationError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            {validationError || fileError || errors.file?.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
