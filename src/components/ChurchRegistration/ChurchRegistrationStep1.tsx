// src/components/ChurchRegistration/ChurchRegistrationStep1.tsx
"use client";

import { useTranslations } from "next-intl";
import { FormEvent } from "react";
import { motion } from "framer-motion";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { ChurchFormData } from "@/types/church";
import { regionsByCity } from "@/data/regions";
import { citiesByCountry } from "@/data/cities";
import { countryOptions } from "@/data/country";
import { X } from "lucide-react";

interface ChurchRegistrationStep1Props {
  formData: ChurchFormData;
  selectedCountry: string;
  selectedCity: string;
  selectedRegion: string;
  setSelectedCountry: (value: string) => void;
  setSelectedCity: (value: string) => void;
  setSelectedRegion: (value: string) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFileReset: (name: "logo" | "contactImage") => void;
  handleNextStep: (e: FormEvent) => void;
}

export default function ChurchRegistrationStep1({
  formData,
  selectedCountry,
  selectedCity,
  selectedRegion,
  setSelectedCountry,
  setSelectedCity,
  setSelectedRegion,
  handleInputChange,
  handleFileChange,
  handleFileReset,
  handleNextStep,
}: ChurchRegistrationStep1Props) {
  const t = useTranslations("churchRegistration");

  // 모든 필수 입력 필드가 채워졌는지 확인
  const isFormFilled =
    formData.churchName.trim() !== "" &&
    formData.country !== "" &&
    formData.city !== "" &&
    formData.region !== "" &&
    formData.address.trim() !== "" &&
    formData.churchPhone.trim() !== "";

  return (
    <motion.form
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleNextStep}
      className="space-y-4"
    >
      <Input
        label={t("churchName")}
        name="churchName"
        value={formData.churchName}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("churchName")}
      />
      <Select
        label={t("country")}
        name="country"
        options={countryOptions}
        required
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <Select
        label={t("city")}
        name="city"
        options={citiesByCountry[selectedCountry] || []}
        required
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <Select
        label={t("region")}
        name="region"
        value={selectedRegion}
        options={regionsByCity[selectedCity] || []}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedRegion(value);
          handleInputChange(e);
        }}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <Input
        label={t("churchAddress")}
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("churchAddress")}
      />
      <Input
        label={t("churchPhone")}
        name="churchPhone"
        value={formData.churchPhone}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("churchPhone")}
      />
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">
          {t("logo")}
          <span className="text-gray-500"> ({t("optional")})</span>
        </label>
        <input
          type="file"
          name="logo"
          accept="image/*"
          className="w-full p-3 border rounded-lg border-gray-300 shadow-sm bg-white text-gray-800 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-500 hover:file:bg-blue-100 transition-all duration-200"
          onChange={handleFileChange}
          aria-label={t("logo")}
        />
        {formData.logo && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <span className="truncate">{formData.logo.name}</span>
            <button
              type="button"
              className="ml-2 text-red-600 hover:text-red-800 transition-colors"
              onClick={() => handleFileReset("logo")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" isDisabled={!isFormFilled}>
          {t("next")}
        </Button>
      </div>
    </motion.form>
  );
}
