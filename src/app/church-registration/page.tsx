// src/app/church/register/page.tsx
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
    const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
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

        // 가로 크기를 600px로 조정, 비율 유지
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
          0.8 // JPEG 품질 80%
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
          setError(`지원되지 않는 파일 형식입니다: ${files[0].type}`);
          return;
        }
        if (files[0].size > 5 * 1024 * 1024) {
          setError("파일 크기가 5MB를 초과했습니다.");
          return;
        }

        const resizedFile = await resizeImage(files[0]);
        setFormData((prev) => ({ ...prev, [name]: resizedFile }));
      } catch (error) {
        console.error("이미지 리사이즈 오류:", error);
        setError("이미지 처리 중 오류가 발생했습니다.");
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
      console.log("누락된 필드:", missingFields);
      setError(`${t("pleaseFillAllFields")}: ${missingFields.join(", ")}`);
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
        return;
      }

      router.push("/church-registration/success");
      setIsLoading(false);
    } catch (err) {
      console.error("등록 오류:", err);
      setError(t("serverError"));
    }
  };

  // 첫 번째 스텝: 교회 정보 입력
  const renderStep1 = () => (
    <form onSubmit={handleNextStep}>
      <Input
        label={t("churchName")}
        name="churchName"
        value={formData.churchName}
        onChange={handleInputChange}
        required
      />
      <Select
        label={t("country")}
        name="country"
        options={countryOptions}
        required
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
      />
      <Select
        label={t("city")}
        name="city"
        options={citiesByCountry[selectedCountry] || []}
        required
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
      />
      <Select
        label={t("region")}
        name="region"
        value={selectedRegion}
        options={regionsByCity[selectedCity] || []}
        onChange={(e) => setSelectedRegion(e.target.value)}
        required
      />
      <Input
        label={t("address")}
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        required
      />
      <Input
        label={t("churchPhone")}
        name="churchPhone"
        value={formData.churchPhone}
        onChange={handleInputChange}
        required
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("buildingImage")} ({t("optional")})
        </label>
        <input
          type="file"
          name="buildingImage"
          accept="image/*"
          className="mt-1"
          onChange={handleFileChange}
        />
        {formData.buildingImage && (
          <div className="mt-2 text-sm text-gray-600">
            {t("selectedFile")}: {formData.buildingImage.name}
            <button
              type="button"
              className="ml-2 text-red-600 hover:underline"
              onClick={() => handleFileReset("buildingImage")}
            >
              {t("remove")}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-4">
        <Button type="submit">{t("next")}</Button>
      </div>
    </form>
  );

  // 두 번째 스텝: 신청자 정보 입력
  const renderStep2 = () => (
    <form onSubmit={handleSubmit}>
      <Input
        label={t("superAdminEmail")}
        name="superAdminEmail"
        type="email"
        value={formData.superAdminEmail}
        onChange={handleInputChange}
        required
      />
      <Input
        label={t("password")}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange}
        required
      />
      <Input
        label={t("contactName")}
        name="contactName"
        value={formData.contactName}
        onChange={handleInputChange}
        required
      />
      <Input
        label={t("contactPhone")}
        name="contactPhone"
        value={formData.contactPhone}
        onChange={handleInputChange}
        required
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
      />
      <Input
        label={t("contactBirthDate")}
        type="date"
        name="contactBirthDate"
        value={formData.contactBirthDate}
        onChange={handleInputChange}
        required
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
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {t("contactImage")} ({t("optional")})
        </label>
        <input
          type="file"
          name="contactImage"
          accept="image/*"
          className="mt-1"
          onChange={handleFileChange}
        />
        {formData.contactImage && (
          <div className="mt-2 text-sm text-gray-600">
            {t("selectedFile")}: {formData.contactImage.name}
            <button
              type="button"
              className="ml-2 text-red-600 hover:underline"
              onClick={() => handleFileReset("contactImage")}
            >
              {t("remove")}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between space-x-4">
        <Button type="button" onClick={() => setStep(1)}>
          {t("back")}
        </Button>
        <Button type="submit">{t("churchRegistration")}</Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {isLoading && <Loading />}
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6">{t("churchRegistration")}</h1>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {t("step")} {step} {t("of")} 2
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>
        {step === 1 ? renderStep1() : renderStep2()}
        <Modal isOpen={!!error} onClose={() => setError(null)}>
          <p>{error}</p>
          <Button onClick={() => setError(null)}>{t("confirm")}</Button>
        </Modal>
      </div>
    </div>
  );
}
