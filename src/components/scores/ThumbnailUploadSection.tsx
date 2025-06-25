import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, X } from "lucide-react";
import { FieldErrors, Control } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";

interface ThumbnailUploadSectionProps {
  thumbnailPreview: string | null;
  handleThumbnailChange: (file: File | null) => void;
  removeThumbnail: () => void;
  errors: FieldErrors<ScoreFormData>;
  control: Control<ScoreFormData>;
}

export const ThumbnailUploadSection: React.FC<ThumbnailUploadSectionProps> = ({
  thumbnailPreview,
  handleThumbnailChange,
  removeThumbnail,
  errors,
  control,
}) => {
  const t = useTranslations("ThumbnailUploadSection");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateImage = async (file: File): Promise<boolean> => {
    try {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setValidationError(t("invalidImage"));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB 제한
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
      const isValid = await validateImage(file);
      if (isValid) {
        handleThumbnailChange(file); // Update UI state
      } else {
        if (inputElement) inputElement.value = ""; // Reset input
        handleThumbnailChange(null);
      }
    } else {
      handleThumbnailChange(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("label")} <span className="text-red-500">*</span>
      </label>
      <Controller
        name="thumbnail"
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
                const isValid = await validateImage(file);
                if (isValid) {
                  field.onChange(file); // Update react-hook-form state
                  handleThumbnailChange(file); // Update UI state
                } else {
                  field.onChange(null);
                  handleThumbnailChange(null);
                }
              }
            }}
          >
            <input
              type="file"
              accept=".jpg,.png"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] || null;
                await handleFile(file, e.target);
                field.onChange(file); // Update react-hook-form state
              }}
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex items-center justify-center w-full"
            >
              <Upload className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-gray-600">{t("selectOrDrag")}</span>
            </label>
          </div>
        )}
      />
      {thumbnailPreview && (
        <div className="relative mt-4">
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={thumbnailPreview}
            alt={t("fileSelected", {
              fileName: thumbnailPreview.split("/").pop() || "",
            })}
            className="w-32 h-32 object-cover rounded-md"
          />
          <button
            type="button"
            onClick={removeThumbnail}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-sm text-gray-600 mt-2">
            {t("fileSelected", {
              fileName: thumbnailPreview.split("/").pop() || "",
            })}
          </div>
        </div>
      )}
      <AnimatePresence>
        {(validationError || errors.thumbnail?.message) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            {validationError || errors.thumbnail?.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
