// src/components/scores/LyricsSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface LyricsSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const LyricsSection: React.FC<LyricsSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          가사 (한국어) <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("lyrics", { required: "가사는 필수입니다." })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="한국어 가사"
        />
        {errors.lyrics && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.lyrics.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          가사 (영어)
        </label>
        <textarea
          {...register("lyricsEn")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="영어 가사"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          가사 (일본어)
        </label>
        <textarea
          {...register("lyricsJa")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="일본어 가사"
        />
      </div>
    </div>
  );
};
