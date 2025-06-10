"use client";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";
import { ChurchApplication } from "@prisma/client";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import PendingChurches from "@/components/PendingChurches";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function PendingChurchPage() {
  const t = useTranslations();
  const { user, isLoading, error: authError } = useAuth();
  const [pendingChurches, setPendingChurches] = useState<ChurchApplication[]>(
    []
  );
  const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [rejectionType, setRejectionType] = useState<"church" | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isImageModalOpen, setImageModalOpen] = useState(false);

  // Fetch pending churches
  useEffect(() => {
    const fetchPendingChurches = async () => {
      try {
        const response = await fetch("/api/pending", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch pending churches");
        const { pendingChurches } = await response.json();
        setPendingChurches(pendingChurches);
      } catch (err) {
        console.error("Error fetching pending churches:", err);
        setFetchError(t("serverError"));
      }
    };

    if (user && !isLoading && user.role === "MASTER") {
      fetchPendingChurches();
    }
  }, [user, isLoading, t]);

  const handleApproveChurch = async (applicationId: string) => {
    try {
      const response = await fetch("/api/church/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve church");
      setPendingChurches(
        pendingChurches.filter((church) => church.id !== applicationId)
      );
    } catch (err) {
      console.error("Error approving church:", err);
      setFetchError(t("serverError"));
    }
  };

  const handleRejectChurch = async () => {
    if (!selectedChurchId) return;
    try {
      const response = await fetch("/api/church/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchId: selectedChurchId,
          reason: rejectionReason,
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reject church");
      setPendingChurches(
        pendingChurches.filter((church) => church.id !== selectedChurchId)
      );
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedChurchId(null);
      setRejectionType(null);
    } catch (err) {
      console.error("Error rejecting church:", err);
      setFetchError(t("serverError"));
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleOpenRejectionModal = (type: "church", id: string) => {
    setRejectionType(type);
    setSelectedChurchId(id);
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = () => {
    if (rejectionType === "church") {
      handleRejectChurch();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t("pendingChurches")}
          </h1>
        </div>

        <PendingChurches
          pendingChurches={pendingChurches}
          userRole={user?.role ?? ""}
          onApproveChurch={handleApproveChurch}
          onRejectChurch={(id) => handleOpenRejectionModal("church", id)}
          onImageClick={openImageModal}
        />

        {/* 거부 모달 */}
        <Modal isOpen={isRejectionModalOpen}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("rejectionReason")}
          </h2>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("enterRejectionReason")}
            rows={4}
            aria-label={t("rejectionReason")}
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              onClick={() => setRejectionModalOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleRejectSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              disabled={!rejectionReason.trim()}
            >
              {t("confirm")}
            </Button>
          </div>
        </Modal>

        {/* 이미지 확대 모달 */}
        <ImagePreviewModal
          isOpen={isImageModalOpen}
          imageUrl={selectedImage}
          alt={t("buildingImage")}
        />

        {/* 에러 모달 */}
        {(authError || fetchError) && (
          <Modal isOpen={!!(authError || fetchError)}>
            <p className="text-red-600 text-center mb-4">
              {authError || fetchError}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setFetchError(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                {t("close")}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
