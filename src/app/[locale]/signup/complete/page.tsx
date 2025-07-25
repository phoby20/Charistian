// src/app/[locale]/signup/complete/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Button from "@/components/Button";

export default function SignupCompletePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg animate-fade-in">
        <h1 className="text-xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
          {t("signupComplete.title")}
        </h1>
        <p className="text-gray-700 mb-4 text-base md:text-lg whitespace-pre text-center">
          {t("signupComplete.message")}
        </p>
        <p className="text-gray-700 mb-8 text-base md:text-lg whitespace-pre-wrap text-center">
          {t("signupComplete.verifyEmailMessage") ||
            "이메일로 전송된 인증 링크를 클릭하여 계정을 활성화해 주세요."}
        </p>

        <Link href={`/${locale}`}>
          <Button variant="primary">{t("signupComplete.goHome")}</Button>
        </Link>
      </div>
    </div>
  );
}
