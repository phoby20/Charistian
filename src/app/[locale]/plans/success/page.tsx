// src/app/[locale]/plans/success/page.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();

  // 체크 아이콘 애니메이션
  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeInOut" as const },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100"
      >
        {/* 성공 아이콘 */}
        <motion.svg
          className="w-16 h-16 mx-auto mb-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial="hidden"
          animate="visible"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
            variants={checkVariants}
          />
        </motion.svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          {t("successTitle")}
        </h1>
        <p className="text-gray-600 text-base mb-6 whitespace-pre-wrap leading-relaxed">
          {t("successMessage")}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          aria-label={t("goToDashboard")}
        >
          {t("goToDashboard")}
        </Link>
      </motion.div>
    </div>
  );
}
