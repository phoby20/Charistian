// src/app/[locale]/signup/complete/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Button from "@/components/Button";

export default function SignupCompletePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("signupComplete.title")}
        </h1>
        <p className="text-gray-600 mb-6">{t("signupComplete.message")}</p>
        <Link href={`/${locale}`}>
          <Button variant="primary" className="w-full">
            {t("signupComplete.goHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
