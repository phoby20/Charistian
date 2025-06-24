// src/components/scores/FileUploadSection.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, X } from "lucide-react";
import { FieldErrors, Control } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { Controller } from "react-hook-form";

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
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePdf = async (file: File): Promise<boolean> => {
    try {
      const header = await file.slice(0, 5).text();
      if (!header.startsWith("%PDF-")) {
        setValidationError("유효한 PDF 파일이 아닙니다.");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError("파일 크기는 10MB를 초과할 수 없습니다.");
        return false;
      }
      return true;
    } catch {
      setValidationError("파일을 읽는 중 오류가 발생했습니다.");
      return false;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sheet Music File (PDF) <span className="text-red-500">*</span>
      </label>
      <Controller
        name="file"
        control={control}
        rules={{ required: "PDF file is required." }}
        render={({ field }) => (
          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                setValidationError(null);
                const file = e.target.files?.[0] || null;
                if (file) {
                  const isValid = await validatePdf(file);
                  if (isValid) {
                    field.onChange(file); // Update react-hook-form state
                    handleFileChange(file); // Update UI state
                  } else {
                    e.target.value = "";
                    field.onChange(null);
                    handleFileChange(null);
                  }
                } else {
                  field.onChange(null);
                  handleFileChange(null);
                }
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-gray-600">Select or drag a PDF file</span>
            </label>
          </div>
        )}
      />
      {pdfPreview && (
        <div className="relative mt-4">
          <div className="text-sm text-gray-600">
            파일 선택됨: {pdfPreview.split("/").pop()}
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
        {(fileError || errors.file || validationError) && (
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
