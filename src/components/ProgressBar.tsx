"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface ProgressBarProps {
  label: string;
  remaining: number;
  max: number | null;
  color: string;
}

export default function ProgressBar({
  label,
  remaining,
  max,
  color,
}: ProgressBarProps) {
  const t = useTranslations();
  const customMax = max ? max : remaining ** 2 / 2;

  // color prop에 따라 같은 계열의 다른 톤으로 그라데이션 클래스 동적 생성
  const gradientClass = (() => {
    switch (color) {
      case "bg-blue-500":
        return "bg-gradient-to-r from-blue-500 to-red-500";
      case "bg-green-500":
        return "bg-gradient-to-r from-green-500 to-red-500";
      case "bg-orange-500":
        return "bg-gradient-to-r from-yellow-500 to-red-500";
      case "bg-purple-500":
        return "bg-gradient-to-r from-purple-500 to-red-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-800"; // 기본값
    }
  })();

  return (
    <div className="flex justify-center flex-col">
      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
        {label} ({remaining}/{max ?? t("infinity")})
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${gradientClass}`}
          initial={{ width: 0 }}
          animate={{
            width: `${customMax > 0 ? (remaining / customMax) * 100 : 0}%`,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
