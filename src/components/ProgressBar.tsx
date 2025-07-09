// src/components/ProgressBar.tsx
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
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">
        {label} ({remaining} / {max ?? t("infinity")})
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
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
