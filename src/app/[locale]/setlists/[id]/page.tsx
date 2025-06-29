// src/app/[locale]/setlists/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowLeft, Edit, Eye } from "lucide-react"; // Eye 아이콘 추가
import Loading from "@/components/Loading";
import { format } from "date-fns";
import { ko, ja } from "date-fns/locale";

import { SetlistResponse } from "@/types/score";
import Chip from "@/components/Chip";
import { getDisplayTitle } from "@/utils/getDisplayTitle";

export default function SetlistDetailPage() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const { id } = useParams();
  const { user } = useAuth();
  const [setlist, setSetlist] = useState<SetlistResponse | null>(null);
  const [appUrl, setAppUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLocale = locale === "ko" ? ko : ja;

  useEffect(() => {
    const fetchSetlist = async () => {
      try {
        if (typeof id !== "string") {
          throw new Error(t("invalidId"));
        }
        const response = await fetch(`/api/setlists/${id}`);

        if (!response.ok) {
          throw new Error((await response.json()).error || t("fetchError"));
        }
        const data = await response.json();
        setSetlist(data.setlist);
        setAppUrl(data.appUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("fetchError"));
      }
    };
    fetchSetlist();
  }, [id, t]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !user) return;
    setIsSubmitting(true);

    try {
      if (typeof id !== "string") {
        throw new Error(t("invalidId"));
      }
      const response = await fetch(`/api/setlists/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment, userId: user.id }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || t("commentError"));
      }
      const newComment = await response.json();
      setSetlist((prev) =>
        prev ? { ...prev, comments: [newComment, ...prev.comments] } : null
      );
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("commentError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit =
    user &&
    (user.id === setlist?.creatorId ||
      ["SUPER_ADMIN", "ADMIN"].includes(user.role));

  // 프록시 URL 생성
  const proxyFileUrl = setlist?.id
    ? `${appUrl}/api/proxy/setlist/${setlist.id}/file`
    : "#";

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-6 max-w-md w-full"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-lg font-semibold">{error}</p>
          </div>
          <Link href={`/${locale}/setlists`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
              aria-label={t("backToList")}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t("backToList")}</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="relative min-h-screen bg-gray-100 py-12 px-4">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center space-x-4">
              <Link href={`/${locale}/setlists`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-xl shadow-sm hover:bg-gray-300 transition-colors"
                  aria-label={t("backToList")}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("backToList")}</span>
                </motion.button>
              </Link>
            </div>

            {canEdit && (
              <Link href={`/${locale}/setlists/${id}/edit`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                  aria-label={t("edit")}
                >
                  <Edit className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("edit")}</span>
                </motion.button>
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {setlist.title}
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            {t("date")}:{" "}
            {format(new Date(setlist.date), "yyyy-MM-dd", {
              locale: dateLocale,
            })}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {t("description")}
            </h2>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">
              {setlist.description || t("noDescription")}
            </p>
          </motion.div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("songs")}
          </h2>
          <ul className="space-y-3 mb-8">
            {setlist.scores
              .sort((a, b) => a.order - b.order)
              .map((score, index) => (
                <motion.li
                  key={score.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700 font-medium">
                      {index + 1}.
                    </span>
                    <span className="text-gray-800">
                      {getDisplayTitle(
                        score.creation.title,
                        score.creation.titleEn,
                        score.creation.titleJa,
                        locale
                      )}
                    </span>
                  </div>
                  <a
                    href={`${appUrl}/api/proxy/creation/${score.creation.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label={`View ${score.creation.title}`}
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                </motion.li>
              ))}
          </ul>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("shareWith")}
            </h2>
            <div className="flex flex-wrap gap-2" role="list">
              {setlist.shares.length === 0 ? (
                <p className="text-gray-600">{t("noShares")}</p>
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
          </motion.div>
          {setlist.fileUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6"
            >
              <a
                href={proxyFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 px-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                aria-label={t("viewPdf")}
              >
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">{t("viewPdf")}</span>
              </a>
            </motion.div>
          )}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t("comments")}
            </h2>
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 min-h-[100px] resize-y transition-all duration-200 hover:bg-gray-50"
                  rows={4}
                  placeholder={t("writeComment")}
                  disabled={!user}
                  aria-label={t("writeComment")}
                />
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting || !comment || !user}
                className={`mt-3 py-2 px-6 rounded-xl text-white font-semibold text-sm ${
                  isSubmitting || !comment || !user
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } transition-colors duration-200 shadow-sm`}
              >
                {t("submitComment")}
              </motion.button>
            </form>
            <AnimatePresence>
              {setlist.comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="border-t border-gray-200 py-4"
                >
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <span className="font-medium text-gray-700">
                      {c.user.name}
                    </span>
                    <span>·</span>
                    <span>
                      {format(new Date(c.createdAt), "yyyy-MM-dd HH:mm", {
                        locale: dateLocale,
                      })}
                    </span>
                  </p>
                  <p className="text-gray-700 mt-1">{c.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
