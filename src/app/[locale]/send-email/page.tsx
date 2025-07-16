// src/app/[locale]/send-email/page.tsx
"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";

export default function SendEmailPage() {
  const t = useTranslations("toUserSendEmail");
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const locale = useLocale();

  const handleSendEmail = async () => {
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setFetchError(t("fillAllFields"));
      return;
    }

    try {
      setIsSendingEmail(true);
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          subject,
          message,
          locale: locale || "ko",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("serverError"));
      }

      setSuccessMessage(t("emailSentSuccess"));
      setModalOpen(false);
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Error sending email:", err);
      setFetchError(t("serverError"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isSendingEmail) {
    return <Loading />;
  }

  if (user?.role !== "MASTER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <p className="text-red-600 text-lg">{t("accessDenied")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {t("sendEmail")}
          </h1>
          <p className="text-gray-600 mt-2">{t("sendEmailDescription")}</p>
        </div>

        {/* 이메일 전송 폼 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("sendEmailForm")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder={t("enterEmail")}
                aria-label={t("email")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("subject")}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder={t("enterSubject")}
                aria-label={t("subject")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder={t("enterMessage")}
                rows={6}
                aria-label={t("message")}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setEmail("");
                  setSubject("");
                  setMessage("");
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                {t("reset")}
              </Button>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                disabled={!email.trim() || !subject.trim() || !message.trim()}
              >
                {t("send")}
              </Button>
            </div>
          </div>
        </div>

        {/* 확인 모달 */}
        <Modal isOpen={isModalOpen}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("confirmSendEmail", { email })}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("confirmSendEmailDescription")}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSendEmail}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                {t("send")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 성공/에러 모달 */}
        {(fetchError || successMessage) && (
          <Modal isOpen={!!(fetchError || successMessage)}>
            <div className="p-6">
              <p
                className={`text-center mb-6 font-medium ${
                  fetchError ? "text-red-600" : "text-green-600"
                }`}
              >
                {fetchError || successMessage}
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setFetchError(null);
                    setSuccessMessage(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
