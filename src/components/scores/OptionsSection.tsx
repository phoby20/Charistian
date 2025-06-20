// src/components/scores/OptionsSection.tsx
import { UseFormRegister, useWatch, Control } from "react-hook-form";
import { ScoreFormData } from "@/types/score";

interface OptionsSectionProps {
  register: UseFormRegister<ScoreFormData>;
  control: Control<ScoreFormData>;
}

export const OptionsSection: React.FC<OptionsSectionProps> = ({
  register,
  control,
}) => {
  const isOriginal = useWatch({
    control,
    name: "isOriginal",
    defaultValue: false,
  });

  return (
    <div className="space-y-4">
      <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isOriginal")}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="ml-2">자작곡 여부</span>
      </label>
      <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isPublic")}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="ml-2">다른 교회 공유 동의</span>
      </label>
      <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isForSale")}
          disabled={!isOriginal}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="ml-2">판매 허가</span>
      </label>
    </div>
  );
};
