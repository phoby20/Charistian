"use client";

import { useTranslations } from "next-intl";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { useState, useEffect } from "react";
import { citiesByCountry } from "@/data/cities";
import { regionsByCity } from "@/data/regions";
import { countryOptions } from "@/data/country";
import { X } from "lucide-react";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";

interface FormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
}

export default function SignupPage() {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [churches, setChurches] = useState<{ value: string; label: string }[]>(
    []
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    country: "",
    city: "",
    region: "",
    churchId: "",
  });

  // 초기 설정: 기본값 설정, localStorage 무시
  useEffect(() => {
    if (countryOptions.length > 0 && isInitialLoad) {
      const defaultCountry = countryOptions[0].value || "";
      const defaultCity = citiesByCountry[defaultCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCountry(defaultCountry);
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setFormData({
        country: defaultCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      });
    }
    setIsInitialLoad(false);
  }, [isInitialLoad]);

  // 국가 변경: 도시, 지역, 교회 초기화
  useEffect(() => {
    if (selectedCountry && !isInitialLoad) {
      const defaultCity = citiesByCountry[selectedCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setFormData({
        country: selectedCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      });
      setChurches([]);
      if (!citiesByCountry[selectedCountry]?.length) {
        setError(t("noCitiesAvailable"));
      }
    }
  }, [selectedCountry, isInitialLoad, t]);

  // 도시 변경: 지역, 교회 초기화
  useEffect(() => {
    if (selectedCity && !isInitialLoad) {
      const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setFormData((prev) => ({
        ...prev,
        city: selectedCity,
        region: defaultRegion,
        churchId: "",
      }));
      setChurches([]);
      if (!regionsByCity[selectedCity]?.length) {
        setError(t("noRegionsAvailable"));
      }
    }
  }, [selectedCity, isInitialLoad, t]);

  // 지역 변경: 교회 목록 가져오기
  useEffect(() => {
    if (isInitialLoad) return;

    const fetchChurches = async () => {
      if (selectedCountry && selectedCity && selectedRegion) {
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
            const churchOptions = data.map(
              (church: { id: string; name: string }) => ({
                value: church.id,
                label: church.name,
              })
            );
            setChurches(churchOptions);
            const defaultChurch = churchOptions[0]?.value || "";
            setSelectedChurch(defaultChurch);
            setFormData((prev) => ({
              ...prev,
              churchId: defaultChurch,
            }));
          } else {
            setChurches([]);
            setError(t("noChurchesFound"));
          }
        } catch (err) {
          console.error("교회 목록 가져오기 오류:", err);
          setChurches([]);
          setError(t("serverError"));
        }
      } else {
        setChurches([]);
      }
    };

    fetchChurches();
  }, [selectedRegion, isInitialLoad, selectedCountry, selectedCity, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 검증
    if (!formData.country) {
      setError(t("pleaseFillCountryFields"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.city) {
      setError(t("pleaseFillCityFields"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.region) {
      setError(t("pleaseFillRegionFields"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.churchId) {
      setError(t("pleaseFillChurchFields"));
      setIsSubmitting(false);
      return;
    }

    try {
      localStorage.setItem("signupFormData", JSON.stringify(formData));
      router.push("/signup/details");
    } catch (err) {
      console.error("페이지 이동 오류:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 sm:p-6"
    >
      {isSubmitting || isInitialLoad ? (
        <Loading />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 sm:p-10"
        >
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">
            {t("signup.signupTitle")}
          </h1>
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center">
              1 {t("step")} {t("of")} 2
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <motion.div
                className="bg-[#fc089e] h-2 rounded-full"
                initial={{ width: "50%" }}
                animate={{ width: "50%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6 flex items-center justify-between bg-red-100 text-red-700 p-4 rounded-xl text-sm font-medium"
              >
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="hover:text-red-900 transition-colors duration-200"
                  aria-label={t("signup.dismissError")}
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label={t("country")}
              name="country"
              options={countryOptions}
              value={selectedCountry}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedCountry(value);
                setFormData((prev) => ({ ...prev, country: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("signup.city")}
              name="city"
              options={citiesByCountry[selectedCountry] || []}
              value={selectedCity}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedCity(value);
                setFormData((prev) => ({ ...prev, city: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("signup.region")}
              name="region"
              options={regionsByCity[selectedCity] || []}
              value={selectedRegion}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedRegion(value);
                setFormData((prev) => ({ ...prev, region: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("signup.church")}
              name="churchId"
              options={churches}
              value={selectedChurch}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedChurch(value);
                setFormData((prev) => ({ ...prev, churchId: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <div className="flex justify-center mt-8">
              <Button
                type="submit"
                isDisabled={isSubmitting || !selectedChurch}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    {t("submitting")}
                  </span>
                ) : (
                  t("next")
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}
