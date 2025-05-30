import { useTranslation } from "next-i18next";
import { ChurchApplication } from "@prisma/client";
import ChurchApplicationCard from "./ChurchApplicationCard";

interface PendingChurchesProps {
  pendingChurches: ChurchApplication[];
  userRole: string | null;
  onApproveChurch: (applicationId: string) => void;
  onRejectChurch: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
}

export default function PendingChurches({
  pendingChurches,
  userRole,
  onApproveChurch,
  onRejectChurch,
  onImageClick,
}: PendingChurchesProps) {
  const { t } = useTranslation("common");

  if (userRole !== "MASTER") {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("pendingChurches")}
      </h2>
      {pendingChurches.length === 0 ? (
        <p className="text-gray-500 italic">{t("noPendingChurches")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingChurches.map((church) => (
            <ChurchApplicationCard
              key={church.id}
              church={church}
              onApprove={onApproveChurch}
              onReject={onRejectChurch}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
