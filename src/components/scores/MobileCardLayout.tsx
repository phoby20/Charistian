"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Setlists } from "@/types/score";
import Chip from "../Chip";

interface MobileCardLayoutProps {
  setlists: Setlists[];
}

export default function MobileCardLayout({ setlists }: MobileCardLayoutProps) {
  const t = useTranslations("Setlist");
  const locale = useLocale();

  return (
    <div className="block sm:hidden space-y-4">
      {setlists.map((setlist) => (
        <motion.div
          key={setlist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
        >
          <Link href={`/${locale}/setlists/${setlist.id}`}>
            <h2 className="text-lg font-semibold text-blue-600 hover:underline">
              {setlist.title}
            </h2>
          </Link>
          <p className="text-sm text-gray-600">
            {t("date")}:{" "}
            {new Date(setlist.date).toLocaleDateString(locale, {
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
    </div>
  );
}
