// src/app/[locale]/plans/checkout/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import { useRouter } from "@/utils/useRouter";
import Link from "next/link";

interface SubscriptionResponse {
  // type: "setup" | "payment";
  // subscriptionId: string;
  // clientSecret: string;
  invoiceUrl: string;
}

export default function CheckoutPage() {
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

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
interface CheckoutFormProps {
  plan: "SMART" | "ENTERPRISE";
}

function CheckoutForm({ plan }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const checkSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/secure/subscriptions", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      return data.plan !== "FREE" && data.status === "ACTIVE";
    } catch (error) {
      console.error("Client - Failed to check subscription:", error);
      return false;
    }
  }, []);

  const fetchClientSecret =
    useCallback(async (): Promise<SubscriptionResponse | null> => {
      if (!plan || !["SMART", "ENTERPRISE"].includes(plan)) {
        router.push(`/${locale}/plans`);
        return null;
      }
      if (user?.role !== "SUPER_ADMIN") {
        router.push(`/${locale}/plans`);
        return null;
      }

      try {
        const response = await fetch("/api/secure/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || t("checkout.error.clientSecret"));
          return null;
        }
        // if (data.type && data.clientSecret && data.subscriptionId) {
        //   return data;
        // } else {
        //   setError(t("checkout.error.clientSecret"));
        //   return null;
        // }
        if (data.invoiceUrl) {
          return data;
        } else {
          setError(t("checkout.error.clientSecret"));
          return null;
        }
      } catch (error) {
        console.error("Client - Failed to fetch client secret:", error);
        setError(t("checkout.error.clientSecret"));
        return null;
      }
    }, [plan, user?.role, locale, router, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError(t("checkout.error.stripeNotLoaded"));
      return;
    }

    setProcessing(true);

    // 1. PaymentElement 제출 (SetupIntent용)
    const { error: submitError } = await elements.submit();
    if (submitError) {
      console.error("Client - Submit error:", submitError);
      setError(submitError.message || t("checkout.error.payment"));
      setProcessing(false);
      return;
    }

    // 2. 구독 상태 확인
    const isSubscribed = await checkSubscription();
    if (isSubscribed) {
      setError(t("checkout.error.alreadySubscribed"));
      setProcessing(false);
      return;
    }

    // 3. 구독 생성 및 clientSecret 가져오기
    const subscriptionData = await fetchClientSecret();
    if (!subscriptionData) {
      setProcessing(false);
      return;
    }

    window.location.href = subscriptionData.invoiceUrl;
    return;
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
      >
        {processing ? t("checkout.processing") : t("checkout.submit", { plan })}
      </button>
    </form>
  );
}
