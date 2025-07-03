import { ChurchApplication } from "@prisma/client";
import ChurchApplicationCard from "./ChurchApplicationCard";
import { useTranslations } from "next-intl";

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
  const t = useTranslations();

  if (userRole !== "MASTER") {
    return null;
  }

  return (
    <section className="mb-12">
      {pendingChurches.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg italic">
            {t("noPendingChurches")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
