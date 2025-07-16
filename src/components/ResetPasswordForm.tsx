// src/components/ResetPasswordForm.tsx
"use client";

import { useTranslations } from "next-intl";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // src/components/ResetPasswordForm.tsx
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 비밀번호 강도 검증
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t("weakPassword")); // "비밀번호는 최소 8자이며, 문자와 숫자를 포함해야 합니다."
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    try {
      setIsDisabled(true);
      const response = await fetch("/api/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || t("serverError"));
        setIsDisabled(false);
        return;
      }

      setSuccess(t("passwordResetSuccess"));
      setIsDisabled(false);
    } catch (err) {
      setIsDisabled(false);
      setError(
        t("serverError", {
          error: err instanceof Error ? err.message : "알 수 없는 오류",
        })
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <p className="text-red-600 text-sm text-center">
            {t("invalidOrExpiredToken")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          {t("setNewPassword")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t("newPassword")}
            type="password"
            name="password"
            required
            disabled={isDisabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <Input
            label={t("confirmPassword")}
            type="password"
            name="confirmPassword"
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
            {t("resetPassword")}
          </Button>
        </form>
        {error && (
          <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="mt-4 text-green-600 text-sm text-center">
            {success}{" "}
            <Link
              href={`/${locale}/login`}
              className="text-blue-600 hover:underline font-medium"
            >
              {t("backToLogin")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
