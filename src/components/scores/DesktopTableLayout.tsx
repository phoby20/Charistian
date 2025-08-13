// src/components/scores/DesktopTableLayout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Setlists } from "@/types/score";
import Chip from "../Chip";

interface DesktopTableLayoutProps {
  setlists: Setlists[];
}

export default function DesktopTableLayout({
  setlists,
}: DesktopTableLayoutProps) {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const [toast, setToast] = useState<{ id: string; message: string } | null>(
    null
  );

  // URL 복사 함수
  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setToast({ id, message: t("urlCopied") });
      setTimeout(() => setToast(null), 3000); // 3초 후 토스트 제거
    });
  };

  return (
    <div className="relative">
      <table className="hidden sm:table w-full border-collapse bg-white rounded-xl shadow-lg">
        <thead className="bg-gray-50">
          <tr>
            <th></th>
            <th className="text-left w-40 py-4 px-6 text-sm font-semibold text-gray-700">
              {t("date")}
            </th>
            <th className="text-left w-50 py-4 px-6 text-sm font-semibold text-gray-700">
              {t("title")}
            </th>
            <th className="text-left w-40 py-4 px-6 text-sm font-semibold text-gray-700">
              {t("creator")}
            </th>
            <th className="text-left w-40 py-4 px-6 text-sm font-semibold text-gray-700">
              {t("createdAt")}
            </th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
              {t("shareWith")}
            </th>
          </tr>
        </thead>
        <tbody>
          {setlists.map((setlist) => (
            <motion.tr
              key={setlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="py-4 px-6 text-sm text-gray-600">
                <button
                  onClick={() => copyToClipboard(setlist.fileUrl, setlist.id)}
                  className="text-[#fc089e] hover:text-[#ff66c4] transition-colors cursor-pointer"
                  aria-label={t("urlCopied")}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                {new Date(setlist.date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                <Link href={`/${locale}/setlists/${setlist.id}`}>
                  <span className="text-blue-600 hover:underline">
                    {setlist.title}
                  </span>
                </Link>
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                {setlist.creator.name}
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                {new Date(setlist.createdAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
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
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

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
