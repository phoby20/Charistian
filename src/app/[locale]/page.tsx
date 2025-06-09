"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";
import { motion } from "framer-motion";
import Button from "@/components/Button";

export default function LandingPage() {
  const t = useTranslations("Landing");
  const router = useRouter();

  const features = [
    {
      icon: "📊",
      title: t("features.attendance.title"),
      description: t("features.attendance.description"),
    },
    {
      icon: "👥",
      title: t("features.members.title"),
      description: t("features.members.description"),
    },
    {
      icon: "📅",
      title: t("features.dashboard.title"),
      description: t("features.dashboard.description"),
    },
    {
      icon: "📱",
      title: t("features.qrAttendance.title"),
      description: t("features.qrAttendance.description"),
      badge: t("features.qrAttendance.badge"),
    },
    {
      icon: "🔐",
      title: t("features.permissions.title"),
      description: t("features.permissions.description"),
    },
    {
      icon: "🏛️",
      title: t("features.churchManagement.title"),
      description: t("features.churchManagement.description"),
    },
  ];

  const usageSteps = [
    {
      title: t("usage.steps.0.title"),
      description: t("usage.steps.0.description"),
    },
    {
      title: t("usage.steps.1.title"),
      description: t("usage.steps.1.description"),
    },
    {
      title: t("usage.steps.2.title"),
      description: t("usage.steps.2.description"),
    },
    {
      title: t("usage.steps.3.title"),
      description: t("usage.steps.3.description"),
    },
    {
      title: t("usage.steps.4.title"),
      description: t("usage.steps.4.description"),
    },
    {
      title: t("usage.steps.5.title"),
      description: t("usage.steps.5.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white pt-24 pb-16">
        <div className="py-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-extrabold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t("hero.title")}
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t("hero.description")}
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              onClick={() => router.push("/signup")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
              aria-label={t("hero.cta")}
            >
              {t("hero.cta")}
            </Button>
            <Button
              onClick={() => router.push("/church-registration")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
              aria-label={t("usage.steps.0.title")}
            >
              {t("usage.steps.0.title")}
            </Button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-wave bg-cover opacity-20"></div>
      </section>
      <section className="py-30 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            className="text-3xl font-bold text-gray-900 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("features.title")}
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {feature.badge && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded-full">
                    {feature.badge}
                  </span>
                )}
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section
        className="py-50 bg-gray-100"
        role="region"
        aria-labelledby="usage-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            id="usage-title"
            className="text-3xl font-bold text-gray-900 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("usage.title")}
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usageSteps.map((step, index) => (
              <motion.div
                key={step.title}
                className="p-6 bg-white rounded-lg shadow-md text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <span className="text-2xl font-bold text-blue-600 mb-4 block">
                  {t("usage.step", { number: index + 1 })}
                </span>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600">{step.description}</p>
                {index === 0 && (
                  <Button
                    onClick={() => router.push("/church-registration")}
                    className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
                    aria-label={t("cta.button")}
                  >
                    {t("cta.button")}
                  </Button>
                )}
                {index === 4 && (
                  <Button
                    onClick={() => router.push("/signup")}
                    className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
                    aria-label={t("hero.cta")}
                  >
                    {t("hero.cta")}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-50 bg-gradient-to-r from-green-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="inline-flex items-center bg-yellow-400 text-gray-900 text-sm font-semibold px-3 py-1 rounded-full mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("promotion.limitedOffer")}
          </motion.div>
          <motion.h3
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("promotion.title")}
          </motion.h3>
          <motion.p
            className="text-lg mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            {t("promotion.description")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button
              onClick={() => router.push("/church-registration")}
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
              aria-label={t("promotion.cta")}
            >
              {t("promotion.cta")}
            </Button>
          </motion.div>
        </div>
      </section>
      <section
        className="py-50 bg-cover bg-center text-white relative"
        role="region"
        aria-labelledby="cta-title"
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h3
            id="cta-title"
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("cta.title")}
          </motion.h3>
          <motion.p
            className="text-lg mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            {t("cta.description")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button
              onClick={() => router.push("/church-registration")}
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
              aria-label={t("cta.button")}
            >
              {t("cta.button")}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
