"use client";

import { useTranslation } from "next-i18next";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { regionsByCity } from "@/data/regions";
import { citiesByCountry } from "@/data/cities";
import { countryOptions } from "@/data/country";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ChurchRegistrationPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    churchName: string;
    country: string;
    city: string;
    region: string;
    address: string;
    churchPhone: string;
    superAdminEmail: string;
    password: string;
    contactName: string;
    contactPhone: string;
    contactGender: string;
    contactBirthDate: string;
    plan: string;
    buildingImage?: File;
    contactImage?: File;
  }>({
    churchName: "",
    country: countryOptions[0].value,
    city: citiesByCountry[countryOptions[0].value][0].value,
    region:
      regionsByCity[citiesByCountry[countryOptions[0].value][0].value][0].value,
    address: "",
    churchPhone: "",
    superAdminEmail: "",
    password: "",
    contactName: "",
    contactPhone: "",
    contactGender: "M",
    contactBirthDate: "",
    plan: "FREE",
    buildingImage: undefined,
    contactImage: undefined,
  });
  const [selectedCountry, setSelectedCountry] = useState<string>(
    countryOptions[0].value
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    citiesByCountry[countryOptions[0].value][0].value
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(
    regionsByCity[citiesByCountry[countryOptions[0].value][0].value][0].value
  );

  // country 변경 시 city와 region 초기화
  useEffect(() => {
    const defaultCity = citiesByCountry[selectedCountry][0]?.value || "";
    setSelectedCity(defaultCity);
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
      city: defaultCity,
    }));
  }, [selectedCountry]);

  // city 변경 시 region 초기화
  useEffect(() => {
    const defaultRegion = regionsByCity[selectedCity][0]?.value || "";
    setSelectedRegion(defaultRegion);
    setFormData((prev) => ({
      ...prev,
      city: selectedCity,
      region: defaultRegion,
    }));
  }, [selectedCity]);

  // formData 업데이트
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 이미지 리사이즈 함수
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context를 가져올 수 없습니다."));
          return;
        }

        const maxWidth = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("이미지 변환에 실패했습니다."));
            }
          },
          file.type,
          0.8
        );
      };
      img.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // 파일 입력 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      try {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(files[0].type)) {
          setError(t("unsupportedFileType"));
          return;
        }
        if (files[0].size > 5 * 1024 * 1024) {
          setError(t("fileTooLarge"));
          return;
        }

        const resizedFile = await resizeImage(files[0]);
        setFormData((prev) => ({ ...prev, [name]: resizedFile }));
      } catch (error) {
        console.error("이미지 리사이즈 오류:", error);
        setError(t("imageProcessingError"));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 파일 입력 초기화
  const handleFileReset = (name: "buildingImage" | "contactImage") => {
    setFormData((prev) => ({ ...prev, [name]: undefined }));
  };

  // 첫 번째 스텝에서 다음 버튼 클릭 시
  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (
      !formData.churchName ||
      !formData.country ||
      !formData.city ||
      !formData.region ||
      !formData.address ||
      !formData.churchPhone
    ) {
      setError(t("pleaseFillAllFields"));
      return;
    }
    setStep(2);
  };

  // 두 번째 스텝에서 제출
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const missingFields: string[] = [];
    if (!formData.superAdminEmail) missingFields.push(t("superAdminEmail"));
    if (!formData.password) missingFields.push(t("password"));
    if (!formData.contactName) missingFields.push(t("contactName"));
    if (!formData.contactPhone) missingFields.push(t("contactPhone"));
    if (!formData.contactGender) missingFields.push(t("contactGender"));
    if (!formData.contactBirthDate) missingFields.push(t("contactBirthDate"));
    if (!formData.plan) missingFields.push(t("plan"));

    if (missingFields.length > 0) {
      setError(`${t("pleaseFillAllFields")}: ${missingFields.join(", ")}`);
      setIsLoading(false);
      return;
    }

    const submitData = new FormData();
    const keys: (keyof typeof formData)[] = [
      "churchName",
      "country",
      "city",
      "region",
      "address",
      "churchPhone",
      "superAdminEmail",
      "password",
      "contactName",
      "contactPhone",
      "contactGender",
      "contactBirthDate",
      "plan",
      "buildingImage",
      "contactImage",
    ];
    keys.forEach((key) => {
      const value = formData[key];
      if (value !== undefined) {
        submitData.append(key, value);
      }
    });

    try {
      const response = await fetch("/api/church/register", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || t("registrationFailed"));
        setIsLoading(false);
        return;
      }

      router.push("/church-registration/success");
    } catch (err) {
      console.error("등록 오류:", err);
      setError(t("serverError"));
      setIsLoading(false);
    }
  };

  // 첫 번째 스텝: 교회 정보 입력
  const renderStep1 = () => (
    <motion.form
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
          setFormData((prev) => ({ ...prev, region: value }));
        }}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      />
      <Input
        label={t("address")}
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("address")}
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
          {t("buildingImage")}
          <span className="text-gray-500"> ({t("optional")})</span>
        </label>
        <input
          type="file"
          name="buildingImage"
          accept="image/*"
          className="w-full p-3 border rounded-lg border-gray-300 shadow-sm bg-white text-gray-800 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-500 hover:file:bg-blue-100 transition-all duration-200"
          onChange={handleFileChange}
          aria-label={t("buildingImage")}
        />
        {formData.buildingImage && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <span className="truncate">{formData.buildingImage.name}</span>
            <button
              type="button"
              className="ml-2 text-red-600 hover:text-red-800 transition-colors"
              onClick={() => handleFileReset("buildingImage")}
              aria-label={t("removeBuildingImage")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {t("next")}
        </Button>
      </div>
    </motion.form>
  );

  // 두 번째 스텝: 신청자 정보 입력
  const renderStep2 = () => (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label={t("superAdminEmail")}
        name="superAdminEmail"
        type="email"
        value={formData.superAdminEmail}
        onChange={handleInputChange}
        required
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
        placeholder={t("superAdminEmail")}
      />
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
          { value: "SMART", label: t("smart") },
          { value: "ENTERPRISE", label: t("enterprise") },
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
              className="ml-2 text-red-600 hover:text-red-800 transition-colors"
              onClick={() => handleFileReset("contactImage")}
              aria-label={t("removeContactImage")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-2 bg-gray-600 text-white rounded-full font-medium text-sm hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {t("back")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 disabled:hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-4 w-4 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-50"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-100"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              {t("submitting")}
            </span>
          ) : (
            t("churchRegistration")
          )}
        </Button>
      </div>
    </motion.form>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6"
    >
      {isLoading && <Loading />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-8 sm:p-10"
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center tracking-tight">
          {t("churchRegistration")}
        </h1>
        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center">
            {t("step")} {step} {t("of")} 2
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: step === 1 ? "50%" : "100%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {step === 1 ? renderStep1() : renderStep2()}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <Modal isOpen={!!error}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-lg p-6 max-w-sm mx-auto"
              >
                <p className="text-gray-800 text-sm mb-4">{error}</p>
                <Button
                  onClick={() => setError(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 transition-all duration-200"
                >
                  {t("confirm")}
                </Button>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
