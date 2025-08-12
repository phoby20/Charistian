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

  // FREE 플랜인지 확인 (title 기반)
  const isFreePlan = title === t("free.title");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: isCurrentPlan ? 1 : 1.02,
        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)",
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className={`relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md p-6 border border-gray-100 transition-all duration-300 ${
        isCurrentPlan
          ? "ring-2 ring-blue-300 border-blue-400"
          : "border-gray-100 hover:border-blue-200"
      }`}
    >
      {isCurrentPlan && (
        <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {t("currentPlan")}
        </span>
      )}
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
        {title}
      </h2>
      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex items-baseline">
        <span className="text-4xl font-extrabold text-blue-700">{price}</span>
        {month && (
          <span className="ml-2 text-base text-gray-400 font-medium">
            {month}
          </span>
        )}
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600 text-sm">
            <svg
              className="h-5 w-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span className="font-medium">{feature}</span>
          </li>
        ))}
      </ul>
      {currentPlan !== "FREE" && (
        <p className="mt-5 text-sm text-gray-400 font-medium">
          {t("expirationDate")}: {expirationDate}
        </p>
      )}
      <div className="mt-6">
        {isFreePlan ? null : isSuperAdmin ? (
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
          <p className="mt-6 text-red-500 text-sm font-semibold text-center">
            {t("superAdminRequired")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
