// src/app/[locale]/login/page.tsx
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
      setIsDisabled(true); // 제출 시 비활성화
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(t("invalidCredentials"));
        setIsDisabled(false); // 에러 발생 시 다시 활성화
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err) {
      setIsDisabled(false); // 에러 발생 시 다시 활성화
      setError(
        t("serverError", {
          error: err instanceof Error ? err.message : "Unknown error",
        })
      );
    }
  };

  const signUpUrl = `/${locale}/signup`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">{t("login")}</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label={t("email")}
            type="email"
            name="email"
            required
            disabled={isDisabled} // Input에 disabled 속성 추가
          />
          <Input
            label={t("password")}
            type="password"
            name="password"
            required
            disabled={isDisabled} // Input에 disabled 속성 추가
          />
          <Button type="submit" isDisabled={isDisabled}>
            {t("login")}
          </Button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
        <div className="mt-4 text-sm text-center">
          <p>
            {t("noAccount")}{" "}
            <Link href={signUpUrl} className="text-blue-600 hover:underline">
              {t("signupTitle")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
