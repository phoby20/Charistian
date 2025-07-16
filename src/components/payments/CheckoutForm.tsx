// src/components/payments/CheckoutForm.tsx

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/utils/useRouter";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

interface CheckoutFormProps {
  plan: "SMART" | "ENTERPRISE";
}

interface SubscriptionResponse {
  invoiceUrl: string;
}

export default function CheckoutForm({ plan }: CheckoutFormProps) {
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
      return (
        data.plan !== "FREE" &&
        data.status === "ACTIVE" &&
        data.stripeSubscriptionId
      );
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
        console.log("data: ", data);
        if (!response.ok) {
          setError(data.error || t("checkout.error.clientSecret"));
          return null;
        }
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
