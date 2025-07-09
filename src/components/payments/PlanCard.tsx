// src/components/payments/PlanCard.tsx
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plan } from "@prisma/client";

interface PlanCardProps {
  title: string;
  description: string;
  price: string;
  month: string;
  features: string[];
  buttonText: string;
  disabled?: boolean;
  isSuperAdmin: boolean;
  currentPlan: Plan;
  isCurrentPlan: boolean;
  onCancel: () => void;
  onSubscribe: () => void;
  expirationDate: string;
  isLoading?: boolean;
}

export default function PlanCard({
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
      {isCurrentPlan && title === t("free.title") ? null : isSuperAdmin ? (
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
            className={`cursor-pointer mt-6 w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
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
