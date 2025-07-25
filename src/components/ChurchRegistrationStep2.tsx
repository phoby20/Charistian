// src/components/ChurchRegistrationStep2.tsx
"use client";

import { useTranslations } from "next-intl";
import { FormEvent } from "react";
import { motion } from "framer-motion";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { ChurchFormData } from "@/types/church";
import { X } from "lucide-react";
import Loading from "./Loading";

interface ChurchRegistrationStep2Props {
  formData: ChurchFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFileReset: (name: "logo" | "contactImage") => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePrevStep: () => void;
  isLoading: boolean;
}

export default function ChurchRegistrationStep2({
  formData,
  handleInputChange,
  handleFileChange,
  handleFileReset,
  handleSubmit,
  handlePrevStep,
  isLoading,
}: ChurchRegistrationStep2Props) {
  const t = useTranslations();

  return (
    <motion.form
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          {t("superAdminEmail")}
          <span className="text-red-600"> *</span>
        </label>
        <input
          type="email"
          name="superAdminEmail"
          value={formData.superAdminEmail}
          onChange={handleInputChange}
          required
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
          placeholder={t("superAdminEmail")}
          aria-label={t("superAdminEmail")}
        />
      </div>
      <Input
        label={t("password")}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("password")}
      />
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
      <Select
        label={t("plan")}
        name="plan"
        options={[
          { value: "FREE", label: t("free") },
          // { value: "SMART", label: t("smart") },
          // { value: "ENTERPRISE", label: t("enterprise") },
        ]}
        value={formData.plan}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          {t("contactImage")}
          <span className="text-gray-500"> ({t("optional")})</span>
        </label>
        <input
          type="file"
          name="contactImage"
          accept="image/*"
          className="w-full p-3 border rounded-lg border-gray-300 shadow-sm bg-white text-gray-800 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-500 hover:file:bg-blue-100 transition-all duration-200"
          onChange={handleFileChange}
          aria-label={t("contactImage")}
        />
        {formData.contactImage && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <span className="truncate">{formData.contactImage.name}</span>
            <button
              type="button"
              className="cursor-pointer ml-2 text-red-600 hover:text-red-800 transition-colors"
              onClick={() => handleFileReset("contactImage")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={handlePrevStep}
          className="cursor-pointer px-6 py-2 bg-gray-600 text-white rounded-full font-medium text-sm hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {t("back")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 disabled:hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {isLoading ? <Loading /> : t("churchRegistration")}
        </Button>
      </div>
    </motion.form>
  );
}
