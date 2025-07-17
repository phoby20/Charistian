// src/app/[locale]/plans/page.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";
import { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRouter } from "@/utils/useRouter";
import PlanCard from "@/components/payments/PlanCard";
import SubscriptionCancelModal from "@/components/payments/SubscriptionCancelModal";
import { Plan } from "@prisma/client";

interface Subscription {
  plan: Plan;
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
  currentPeriodEnd?: number;
  stripeSubscriptionId: string | null;
}

export default function PlansPage() {
  const t = useTranslations("plans");
  const { user, isLoading: isAuthLoading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<Plan>("FREE");
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
        setCurrentPlan(data.stripeSubscriptionId ? data.plan : "FREE");
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12"
        >
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">
            {t("title")}
          </h1>
          <p className="mt-4 mb-20 text-center">{t("description")}</p>
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
          <SubscriptionCancelModal
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
