"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ko, ja } from "date-fns/locale";
import { SetlistResponse } from "@/types/score";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: string;
}

interface CommentSectionProps {
  setlist: SetlistResponse;
  user: User | null;
  locale: string;
  id: string | string[] | undefined;
  setSetlist: React.Dispatch<React.SetStateAction<SetlistResponse | null>>;
}

export default function CommentSection({
  setlist,
  user,
  locale,
  id,
  setSetlist,
}: CommentSectionProps) {
  const t = useTranslations("Setlist");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const maxCommentLength = 500;

  const dateLocale = locale === "ko" ? ko : ja;

  const handleCommentSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!comment || !user || comment.length > maxCommentLength) return;
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
        toast.success(t("commentSuccess"), {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : t("commentError");
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [comment, user, id, setSetlist, t]
  );

  return (
    <div className="mt-10">
      <h2 className="font-semibold text-gray-900 mb-6 tracking-tight">
        {t("comments")}
      </h2>
      <form onSubmit={handleCommentSubmit} className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 hover:border-gray-300 resize-y"
              rows={5}
              placeholder={user ? t("writeComment") : t("loginToComment")}
              disabled={!user || isSubmitting}
              aria-label={t("writeComment")}
              maxLength={maxCommentLength}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {comment.length}/{maxCommentLength}
            </div>
          </div>
        </motion.div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSubmitting || !comment || !user || typeof id !== "string"}
          className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ${
            isSubmitting || !comment || !user || typeof id !== "string"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            t("submitComment")
          )}
        </motion.button>
      </form>
      <AnimatePresence>
        {setlist.comments.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-gray-500 text-sm italic"
          >
            {t("noComments")}
          </motion.p>
        ) : (
          setlist.comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800 text-sm">
                    {c.user.name}
                  </span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-500 text-xs">
                    {format(new Date(c.createdAt), "yyyy-MM-dd HH:mm", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {c.content}
              </p>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
