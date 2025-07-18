"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Button from "@/components/Button";

const commercialInfo = {
  companyName: "Integrity（Charistian）",
  representative: "篠崎 智恵 (Shinozaki Eiji)",
  address: "〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101号室",
  contactEmail: "charistian.co@gmail.com",
  plans: [
    {
      name: "FREE",
      price: "priceFree",
      memberLimit: "memberLimitFree",
      scheduleLimit: "scheduleLimitFree",
      sheetMusicLimit: "sheetMusicLimitFree",
    },
    {
      name: "SMART",
      price: "priceSmart",
      memberLimit: "memberLimitSmart",
      scheduleLimit: "scheduleLimitSmart",
      sheetMusicLimit: "sheetMusicLimitSmart",
    },
    {
      name: "ENTERPRISE",
      price: "priceEnterprise",
      memberLimit: "memberLimitEnterprise",
      scheduleLimit: "scheduleLimitEnterprise",
      sheetMusicLimit: "sheetMusicLimitEnterprise",
    },
  ],
};

export default function SpecifiedCommercialTransactionPage() {
  const t = useTranslations("SpecifiedCommercialTransaction");
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 md:p-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">
          {t("title")}
        </h1>
        <div className="space-y-6">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700 w-1/3">
                  {t("companyName")}
                </th>
                <td className="p-4 text-gray-600">
                  {commercialInfo.companyName}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("representative")}
                </th>
                <td className="p-4 text-gray-600">
                  {commercialInfo.representative}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("address")}
                </th>
                <td className="p-4 text-gray-600">{commercialInfo.address}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("phoneNumber")}
                </th>
                <td className="p-4 text-gray-600">{t("phoneNumberContent")}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("contact")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("email", { email: commercialInfo.contactEmail })}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("additionalFees")}
                </th>
                <td className="p-4 text-gray-600 whitespace-pre-wrap">
                  {t("additionalFeesContent")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("refundPolicy")}
                </th>
                <td className="p-4 text-gray-600 whitespace-pre-wrap">
                  {t("refundPolicyContent")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("deliveryTime")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("deliveryTimeContent")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("paymentMethods")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("paymentMethodsContent")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("paymentTiming")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("paymentTimingContent")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("price")}
                </th>
                <td className="p-4 text-gray-600">
                  <ul className="list-disc pl-5">
                    {commercialInfo.plans.map((plan) => (
                      <li key={plan.name}>
                        <strong>{plan.name}プラン</strong>: {t(plan.price)} (
                        {t(plan.memberLimit)}, {t(plan.scheduleLimit)},{" "}
                        {t(plan.sheetMusicLimit)})
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex justify-center">
          <Link href={`/${locale}`}>
            <Button
              variant="primary"
              className="cursor-pointer text-white w-full px-14 py-3 bg-gradient-to-r from-[#ff66c4] to-[#ffde59] rounded-xl font-semibold text-base hover:from-[#ffde59] hover:to-[#ff66c4] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t("goHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
