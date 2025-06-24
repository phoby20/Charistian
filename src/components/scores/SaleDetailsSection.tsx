// src/components/scores/SaleDetailsSection.tsx
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {
  UseFormRegister,
  useWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import { ScoreFormData } from "@/types/score";
import { AlertCircle } from "lucide-react";

interface SaleDetailsSectionProps {
  register: UseFormRegister<ScoreFormData>;
  control: Control<ScoreFormData>;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  handleDateChange: (
    date: Date | null,
    field: "saleStartDate" | "saleEndDate"
  ) => void;
  errors: FieldErrors<ScoreFormData>;
}

export const SaleDetailsSection: React.FC<SaleDetailsSectionProps> = ({
  register,
  control,
  saleStartDate,
  saleEndDate,
  handleDateChange,
  errors,
}) => {
  const isForSale = useWatch({
    control,
    name: "isForSale",
    defaultValue: false,
  });
  const isOriginal = useWatch({
    control,
    name: "isOriginal",
    defaultValue: false,
  });

  return (
    <AnimatePresence>
      {isForSale && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              판매금액 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("price", {
                required: isForSale && "판매금액은 필수입니다.",
              })}
              disabled={!isForSale || !isOriginal}
              className="w-full p-3 border border-gray-300 rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="판매 금액 (원)"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.price.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                판매 시작일
              </label>
              <DatePicker
                selected={saleStartDate}
                onChange={(date: Date | null) =>
                  handleDateChange(date, "saleStartDate")
                }
                locale={ko}
                dateFormat="yyyy-MM-dd"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="시작일 선택"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                판매 종료일
              </label>
              <DatePicker
                selected={saleEndDate}
                onChange={(date: Date | null) =>
                  handleDateChange(date, "saleEndDate")
                }
                locale={ko}
                dateFormat="yyyy-MM-dd"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="종료일 선택"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
