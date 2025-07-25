// src/components/payments/PlanCard.tsx
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plan } from "@prisma/client";
import Button from "../Button";

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
        <p className="mt-4 text-sm text-gray-500 mb-4">
          {t("expirationDate")}: {expirationDate}
        </p>
      )}
      {currentPlan === "FREE" ? null : isSuperAdmin ? (
        isCurrentPlan && buttonText === t("cancelSubscription") ? (
          <Button
            variant="outline"
            onClick={onCancel}
            isDisabled={isLoading}
            aria-label={t("cancelSubscription")}
          >
            {buttonText}
          </Button>
        ) : (
          <Button
            onClick={onSubscribe}
            isDisabled={disabled || isLoading}
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        )
      ) : (
        <p className="mt-6 text-red-600 text-sm font-medium text-center">
          {t("superAdminRequired")}
        </p>
      )}
    </motion.div>
  );
}
