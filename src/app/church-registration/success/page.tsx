// src/app/church-registration/success/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6">{t("registrationComplete")}</h1>
        <p className="text-gray-700 mb-4">{t("waitForApproval")}</p>
        <p className="text-gray-700 mb-6">{t("approvalTime")}</p>
        <div className="flex justify-center">
          <Button onClick={() => router.push("/")}>{t("goToHome")}</Button>
        </div>
      </div>
    </div>
  );
}
