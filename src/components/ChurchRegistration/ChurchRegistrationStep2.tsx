// src/components/ChurchRegistration/ChurchRegistrationStep2.tsx
"use client";

import { useTranslations } from "next-intl";
import { FormEvent } from "react";
import { motion } from "framer-motion";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { ChurchFormData } from "@/types/church";

interface ChurchRegistrationStep2Props {
  formData: ChurchFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleNextStep: (e: FormEvent<HTMLFormElement>) => void;
  handlePrevStep: () => void;
}

export default function ChurchRegistrationStep2({
  formData,
  handleInputChange,
  handleNextStep,
  handlePrevStep,
}: ChurchRegistrationStep2Props) {
  const t = useTranslations("churchRegistration");

  // 모든 입력 필드가 채워졌는지 확인
  const isFormFilled =
    formData.contactName.trim() !== "" &&
    formData.contactPhone.trim() !== "" &&
    formData.contactGender !== "" &&
    formData.contactBirthDate !== "";

  return (
    <motion.form
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleNextStep}
      className="space-y-4"
    >
      <Input
        label={t("contactName")}
        name="contactName"
        value={formData.contactName}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("contactName")}
      />
      <Input
        label={t("contactPhone")}
        name="contactPhone"
        value={formData.contactPhone}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("contactPhone")}
      />
      <Select
        label={t("contactGender")}
        name="contactGender"
        options={[
          { value: "M", label: t("male") },
          { value: "F", label: t("female") },
        ]}
        value={formData.contactGender}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <Input
        label={t("contactBirthDate")}
        type="date"
        name="contactBirthDate"
        value={formData.contactBirthDate}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <div className="flex justify-between gap-4">
        <Button variant="outline" type="button" onClick={handlePrevStep}>
          {t("back")}
        </Button>
        <Button type="submit" isDisabled={!isFormFilled}>
          {t("next")}
        </Button>
      </div>
    </motion.form>
  );
}
