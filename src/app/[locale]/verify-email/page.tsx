"use client";

import { useTranslations } from "next-intl";
import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { X } from "lucide-react";
import Loading from "@/components/Loading";

export default function VerifyEmailPage() {
  const t = useTranslations("verifyEmail");
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/verify-email/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("submitFailed"));
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(t("emailSent"));
      setEmail("");
      setIsSubmitting(false);
    } catch (err) {
      console.error("Email registration error:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  if (authLoading || !user) {
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
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-12"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 text-center tracking-tight">
          {t("title")}
        </h1>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-between bg-red-50 text-red-600 p-4 rounded-lg text-sm"
            >
              <span>{error}</span>
              <button
                onClick={clearError}
                className="hover:text-red-800 transition-colors"
                aria-label={t("dismissError")}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-between bg-green-50 text-green-600 p-4 rounded-lg text-sm"
            >
              <span>{successMessage}</span>
              <button
                onClick={clearSuccess}
                className="hover:text-green-800 transition-colors"
                aria-label={t("dismissSuccess")}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t("email")}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("emailPlaceholder")}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:bg-scale-100 disabled:hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
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
              t("sendVerification")
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
