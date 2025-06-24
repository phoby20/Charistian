// src/components/scores/TempoSection.tsx
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface TempoSectionProps {
  register: UseFormRegister<ScoreFormData>;
  errors: FieldErrors<ScoreFormData>;
}

export const TempoSection: React.FC<TempoSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        템포 <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        {...register("tempo", { required: "템포는 필수입니다." })}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="BPM (예: 120)"
      />
      {errors.tempo && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.tempo.message}
        </p>
      )}
    </div>
  );
};
