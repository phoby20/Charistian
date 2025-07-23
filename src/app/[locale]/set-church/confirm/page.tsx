"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { useSearchParams } from "next/navigation";

interface FormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
  position: string;
  churchName?: string; // 교회 이름 표시용
  positionName?: string; // 교회 이름 표시용
}

export default function SetChurchConfirmPage() {
  const t = useTranslations("setChurchConfirm");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 쿼리 파라미터로 데이터 가져오기 및 교회 이름 조회
  useEffect(() => {
    if (isAuthLoading || !user) return;

    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";
    const region = searchParams.get("region") || "";
    const churchId = searchParams.get("churchId") || "";
    const position = searchParams.get("position") || "";

    if (!country || !city || !region || !churchId || !position) {
      setError(t("missingFields"));
      return;
    }

    // 교회 이름 조회
    const fetchChurchName = async () => {
      try {
        const churchResponse = await fetch(
          `/api/church/${encodeURIComponent(churchId)}`,
          {
            credentials: "include",
          }
        );
        const positionResponse = await fetch(
          `/api/position/${encodeURIComponent(position)}`,
          {
            credentials: "include",
          }
        );
        if (churchResponse.ok && positionResponse.ok) {
          const church = await churchResponse.json();
          const positionName = await positionResponse.json();
          setFormData({
            country,
            city,
            region,
            churchId,
            position,
            churchName: church.name || "Unknown Church",
            positionName: positionName.name || "Unknown Position",
          });
        } else {
          setError(t("churchNotFound"));
        }
      } catch (err) {
        console.error("Error fetching church name:", err);
        setError(t("serverError"));
      }
    };

    fetchChurchName();
  }, [isAuthLoading, user, searchParams, t]);

  const handleConfirm = async () => {
    if (!formData || !user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/set-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
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
      console.error("Error confirming church and position:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push(`/set-church`);
  };

  const clearError = () => setError(null);

  if (isAuthLoading || !user || !formData) {
    return <Loading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 sm:p-6"
    >
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

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <p className="font-bold text-gray-700">{t("country")}</p>
            <p className="text-base text-gray-900">{formData.country}</p>
          </div>
          <div className="flex gap-4 items-center">
            <p className="font-bold text-gray-700">{t("city")}</p>
            <p className="text-base text-gray-900">{formData.city}</p>
          </div>
          <div className="flex gap-4 items-center">
            <p className="font-bold text-gray-700">{t("region")}</p>
            <p className="text-base text-gray-900">{formData.region}</p>
          </div>
          <div className="flex gap-4 items-center">
            <p className="font-bold text-gray-700">{t("church")}</p>
            <p className="text-base text-gray-900">{formData.churchName}</p>
          </div>
          <div className="flex gap-4 items-center">
            <p className="font-bold text-gray-700">{t("position")}</p>
            <p className="text-base text-gray-900">{formData.positionName}</p>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            onClick={handleBack}
            className="cursor-pointer w-full sm:w-1/2 mr-2 px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold text-base hover:bg-gray-600 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {t("back")}
          </Button>
          <Button
            onClick={handleConfirm}
            isDisabled={isSubmitting}
            className="cursor-pointer w-full sm:w-1/2 ml-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 hover:scale-105 disabled:bg-gray-300 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
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
              t("confirm")
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
