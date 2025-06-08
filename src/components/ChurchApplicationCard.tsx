// src/components/ChurchApplicationCard.tsx
import Button from "@/components/Button";
import Image from "next/image";
import { ChurchApplication } from "@prisma/client";
import { useTranslations } from "next-intl";

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
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {church.churchName}
      </h3>
      <p className="text-sm text-gray-600 mb-1">
        {church.country}, {church.city}, {church.region}, {church.address}
      </p>
      <p className="text-sm text-gray-600 mb-1">
        {church.contactName} ({church.contactPhone})
      </p>
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">{t("plan")}:</span> {church.plan}
      </p>
      {church.buildingImage && (
        <div className="mb-4">
          <Image
            src={church.buildingImage}
            alt={`${church.churchName} building`}
            width={100}
            height={100}
            className="rounded-md object-cover cursor-pointer"
            onClick={() => onImageClick(church.buildingImage!)}
          />
        </div>
      )}
      <div className="flex space-x-3">
        <Button
          onClick={() => onApprove(church.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          {t("approve")}
        </Button>
        <Button
          variant="danger"
          onClick={() => onReject(church.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}
