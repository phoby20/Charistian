// src/components/scores/ReferenceUrlsSection.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import {
  UseFormRegister,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ScoreUpload");

  return (
    <div>
      <label className="block text-xl font-semibold text-gray-800 mb-4">
        {t("referenceUrlsLabel")}
      </label>
      <AnimatePresence>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center mb-2"
          >
            <input
              {...register(`referenceUrls.${index}.url` as const)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
              placeholder={t("referenceUrlsPlaceholder")}
              aria-label={t("referenceUrlsLabel")}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => remove(index)}
              className="cursor-pointer ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              aria-label={t("removeUrl")}
            >
              <Minus className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => append({ url: "" })}
        className="cursor-pointer flex items-center mt-2 text-indigo-600 hover:text-indigo-800"
        aria-label={t("addUrl")}
      >
        <Plus className="w-5 h-5 mr-1" />
        {t("addUrl")}
      </motion.button>
    </div>
  );
};
