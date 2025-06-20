// src/components/scores/DescriptionSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface DescriptionSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        설명 <span className="text-red-500">*</span>
      </label>
      <textarea
        {...register("description", { required: "설명은 필수입니다." })}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={5}
        placeholder="악보에 대한 설명을 입력하세요"
      />
      {errors.description && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.description.message}
        </p>
      )}
    </div>
  );
};
