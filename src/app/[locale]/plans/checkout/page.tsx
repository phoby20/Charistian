// src/app/[locale]/plans/checkout/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import { Suspense } from "react";

import Link from "next/link";
import CheckoutForm from "@/components/payments/CheckoutForm";

function CheckoutContent() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plan = searchParams.get("plan") as "SMART" | "ENTERPRISE" | null;
  const isMounted = useRef(false);

  const options: StripeElementsOptions = {
    mode: "subscription",
    amount: plan === "SMART" ? 10000 : 50000, // SMART: 10,000 KRW, ENTERPRISE: 50,000 KRW
    currency: "krw",
    appearance: {
      /*...*/
    },
  };

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
      setError(t("checkout.error.config"));
    }
  }, [t]);

  useEffect(() => {
    if (isLoading || !user || isMounted.current) return;

    isMounted.current = true;
    initializeStripe();

    return () => {
      isMounted.current = false;
    };
  }, [initializeStripe, isLoading, user]);

  if (
    isLoading ||
    !user ||
    user.role !== "SUPER_ADMIN" ||
    !plan ||
    !stripePromise
  ) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t("checkout.title")}
              </h1>
              <div className="text-red-600 mb-4">{error}</div>
              <Link
                href={`/${locale}/plans`}
                className="text-blue-600 underline"
              >
                {t("checkout.goToManage")}
              </Link>
            </>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("checkout.title")}
        </h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm plan={plan} />
        </Elements>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutContent />
    </Suspense>
  );
}
