"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/components/Loading";

interface FormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
  position: string;
  churchName?: string;
  positionName?: string;
}

function SetChurchConfirm() {
  const t = useTranslations("setChurchConfirm");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const fetchChurchName = async () => {
      try {
        const [churchResponse, positionResponse] = await Promise.all([
          fetch(`/api/church/${encodeURIComponent(churchId)}`, {
            credentials: "include",
          }),
          fetch(`/api/position/${encodeURIComponent(position)}`, {
            credentials: "include",
          }),
        ]);

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
    router.push(`/${locale}/set-church`);
  };

  const clearError = () => setError(null);

  if (isAuthLoading || !user || !formData) {
    return null; // Suspense의 fallback이 로딩 UI를 처리함
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8 ring-1 ring-gray-100/50"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 text-center tracking-tight">
          {t("title")}
        </h1>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6 flex items-center justify-between bg-red-50 text-red-600 p-3 rounded-lg text-sm shadow-sm border border-red-100"
            >
              <span>{error}</span>
              <button
                onClick={clearError}
                className="hover:text-red-800 transition-colors duration-200"
                aria-label={t("dismissError")}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 bg-gray-50 p-4 rounded-xl shadow-inner">
          {[
            { label: t("country"), value: formData.country, icon: "🌍" },
            { label: t("city"), value: formData.city, icon: "🏙️" },
            { label: t("region"), value: formData.region, icon: "🗺️" },
            { label: t("church"), value: formData.churchName, icon: "⛪" },
            { label: t("position"), value: formData.positionName, icon: "👤" },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.value || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
          <Button onClick={handleBack} variant="outline">
            {t("back")}
          </Button>
          <Button onClick={handleConfirm} isDisabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
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
              <>{t("confirm")}</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SetChurchConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SetChurchConfirm />
    </Suspense>
  );
}
