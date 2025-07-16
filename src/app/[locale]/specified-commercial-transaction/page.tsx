// src/app/[locale]/specified-commercial-transaction/page.tsx
"use client";
import { useTranslations } from "next-intl";
import { CommercialTransactionInfo } from "@/types/specifiedCommercialTransaction";

const commercialInfo: CommercialTransactionInfo = {
  companyName: "Integrity（Charistian）",
  representative: "篠崎 智恵 (Shinozaki Eiji)",
  address:
    "〒174-0072 Room 101, Lehua Minami-Tokiwadai, 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo, Japan",
  contactEmail: "hearttercompany@gmail.com",
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center tracking-tight">
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
                  {t("contact")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("email", { email: commercialInfo.contactEmail })}
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
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("label_paymentMethod")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("content_paymentMethod")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("label_paymentTiming")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("content_paymentTiming")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("label_serviceStart")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("content_serviceStart")}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-100 text-left p-4 font-semibold text-gray-700">
                  {t("label_refundPolicy")}
                </th>
                <td className="p-4 text-gray-600">
                  {t("content_refundPolicy")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
