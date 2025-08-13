// src/components/scores/CommentsSection.tsx

"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScoreComment, ScoreResponse } from "@/types/score";
import { useAuth } from "@/context/AuthContext";

interface CommentsSectionProps {
  score: ScoreResponse;
  setScore: React.Dispatch<React.SetStateAction<ScoreResponse | null>>;
  locale: string;
  id: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CommentsSection({
  score,
  setScore,
  locale,
  id,
  setError,
}: CommentsSectionProps) {
  const t = useTranslations("ScoreDetail");
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!score || isCommenting || !comment.trim()) return;
    setIsCommenting(true);

    try {
      const response = await fetch(`/api/scores/${id}/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("commentError"));
      }

      // 새 댓글을 기존 댓글 목록에 추가
      setScore((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [
            {
              ...data,
              user: { name: data.user?.name || user?.name || "Unknown" },
              userId: user?.id || data.userId,
              createdAt: new Date().toISOString(),
            },
            ...(prev.comments || []),
          ],
          _count: {
            ...prev._count,
            comments: (prev._count?.comments || 0) + 1,
          },
        };
      });
      setComment("");
    } catch (error: unknown) {
      let errorMessage = t("commentError");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!score || !confirm(t("confirmDeleteComment"))) return;

    try {
      const response = await fetch(`/api/scores/${id}/comment/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("deleteCommentError"));
      }

      // 댓글 목록에서 삭제된 댓글 제거
      setScore((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments?.filter((c) => c.id !== commentId) || [],
          _count: {
            ...prev._count,
            comments: (prev._count?.comments || 1) - 1,
          },
        };
      });
    } catch (error: unknown) {
      let errorMessage = t("deleteCommentError");
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mt-8"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {t("comments")} ({score._count?.comments || 0})
      </h2>
      <form onSubmit={handleCommentSubmit} className="mb-6">
        <div className="flex items-center gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("writeComment")}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none h-20"
            disabled={isCommenting}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isCommenting || !comment.trim()}
            className={`p-3 bg-[#ff66c4] text-white rounded-lg flex items-center justify-center transition-all ${
              isCommenting || !comment.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#fc089e]"
            }`}
            aria-label={t("submitComment")}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
      <div className="space-y-4">
        {score.comments && score.comments.length > 0 ? (
          score.comments.map((comment: ScoreComment, index: number) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {comment.user?.name || "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {user?.id === comment.userId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCommentDelete(comment.id)}
                    className="text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    aria-label={t("deleteComment")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
              <p className="text-sm text-gray-600">{comment.content}</p>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-600">{t("noComments")}</p>
        )}
      </div>
    </motion.div>
  );
}
