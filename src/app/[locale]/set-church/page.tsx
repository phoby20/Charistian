// src/app/[locale]/set-church/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { useState, useEffect } from "react";
import { citiesByCountry } from "@/data/cities";
import { X } from "lucide-react";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";
import { useAuth } from "@/context/AuthContext";
import { countryOptions } from "@/data/country";
import { regionsByCity } from "@/data/regions";

interface FormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
  position: string;
}

interface Church {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

export default function SetChurchPage() {
  const t = useTranslations("setChurch");
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [churches, setChurches] = useState<{ value: string; label: string }[]>(
    []
  );
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    country: "",
    city: "",
    region: "",
    churchId: "",
    position: "",
  });

  // 초기 데이터 설정
  useEffect(() => {
    if (isAuthLoading || !user) return;

    if (user.churchId) {
      // 이미 churchId가 있으면 대시보드로 리다이렉트
      router.push(`/${locale}/dashboard`);
      return;
    }

    if (countryOptions.length > 0 && isInitialLoad) {
      const defaultCountry = countryOptions[0].value || "";
      const defaultCity = citiesByCountry[defaultCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCountry(defaultCountry);
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setSelectedPosition("");
      setFormData({
        country: defaultCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      });
      setIsInitialLoad(false);
    }
  }, [isAuthLoading, user, locale, router, isInitialLoad]);

  // 국가 변경 시 도시, 지역, 교회 초기화
  useEffect(() => {
    if (selectedCountry && !isInitialLoad) {
      const defaultCity = citiesByCountry[selectedCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setSelectedPosition("");
      setFormData({
        country: selectedCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      });
      setChurches([]);
      setPositions([]);
      if (!citiesByCountry[selectedCountry]?.length) {
        setError(t("noCitiesAvailable"));
      }
    }
  }, [selectedCountry, isInitialLoad, t]);

  // 도시 변경 시 지역, 교회 초기화
  useEffect(() => {
    if (selectedCity && !isInitialLoad) {
      const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setSelectedPosition("");
      setFormData((prev) => ({
        ...prev,
        city: selectedCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      }));
      setChurches([]);
      setPositions([]);
      if (!regionsByCity[selectedCity]?.length) {
        setError(t("noRegionsAvailable"));
      }
    }
  }, [selectedCity, isInitialLoad, t]);

  // 지역 변경 시 교회 목록 가져오기
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
            )}&region=${encodeURIComponent(selectedRegion)}`,
            { credentials: "include" }
          );
          if (response.ok) {
            const data: Church[] = await response.json();
            const churchOptions = data.map((church) => ({
              value: church.id,
              label: church.name,
            }));
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
          console.error("Error fetching churches:", err);
          setChurches([]);
          setError(t("serverError"));
        }
      } else {
        setChurches([]);
      }
    };

    fetchChurches();
  }, [selectedRegion, isInitialLoad, selectedCountry, selectedCity, t]);

  // 교회 변경 시 포지션 목록 가져오기
  useEffect(() => {
    const fetchPositions = async () => {
      if (selectedChurch) {
        try {
          const response = await fetch(
            `/api/churches/${encodeURIComponent(selectedChurch)}/positions`,
            { credentials: "include" }
          );
          if (response.ok) {
            const data: Position[] = await response.json();
            const positionOptions = data.map((position) => ({
              value: position.id,
              label: position.name,
            }));
            positionOptions.push({
              value: "MEMBER",
              label: t("member"),
            });
            setPositions(positionOptions);
            const defaultPosition = positionOptions[0]?.value || "MEMBER";
            setSelectedPosition(defaultPosition);
            setFormData((prev) => ({
              ...prev,
              position: defaultPosition,
            }));
          } else {
            setPositions([{ value: "MEMBER", label: t("member") }]);
            setSelectedPosition("MEMBER");
            setFormData((prev) => ({ ...prev, position: "MEMBER" }));
            setError(t("noPositionsFound"));
          }
        } catch (err) {
          console.error("Error fetching positions:", err);
          setPositions([{ value: "MEMBER", label: t("member") }]);
          setSelectedPosition("MEMBER");
          setFormData((prev) => ({ ...prev, position: "MEMBER" }));
          setError(t("serverError"));
        }
      } else {
        setPositions([{ value: "MEMBER", label: t("member") }]);
        setSelectedPosition("MEMBER");
        setFormData((prev) => ({ ...prev, position: "MEMBER" }));
      }
    };

    fetchPositions();
  }, [selectedChurch, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 유효성 검사
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
    if (!formData.position) {
      setError(t("pleaseFillPositionFields"));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/set-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user?.id,
          churchId: formData.churchId,
          position: formData.position,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("serverError"));
        setIsSubmitting(false);
        return;
      }

      window.location.href = `/${locale}/dashboard`;
    } catch (err) {
      console.error("Error updating church and position:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  if (isAuthLoading || !user) {
    return <Loading />;
  }

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
          <h1 className="text-xl font-bold text-gray-900 mb-8 text-center">
            {t("title")}
          </h1>
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
                  aria-label={t("dismissError")}
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
              label={t("city")}
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
              label={t("region")}
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
              label={t("church")}
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
            <Select
              label={t("position")}
              name="position"
              options={positions}
              value={selectedPosition}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedPosition(value);
                setFormData((prev) => ({ ...prev, position: value }));
              }}
              required
              disabled={!selectedChurch || positions.length === 0}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
            />
            <div className="flex justify-center mt-8">
              <Button
                type="submit"
                isDisabled={
                  isSubmitting || !selectedChurch || !selectedPosition
                }
                className="cursor-pointer w-full sm:w-1/2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 hover:scale-105 disabled:bg-gray-300 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
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
                  t("submit")
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}
