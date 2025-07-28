"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/utils/useRouter";
import { motion } from "framer-motion";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Gaegu } from "next/font/google";
import FAQ from "@/components/landing/Faq";
import Landing from "@/components/Loading";
import EventModal from "@/components/dashboard/EventModal";

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function LandingPage() {
  const t = useTranslations("Landing");
  const router = useRouter();
  const pathname = usePathname();
  const [isLanding, setIsLanding] = useState(false);

  useEffect(() => {
    const sendUserAgent = async () => {
      try {
        setIsLanding(true);
        const userAgent = navigator.userAgent;
        const response = await fetch("/api/send-user-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAgent, pathname }),
        });

        if (!response.ok) {
          console.error("Failed to send user agent:", await response.text());
        }
      } catch (error) {
        console.error("Error sending user agent:", error);
      } finally {
        setIsLanding(false);
      }
    };

    sendUserAgent();
  }, [pathname]);

  const features = [
    {
      title: t("features.attendance.title"),
      description: t("features.attendance.description"),
      img: "id_card",
    },
    {
      title: t("features.schedule.title"),
      description: t("features.schedule.description"),
      img: "schedule",
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
  ];

  if (isLanding) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <EventModal />
      <section className="relative min-h-screen flex items-center justify-center border-transparent bg-gradient-to-r from-[#ffde59] to-[#ff66c4] bg-clip-border">
        <div className="py-20 px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl md:text-6xl font-extrabold mb-8 text-[#6e2001]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t("hero.title")}
          </motion.h2>
          <motion.p
            className="text-lg md:text-2xl max-w-xl whitespace-pre mx-auto text-[#360f00]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t("hero.description")}
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              onClick={() => router.push("/terms-of-service?type=member")}
              className="text-white font-extrabold cursor-pointer hover:bg-[#ff66c4] text-lg px-8 py-3 rounded-full bg-[#fc089e] shadow-lg"
              aria-label={t("hero.cta")}
            >
              {t("hero.cta")}
            </Button>
            <Button
              onClick={() => router.push("/terms-of-service?type=church")}
              className="text-white font-extrabold cursor-pointer hover:bg-[#ff66c4] text-lg px-8 py-3 rounded-full bg-[#fc089e] shadow-lg"
              aria-label={t("usage.steps.0.title")}
            >
              {t("usage.steps.0.title")}
            </Button>
          </motion.div>
          <div className="flex justify-center mt-10">
            <Image
              src="/images/landing/conte_sample_ko.png"
              alt="conte_sample"
              width={800}
              height={800}
            />
          </div>
        </div>
      </section>

      {/* Step0 */}
      <section className={gaegu.className}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-red-100 flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-3xl md:text-7xl font-semibold text-gray-900 mt-16 mb-30 text-center whitespace-pre-wrap"
            >
              {t("howToUse.title")}
            </h4>
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center whitespace-pre-wrap"
            >
              {t("howToUse.step0.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step0.description")}
            </h5>
            <div className="relative mt-20">
              <Image
                src="/images/landing/work_illustrator.png"
                alt="conte_sample"
                width={200}
                height={200}
              />
              <p className="absolute top-20 left-[-80] -rotate-25 text-xs">
                {t("howToUse.step0.subDescription.1")}
              </p>
              <p className="absolute top-0 left-[90] rotate-15 text-xs">
                {t("howToUse.step0.subDescription.2")}
              </p>
              <p className="absolute top-20 right-[-80] rotate-15 text-xs">
                {t("howToUse.step0.subDescription.3")}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step1 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-white flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step1.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step1.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step1.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step2 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-gray-100 flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step2.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step2.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step2.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step3 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-white flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step3.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step3.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step3.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step4 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-gray-100 flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step4.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step4.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step4.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step5 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-white flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step5.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step5.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step5.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step6 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-gray-100 flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step6.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step6.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step6.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Step7 */}
      <section className={`whitespace-pre-wrap`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 * 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-white flex flex-col items-center justify-center pt-20 pb-20">
            <h4
              id={`feature-title`}
              className="text-2xl md:text-4xl font-semibold text-gray-900 text-center"
            >
              {t("howToUse.step7.subTitle")}
            </h4>
            <h5
              id={`feature-title`}
              className="text-lg md:text-2xl font-semibold text-gray-500 text-center mt-4"
            >
              {t("howToUse.step7.description")}
            </h5>
            <div className="relative mt-20 pl-10 pr-10">
              <Image
                src="/images/landing/step7.png"
                alt="conte_sample"
                width={800}
                height={800}
              />
            </div>
          </div>
        </motion.div>
      </section>

      <FAQ />

      <div className="bg-white text-center pt-30 text-3xl md:text-4xl font-bold text-primary text-center ">
        {t("features.title")}
      </div>
      {features.map((feature, index) => {
        return (
          <section
            key={feature.title}
            className="py-16 min-h-[640px] flex bg-white flex flex-col md:flex-row items-center justify-center"
            role="region"
            aria-labelledby={`feature-title-${index}`}
          >
            <div className="relative px-4 sm:px-6 lg:px-20 flex items-center">
              <motion.div
                className="p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <h4
                  id={`feature-title-${index}`}
                  className="text-2xl font-semibold text-gray-900 mb-4"
                >
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-lg whitespace-break-spaces">
                  {feature.description}
                </p>
              </motion.div>
            </div>
            <Image
              src={`/images/landing/${feature.img}.png`}
              width={200}
              height={200}
              alt="feature_img"
            />
          </section>
        );
      })}

      <section
        className="py-50 bg-gradient-to-br from-blue-100 via-white to-purple-100"
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
                    onClick={() => router.push("/terms-of-service?type=church")}
                    className="cursor-pointer bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
                    aria-label={t("cta.button")}
                  >
                    {t("cta.button")}
                  </Button>
                )}
                {index === 3 && (
                  <Button
                    onClick={() => router.push("/terms-of-service?type=member")}
                    className="cursor-pointer bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
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

      <section
        className="py-50 bg-gradient-to-r from-green-500 to-teal-600 text-white"
        role="region"
        aria-labelledby="cta-title"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h3
            id="cta-title"
            className="text-xl font-bold mb-6 whitespace-pre-wrap"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("cta.title")}
          </motion.h3>
          <motion.p
            className="text-lg mb-8 max-w-xl mx-auto whitespace-pre-wrap"
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
              onClick={() => router.push("/terms-of-service?type=church")}
              className="cursor-pointer bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full"
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
