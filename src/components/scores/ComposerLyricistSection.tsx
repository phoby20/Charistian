// src/components/scores/ComposerLyricistSection.tsx
import { UseFormRegister } from "react-hook-form";
import { ScoreFormData } from "@/types/score";

interface ComposerLyricistSectionProps {
  register: UseFormRegister<ScoreFormData>;
}

export const ComposerLyricistSection: React.FC<
  ComposerLyricistSectionProps
> = ({ register }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          작곡가
        </label>
        <input
          {...register("composer")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="작곡가 이름"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          작사자
        </label>
        <input
          {...register("lyricist")}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="작사자 이름"
        />
      </div>
    </div>
  );
};
