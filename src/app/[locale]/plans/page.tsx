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
  currentPeriodEnd?: number;
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
    if (isAuthLoading || !user) return;

    initializeStripe();

    const fetchPlan = async () => {
      try {
        const response = await fetch("/api/secure/subscriptions", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
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
  }, [user, isAuthLoading, initializeStripe, t]);

  const handleCancelClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setIsLoading(true);
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
      setIsSubscriptionId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setError(t("error.cancelFailed"));
    } finally {
      setIsLoading(false);
    }
  };

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
  }, [isSubscriptionId]);

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
      const isSubscribed = await checkSubscription();
      if (isSubscribed) {
        setError(t("error.alreadySubscribed"));
        return;
      }

      const response = await fetch("/api/secure/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("error.payment"));
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

  if (isAuthLoading || planLoading || !user) {
    return <Loading />;
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const planHierarchy: { [key: string]: number } = {
    FREE: 0,
    SMART: 1,
    ENTERPRISE: 2,
  };

  const formatExpirationDate = (timestamp: number | null): string => {
    if (!timestamp) return t("cancel.noExpirationDate");
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {t("title")}
          </h1>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanCard
            title={t("free.title")}
            description={t("free.description")}
            price={t("free.price")}
            month=""
            features={[
              t("free.features1"),
              t("free.features2"),
              t("free.features3"),
            ]}
            buttonText={
              currentPlan === "FREE" ? t("free.currentPlan") : t("free.select")
            }
            disabled={
              !isSuperAdmin ||
              planHierarchy[currentPlan] > planHierarchy["FREE"]
            }
            isSuperAdmin={isSuperAdmin}
            currentPlan={currentPlan}
            isCurrentPlan={currentPlan === "FREE"}
            onCancel={handleCancelClick}
            onSubscribe={() => {}}
            expirationDate={formatExpirationDate(currentPeriodEnd)}
          />
          <PlanCard
            title={t("smart.title")}
            description={t("smart.description")}
            price={t("smart.price")}
            month={t("month")}
            features={[
              t("smart.features1"),
              t("smart.features2"),
              t("smart.features3"),
            ]}
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
            isSuperAdmin={isSuperAdmin}
            currentPlan={currentPlan}
            isCurrentPlan={currentPlan === "SMART"}
            onCancel={handleCancelClick}
            onSubscribe={() => handleSubmit("SMART")}
            expirationDate={formatExpirationDate(currentPeriodEnd)}
            isLoading={isLoading && currentPlan === "SMART"}
          />
          <PlanCard
            title={t("enterprise.title")}
            description={t("enterprise.description")}
            price={t("enterprise.price")}
            month={t("month")}
            features={[
              t("enterprise.features1"),
              t("enterprise.features2"),
              t("enterprise.features3"),
            ]}
            buttonText={
              currentPlan === "ENTERPRISE" && isSuperAdmin && isSubscriptionId
                ? t("cancelSubscription")
                : isSuperAdmin
                  ? t("enterprise.subscribe")
                  : t("superAdminRequired")
            }
            disabled={!isSuperAdmin}
            isSuperAdmin={isSuperAdmin}
            currentPlan={currentPlan}
            isCurrentPlan={currentPlan === "ENTERPRISE"}
            onCancel={handleCancelClick}
            onSubscribe={() => handleSubmit("ENTERPRISE")}
            expirationDate={formatExpirationDate(currentPeriodEnd)}
            isLoading={isLoading && currentPlan === "ENTERPRISE"}
          />
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
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  description: string;
  price: string;
  month: string;
  features: string[];
  buttonText: string;
  disabled?: boolean;
  isSuperAdmin: boolean;
  currentPlan: string;
  isCurrentPlan: boolean;
  onCancel: () => void;
  onSubscribe: () => void;
  expirationDate: string;
  isLoading?: boolean;
}

function PlanCard({
  title,
  description,
  price,
  month,
  features,
  buttonText,
  disabled,
  isSuperAdmin,
  currentPlan,
  isCurrentPlan,
  onCancel,
  onSubscribe,
  expirationDate,
  isLoading,
}: PlanCardProps) {
  const t = useTranslations("plans");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: isCurrentPlan ? 1 : 1.03,
        transition: { duration: 0.2 },
      }}
      className={`relative bg-white rounded-2xl shadow-lg p-6 border transition-all duration-300 ${
        isCurrentPlan
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200"
      }`}
    >
      {isCurrentPlan && (
        <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          {t("currentPlan")}
        </span>
      )}
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <p className="text-gray-600 text-sm mt-2">{description}</p>
      <div className="mt-4 flex items-baseline">
        <span className="text-3xl font-bold text-blue-700">{price}</span>
        {month && <span className="ml-2 text-sm text-gray-500">{month}</span>}
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600 text-sm">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      {currentPlan !== "FREE" && (
        <p className="mt-4 text-sm text-gray-500">
          {t("expirationDate")}: {expirationDate}
        </p>
      )}
      {isSuperAdmin ? (
        isCurrentPlan && buttonText === t("cancelSubscription") ? (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`mt-6 w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
            aria-label={t("cancelSubscription")}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {buttonText}
          </button>
        ) : (
          <button
            onClick={onSubscribe}
            disabled={disabled || isLoading}
            className={`mt-6 w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              disabled || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            }`}
            aria-label={buttonText}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {buttonText}
          </button>
        )
      ) : (
        <p className="mt-6 text-red-500 text-sm font-medium text-center">
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
  isLoading: boolean;
}

function Modal({
  title,
  message,
  onConfirm,
  onClose,
  confirmText,
  cancelText,
  isLoading,
}: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 text-sm mb-6 whitespace-pre-wrap">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
            aria-label={confirmText}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
