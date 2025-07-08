// src/app/[locale]/plans/manage/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";

interface Subscription {
  id: string;
  plan: "FREE" | "SMART" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID";
}

export default function ManageSubscriptionPage() {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;

    const fetchSubscription = async () => {
      try {
        console.log("Client - Fetching subscription"); // 디버깅 로그
        const response = await fetch("/api/secure/subscriptions", {
          credentials: "include",
        });
        console.log("Client - Fetch response:", response.status); // 디버깅 로그
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Client - Subscription data:", data); // 디버깅 로그
        setSubscription(data);
      } catch (error) {
        console.error("Client - Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [user, isLoading]);

  if (isLoading || !user || loading) {
    return <Loading />;
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      console.log("Client - Canceling subscription"); // 디버깅 로그
      const response = await fetch("/api/secure/subscriptions", {
        method: "DELETE",
        credentials: "include",
      });
      console.log("Client - Cancel response:", response.status); // 디버깅 로그
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setSubscription({
        ...subscription,
        id: subscription.id, // id 명시적으로 유지
        status: "CANCELED",
        plan: "FREE",
      });
    } catch (error) {
      console.error("Client - Failed to cancel subscription:", error);
      alert(t("error.cancelFailed")); // 사용자에게 에러 알림
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("manage.title")}
        </h1>
        <p>
          {t("manage.currentPlan")}: {subscription?.plan || "FREE"}
        </p>
        <p>
          {t("manage.status")}: {subscription?.status || t("manage.active")}
        </p>
        {isSuperAdmin && subscription?.plan !== "FREE" && (
          <button
            onClick={handleCancelSubscription}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg"
          >
            {t("manage.cancel")}
          </button>
        )}
        {isSuperAdmin && (
          <Link href="/plans" className="mt-4 block text-blue-600">
            {t("manage.changePlan")}
          </Link>
        )}
        {!isSuperAdmin && (
          <p className="mt-4 text-red-600">{t("manage.superAdminRequired")}</p>
        )}
      </motion.div>
    </div>
  );
}
