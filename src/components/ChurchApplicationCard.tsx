"use client";

import Button from "@/components/Button";
import { ChurchApplication } from "@prisma/client";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ChurchApplicationCardProps {
  church: ChurchApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
}

export default function ChurchApplicationCard({
  church,
  onApprove,
  onReject,
  onImageClick,
}: ChurchApplicationCardProps) {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
        {church.churchName}
      </h3>
      <div className="space-y-2 text-gray-600 text-sm">
        <p>
          <span className="font-medium">{t("location")}:</span> {church.country}
          , {church.city}, {church.region}, {church.address}, (
          {church.churchPhone})
        </p>
        <p>
          <span className="font-medium">{t("contact")}:</span>{" "}
          {church.contactName} ({church.contactPhone})
        </p>
        <p>
          <span className="font-medium">{t("plan")}:</span> {church.plan}
        </p>
        <p>
          <span className="font-medium">gender:</span> {church.contactGender}
        </p>
        <p>
          <span className="font-medium">email:</span> {church.superAdminEmail}
        </p>
      </div>
      {church.logo && (
        <div className="mt-4">
          <Image
            src={church.logo}
            alt={`${church.churchName} logo`}
            width={150}
            height={150}
            className="rounded-lg object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={() => onImageClick(church.logo!)}
          />
        </div>
      )}
      <div className="flex space-x-3 mt-4">
        <Button
          onClick={() => onApprove(church.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
        >
          {t("approve")}
        </Button>
        <Button
          variant="danger"
          onClick={() => onReject(church.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
        >
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}
