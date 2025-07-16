"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Button from "@/components/Button";

export default function VerifyCompletePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg animate-fade-in">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-4 text-center">
          {t("verifyComplete.title") || "이메일 인증 완료"}
        </h1>
        <p className="text-gray-700 mb-4 text-base md:text-lg whitespace-pre-wrap text-center">
          {t("verifyComplete.message") ||
            "이메일 인증이 성공적으로 완료되었습니다. 이제 계정을 사용할 수 있습니다."}
        </p>
        <Link href={`/${locale}`}>
          <Button
            variant="primary"
            className="cursor-pointer w-full bg-gradient-to-r from-[#ff66c4] to-[#ffde59] py-2 rounded-lg hover:from-[#ffde59] hover:to-[#ff66c4] transition duration-300"
          >
            {t("verifyComplete.goHome") || "홈으로 이동"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
