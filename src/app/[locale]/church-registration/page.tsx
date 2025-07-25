// src/app/[locale]/church-registration/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";
import { useRouter } from "@/utils/useRouter";
import { ChurchFormData } from "@/types/church";
import { regionsByCity } from "@/data/regions";
import { citiesByCountry } from "@/data/cities";
import { countryOptions } from "@/data/country";
import ChurchRegistrationStep1 from "@/components/ChurchRegistrationStep1";
import ChurchRegistrationStep2 from "@/components/ChurchRegistrationStep2";
import Button from "@/components/Button";

export default function ChurchRegistrationPage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ChurchFormData>({
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
    logo: undefined,
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
      region: regionsByCity[defaultCity]?.[0]?.value || "",
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

  // 입력 변경 처리
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
  const handleFileReset = (name: "logo" | "contactImage") => {
    setFormData((prev) => ({ ...prev, [name]: undefined }));
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

  const handlePrevStep = () => {
    setStep(1);
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
    const keys: (keyof ChurchFormData)[] = [
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
      "logo",
      "contactImage",
    ];
    keys.forEach((key) => {
      const value = formData[key];
      if (value !== undefined) {
        submitData.append(key, value as string | Blob);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 sm:p-6"
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
          {step === 1 ? (
            <ChurchRegistrationStep1
              formData={formData}
              selectedCountry={selectedCountry}
              selectedCity={selectedCity}
              selectedRegion={selectedRegion}
              setSelectedCountry={setSelectedCountry}
              setSelectedCity={setSelectedCity}
              setSelectedRegion={setSelectedRegion}
              handleInputChange={handleInputChange}
              handleFileChange={handleFileChange}
              handleFileReset={handleFileReset}
              handleNextStep={handleNextStep}
            />
          ) : (
            <ChurchRegistrationStep2
              formData={formData}
              handleInputChange={handleInputChange}
              handleFileChange={handleFileChange}
              handleFileReset={handleFileReset}
              handleSubmit={handleSubmit}
              handlePrevStep={handlePrevStep}
              isLoading={isLoading}
            />
          )}
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
                  className="cursor-pointer w-full px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 transition-all duration-200"
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
