// src/app/[locale]/plans/success/page.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-4">결제 완료</h1>
        <p className="text-gray-600">{t("successMessage")}</p>
        <Link
          href={`/${locale}/dashboard`}
          className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          {t("goToDashboard")}
        </Link>
      </motion.div>
    </div>
  );
}
