"use client";

import { useLocale, useTranslations } from "next-intl";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      setIsDisabled(true);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(t("invalidCredentials"));
        setIsDisabled(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err) {
      setIsDisabled(false);
      setError(
        t("serverError", {
          error: err instanceof Error ? err.message : "Unknown error",
        })
      );
    }
  };

  const resetPasswordUrl = `/${locale}/reset-password`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          {t("login")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t("email")}
            type="email"
            name="email"
            required
            disabled={isDisabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <Input
            label={t("password")}
            type="password"
            name="password"
            required
            disabled={isDisabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <Button
            type="submit"
            isDisabled={isDisabled}
            className={`w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t("login")}
          </Button>
        </form>
        {error && (
          <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
        )}
        <div className="mt-4 text-sm text-center text-gray-600">
          <p>
            <Link
              href={resetPasswordUrl}
              className="text-blue-600 hover:underline font-medium"
            >
              {t("forgotPassword")}
            </Link>
          </p>
          <p className="mt-2">
            {t("noAccount")}{" "}
            <Link
              href={`/${locale}/terms-of-service?type=member`}
              className="text-blue-600 hover:underline font-medium"
            >
              {t("signupTitle")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
