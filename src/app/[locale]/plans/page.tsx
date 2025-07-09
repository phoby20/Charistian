// src/app/[locale]/plans/page.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRouter } from "@/utils/useRouter";

interface Subscription {
  plan: "FREE" | "SMART" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
  currentPeriodEnd?: number; // Stripe의 current_period_end (Unix timestamp)
  stripeSubscriptionId: string | null;
}

export default function PlansPage() {
  const t = useTranslations("plans");
  const { user, isLoading: isAuthLoading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [planLoading, setPlanLoading] = useState(true);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [isSubscriptionId, setIsSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stripe 초기화
  const initializeStripe = useCallback(async () => {
    try {
      const response = await fetch("/api/secure/stripe/config", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const { publishableKey } = await response.json();
      setStripePromise(loadStripe(publishableKey));
    } catch (error) {
      console.error("Client - Failed to fetch Stripe config:", error);
      setError(t("error.config"));
    }
  }, [t]);

  useEffect(() => {
    if (isLoading || !user) return;

    initializeStripe();

    const fetchPlan = async () => {
      try {
        const response = await fetch("/api/secure/subscriptions", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch subscription");
        }
        const data: Subscription = await response.json();
        setCurrentPlan(data.plan || "FREE");
        setIsSubscriptionId(data.stripeSubscriptionId);
        setCurrentPeriodEnd(data.currentPeriodEnd || null);
      } catch (error) {
        console.error("Failed to fetch plan:", error);
        setError(t("error.fetchPlan"));
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [user, isLoading, initializeStripe, t]);

  const handleCancelClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const response = await fetch("/api/secure/subscriptions", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
      setCurrentPlan("FREE");
      setCurrentPeriodEnd(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setError(t("error.cancelFailed"));
    }
  };

  // 구독 상태 확인
  const checkSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/secure/subscriptions", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      return (
        data.plan !== "FREE" && data.status === "ACTIVE" && isSubscriptionId
      );
    } catch (error) {
      console.error("Client - Failed to check subscription:", error);
      return false;
    }
  }, []);

  // 구독 생성 및 invoiceUrl 가져오기
  const handleSubmit = async (plan: "SMART" | "ENTERPRISE") => {
    if (!stripePromise || !user || user.role !== "SUPER_ADMIN") {
      setError(t("error.stripeNotLoaded"));
      return;
    }

    const stripe = await stripePromise;
    if (!stripe) {
      setError(t("error.stripeNotLoaded"));
      return;
    }

    try {
      setIsLoading(true);
      // 1. 구독 상태 확인
      const isSubscribed = await checkSubscription();
      if (isSubscribed) {
        setError(t("error.alreadySubscribed"));
        return;
      }

      // 2. 구독 생성 요청
      const response = await fetch("/api/secure/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error("API 호출 에러");
      }

      if (data.url) {
        router.push(data.url);
      } else {
        throw new Error(t("error.clientSecret"));
      }
    } catch (error) {
      console.error("Client - Failed to process subscription:", error);
      setError(t("error.payment"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || planLoading || !user || isLoading) {
    return <Loading />;
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // 플랜 등급 정의
  const planHierarchy: { [key: string]: number } = {
    FREE: 0,
    SMART: 1,
    ENTERPRISE: 2,
  };

  // 구독 만료일 포맷팅
  const formatExpirationDate = (timestamp: number | null): string => {
    if (!timestamp) return t("cancel.noExpirationDate");
    const date = new Date(timestamp * 1000); // Unix timestamp to Date
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-white to-gray-100">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold text-gray-900 mb-8 text-center"
        >
          {t("title")}
        </motion.h1>
        {error && <div className="text-red-600 mb-6 text-center">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            title={t("free.title")}
            description={t("free.description")}
            price={t("free.price")}
            month={""}
            buttonText={
              currentPlan === "FREE" ? t("free.currentPlan") : t("free.select")
            }
            disabled={
              !isSuperAdmin ||
              planHierarchy[currentPlan] > planHierarchy["FREE"]
            }
            href="#"
            isSuperAdmin={isSuperAdmin}
            isCurrentPlan={currentPlan === "FREE"}
            onCancel={handleCancelClick}
            onSubscribe={() => {}}
          />
          <PlanCard
            title={t("smart.title")}
            description={t("smart.description")}
            price={t("smart.price")}
            month={t("month")}
            buttonText={
              currentPlan === "SMART" && isSuperAdmin && isSubscriptionId
                ? t("cancelSubscription")
                : isSuperAdmin
                  ? t("smart.subscribe")
                  : t("superAdminRequired")
            }
            disabled={
              !isSuperAdmin ||
              planHierarchy[currentPlan] > planHierarchy["SMART"]
            }
            href="#"
            isSuperAdmin={isSuperAdmin}
            isCurrentPlan={currentPlan === "SMART"}
            onCancel={handleCancelClick}
            onSubscribe={() => handleSubmit("SMART")}
          />
          <PlanCard
            title={t("enterprise.title")}
            description={t("enterprise.description")}
            price={t("enterprise.price")}
            month={t("month")}
            buttonText={
              currentPlan === "ENTERPRISE" && isSuperAdmin && isSubscriptionId
                ? t("cancelSubscription")
                : isSuperAdmin
                  ? t("enterprise.subscribe")
                  : t("superAdminRequired")
            }
            disabled={false}
            href="#"
            isSuperAdmin={isSuperAdmin}
            isCurrentPlan={currentPlan === "ENTERPRISE"}
            onCancel={handleCancelClick}
            onSubscribe={() => handleSubmit("ENTERPRISE")}
          />
        </div>
      </div>
      {isModalOpen && (
        <Modal
          title={t("cancel.title")}
          message={t("cancel.confirm", {
            expirationDate: formatExpirationDate(currentPeriodEnd),
          })}
          onConfirm={handleConfirmCancel}
          onClose={() => setIsModalOpen(false)}
          confirmText={t("cancel.submit")}
          cancelText={t("cancel.cancel")}
        />
      )}
    </div>
  );
}

interface PlanCardProps {
  title: string;
  description: string;
  price: string;
  month: string;
  buttonText: string;
  disabled?: boolean;
  href: string;
  isSuperAdmin: boolean;
  isCurrentPlan: boolean;
  onCancel: () => void;
  onSubscribe: () => void;
}

function PlanCard({
  title,
  description,
  price,
  month,
  buttonText,
  disabled,
  isSuperAdmin,
  isCurrentPlan,
  onCancel,
  onSubscribe,
}: PlanCardProps) {
  const t = useTranslations("plans");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:scale-105 transition-transform duration-200"
    >
      <h2 className="text-xl font-medium text-gray-900">{title}</h2>
      <p className="text-gray-500 text-base mt-2 leading-relaxed">
        {description}
      </p>
      <p className="text-gray-900 text-2xl font-semibold mt-4">
        <span className="text-gray-600 text-lg mr-1">{month}</span>
        {price}
      </p>
      {isSuperAdmin ? (
        isCurrentPlan && buttonText === t("cancelSubscription") ? (
          <button
            onClick={onCancel}
            className="mt-6 w-full text-center py-2.5 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200 cursor-pointer"
          >
            {buttonText}
          </button>
        ) : (
          <button
            onClick={onSubscribe}
            disabled={disabled}
            className={`mt-6 w-full text-center py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
              disabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {buttonText}
          </button>
        )
      ) : (
        <p className="mt-6 text-red-500 text-base font-medium">
          {t("superAdminRequired")}
        </p>
      )}
    </motion.div>
  );
}

interface ModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText: string;
  cancelText: string;
}

function Modal({
  title,
  message,
  onConfirm,
  onClose,
  confirmText,
  cancelText,
}: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-6 max-w-sm w-full border border-gray-100 shadow-md"
      >
        <h2 className="text-xl font-medium text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-600 text-base mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200 cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
