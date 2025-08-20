// src/components/scores/OptionsSection.tsx
import { UseFormRegister, useWatch, Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ScoreFormData } from "@/types/score";

interface OptionsSectionProps {
  register: UseFormRegister<ScoreFormData>;
  control: Control<ScoreFormData>;
}

export const OptionsSection: React.FC<OptionsSectionProps> = ({
  register,
  control,
}) => {
  const t = useTranslations("ScoreUpload");
  const isOriginal = useWatch({
    control,
    name: "isOriginal",
    defaultValue: false,
  });

  // TODO: 밑의 코드는 판매기능이 추가되면 삭제할 것
  console.log("isOriginal:", isOriginal);

  return (
    <div className="space-y-4">
      <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isOriginal")}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          aria-label={t("isOriginalLabel")}
        />
        <span className="ml-2">{t("isOriginalLabel")}</span>
      </label>
      {/* TODO: 다른 교회 공유시에 더 엄격한 기준으로 저작권 분쟁이 없도록 해야함 */}
      {/* <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isPublic")}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          aria-label={t("isPublicLabel")}
        />
        <span className="ml-2">{t("isPublicLabel")}</span>
      </label> */}
      {/* TODO: 밑의 버튼은 판매기능이 추가되면 활성화 할것 */}
      {/* <label className="flex items-center text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          {...register("isForSale")}
          disabled={!isOriginal}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
          aria-label={t("isForSaleLabel")}
        />
        <span className="ml-2">{t("isForSaleLabel")}</span>
      </label> */}
    </div>
  );
};
