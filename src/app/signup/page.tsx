"use client";

import { useTranslation } from "next-i18next";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { appWithTranslation } from "next-i18next";
import { citiesByCountry } from "@/data/cities";
import { regionsByCity } from "@/data/regions";
import { countryOptions } from "@/data/country";
import { X } from "lucide-react"; // Import icon for dismissible error

function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [churches, setChurches] = useState<{ value: string; label: string }[]>(
    []
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    email: "",
    password: "",
    phone: "",
    kakaoId: "",
    lineId: "",
    gender: "M",
    address: "",
    country: "",
    city: "",
    region: "",
    position: "",
    profileImage: undefined as File | undefined,
    churchId: "",
  });

  // 초기 설정: Country, City, Region 설정 (API 호출 X)
  useEffect(() => {
    if (countryOptions.length > 0 && isInitialLoad) {
      const defaultCountry = countryOptions[0].value || "";
      const defaultCity = citiesByCountry[defaultCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCountry(defaultCountry);
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        country: defaultCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      }));
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Country 변경 시 City와 Region 초기화
  useEffect(() => {
    if (selectedCountry && !isInitialLoad) {
      const defaultCity = citiesByCountry[selectedCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        country: selectedCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      }));
      setChurches([]);
    }
  }, [selectedCountry, isInitialLoad]);

  // City 변경 시 Region 초기화
  useEffect(() => {
    if (selectedCity && !isInitialLoad) {
      const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        city: selectedCity,
        region: defaultRegion,
        churchId: "",
      }));
      setChurches([]);
    }
  }, [selectedCity, isInitialLoad]);

  // Region 변경 시 Church 목록 가져오기 (초기 로딩 제외)
  useEffect(() => {
    const fetchChurches = async () => {
      if (selectedCountry && selectedCity && selectedRegion && !isInitialLoad) {
        try {
          const response = await fetch(
            `/api/churches/filter?country=${encodeURIComponent(
              selectedCountry
            )}&city=${encodeURIComponent(
              selectedCity
            )}&region=${encodeURIComponent(selectedRegion)}`
          );
          if (response.ok) {
            const data = await response.json();
            setChurches(
              data.map((church: { id: string; name: string }) => ({
                value: church.id,
                label: church.name,
              }))
            );
          } else {
            setChurches([]);
            setError(t("noChurchesFound"));
          }
        } catch (err) {
          console.error("Error fetching churches:", err);
          setChurches([]);
          setError(t("serverError"));
        }
      } else {
        setChurches([]);
      }
    };

    fetchChurches();
  }, [selectedRegion, isInitialLoad, selectedCountry, selectedCity]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setError(t("unsupportedFileType"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t("fileTooLarge"));
        return;
      }
      setFormData((prev) => ({ ...prev, profileImage: file }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (
      !formData.get("city") ||
      !formData.get("region") ||
      !formData.get("churchId")
    ) {
      setError(t("pleaseFillAllFields"));
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("signupFailed"));
        return;
      }

      router.push("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError(t("serverError"));
    }
  };

  const positions = [
    { value: "PASTOR", label: t("pastor") },
    { value: "EVANGELIST", label: t("evangelist") },
    { value: "DEACON", label: t("deacon") },
    { value: "ELDER", label: t("elder") },
  ];

  const clearError = () => setError(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300 transform hover:shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center tracking-tight">
          {t("signup")}
        </h1>
        {error && (
          <div className="mb-6 flex items-center justify-between bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm animate-fade-in">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="hover:text-red-800 dark:hover:text-red-100 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <div className="relative">
            <Input
              label={t("name")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("name")}
            />
          </div>
          <div className="relative">
            <Input
              label={t("birthDate")}
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Input
              label={t("email")}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("email")}
            />
          </div>
          <div className="relative">
            <Input
              label={t("password")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("password")}
            />
          </div>
          <div className="relative">
            <Input
              label={t("phone")}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("phone")}
            />
          </div>
          <div className="relative">
            <Input
              label={t("kakaoId")}
              name="kakaoId"
              value={formData.kakaoId}
              onChange={handleInputChange}
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("kakaoId")}
            />
          </div>
          <div className="relative">
            <Input
              label={t("lineId")}
              name="lineId"
              value={formData.lineId}
              onChange={handleInputChange}
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("lineId")}
            />
          </div>
          <div className="relative">
            <Select
              label={t("gender")}
              name="gender"
              options={[
                { value: "M", label: t("male") },
                { value: "F", label: t("female") },
              ]}
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="relative">
            <Input
              label={t("address")}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="peer w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-transparent"
              placeholder={t("address")}
            />
          </div>
          <div className="relative">
            <Select
              label={t("country")}
              name="country"
              options={countryOptions}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="relative">
            <Select
              label={t("city")}
              name="city"
              options={citiesByCountry[selectedCountry] || []}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="relative">
            <Select
              label={t("region")}
              name="region"
              options={regionsByCity[selectedCity] || []}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="relative">
            <Select
              label={t("church")}
              name="churchId"
              options={churches}
              value={formData.churchId}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="relative">
            <Select
              label={t("position")}
              name="position"
              options={positions}
              value={formData.position}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("profileImage")}{" "}
              <span className="text-gray-400">({t("optional")})</span>
            </label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 dark:file:bg-gray-600 file:text-blue-700 dark:file:text-gray-300 hover:file:bg-blue-100 dark:hover:file:bg-gray-500"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-center mt-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              {t("signup")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default appWithTranslation(SignupPage);
