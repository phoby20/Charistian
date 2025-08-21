// src/components/scores/MobileCardLayout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Setlists } from "@/types/score";
import Chip from "../Chip";

interface MobileCardLayoutProps {
  setlists: Setlists[];
  appUrl: string;
}

export default function MobileCardLayout({
  setlists,
  appUrl,
}: MobileCardLayoutProps) {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const [toast, setToast] = useState<{ id: string; message: string } | null>(
    null
  );

  // URL 복사 함수
  const copyToClipboard = (id: string) => {
    const proxyFileUrl: string = id
      ? `${appUrl}/api/proxy/setlist/${id}/file`
      : "#";
    navigator.clipboard.writeText(proxyFileUrl).then(() => {
      setToast({ id, message: t("urlCopied") });
      setTimeout(() => setToast(null), 3000); // 3초 후 토스트 제거
    });
  };

  return (
    <div className="block sm:hidden space-y-4 relative">
      {setlists.map((setlist) => (
        <motion.div
          key={setlist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <Link href={`/${locale}/setlists/${setlist.id}`}>
              <h2 className="text-lg font-semibold text-blue-600 hover:underline">
                {setlist.title}
              </h2>
            </Link>
            <button
              onClick={() => copyToClipboard(setlist.id)}
              className="text-[#fc089e] hover:text-[#fc089e]"
              aria-label={t("urlCopied")}
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {t("date")}:{" "}
            {new Date(setlist.date).toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-600">
            {t("createdAt")}:{" "}
            {new Date(setlist.createdAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-600">
            {t("creator")}: {setlist.creator.name}
          </p>
          <div className="mt-2">
            <p className="text-sm text-gray-600">{t("shareWith")}:</p>
            <div className="flex flex-wrap gap-1" role="list">
              {setlist.shares.length === 0 ? (
                <span className="text-gray-500">{t("noShares")}</span>
              ) : (
                setlist.shares.map((share) => (
                  <Chip
                    key={share.id}
                    label={
                      share.group?.name ||
                      share.team?.name ||
                      share.user?.name ||
                      ""
                    }
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Toast Popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg"
            role="alert"
            aria-live="polite"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
