// src/components/scores/ReferenceUrlsSection.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import {
  UseFormRegister,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import { ScoreFormData } from "@/types/score";

interface ReferenceUrlsSectionProps {
  fields: FieldArrayWithId<ScoreFormData, "referenceUrls", "id">[];
  append: UseFieldArrayAppend<ScoreFormData, "referenceUrls">;
  remove: UseFieldArrayRemove;
  register: UseFormRegister<ScoreFormData>;
}

export const ReferenceUrlsSection: React.FC<ReferenceUrlsSectionProps> = ({
  fields,
  append,
  remove,
  register,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        참고 URL
      </label>
      <AnimatePresence>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center mb-2"
          >
            <input
              {...register(`referenceUrls.${index}.url` as const)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="URL 입력 (예: https://youtube.com)"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => append({ url: "" })}
        className="flex items-center mt-2 text-blue-600 hover:text-blue-800"
      >
        <Plus className="w-5 h-5 mr-1" />
        URL 추가
      </button>
    </div>
  );
};
