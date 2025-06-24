// src/components/scores/TitleSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface TitleSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const TitleSection: React.FC<TitleSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          악보 제목 (한국어) <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title", { required: "제목은 필수입니다." })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="제목을 입력하세요"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            악보 제목 (영어)
          </label>
          <input
            {...register("titleEn")}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="영어 제목"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            악보 제목 (일본어)
          </label>
          <input
            {...register("titleJa")}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="일본어 제목"
          />
        </div>
      </div>
    </div>
  );
};
