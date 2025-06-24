// src/components/scores/ThumbnailUploadSection.tsx
import { motion } from "framer-motion";
import { Upload, AlertCircle, X } from "lucide-react";
import { FieldErrors, Control } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { Controller } from "react-hook-form";

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
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        섬네일 이미지 (jpg, png) <span className="text-red-500">*</span>
      </label>
      <Controller
        name="thumbnail"
        control={control}
        rules={{ required: "섬네일 이미지는 필수입니다." }}
        render={({ field }) => (
          <div className="relative">
            <input
              type="file"
              accept=".jpg,.png"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] || null;
                if (file && ["image/jpeg", "image/png"].includes(file.type)) {
                  field.onChange(file);
                  handleThumbnailChange(file);
                } else {
                  e.target.value = "";
                  field.onChange(null);
                  handleThumbnailChange(null);
                }
              }}
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-500 mr-2" />
              <span className="text-gray-600">
                섬네일을 선택하거나 드래그하세요
              </span>
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
            alt="Thumbnail Preview"
            className="w-32 h-32 object-cover rounded-md"
          />
          <button
            type="button"
            onClick={removeThumbnail}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errors.thumbnail && (
        <p className="text-red-500 text-sm mt-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.thumbnail.message}
        </p>
      )}
    </div>
  );
};
