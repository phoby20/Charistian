// src/app/[locale]/dashboard/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";

interface Church {
  id: string;
  name: string;
  address: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const [pendingChurches, setPendingChurches] = useState<Church[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        const response = await fetch("/api/pending");
        if (!response.ok) throw new Error("Failed to fetch data");
        const { pendingChurches, pendingUsers } = await response.json();
        setPendingChurches(pendingChurches);
        setPendingUsers(pendingUsers);
      } catch (err) {
        console.error("Error fetching pending data:", err);
        setError(t("serverError"));
      }
    };
    fetchPendingData();
  }, []);

  const handleApproveChurch = async (applicationId: string) => {
    try {
      const response = await fetch("/api/church/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      if (!response.ok) throw new Error("Failed to approve church");
      setPendingChurches(
        pendingChurches.filter((church) => church.id !== applicationId)
      );
    } catch (err) {
      console.error("Error approving church:", err);
      setError(t("serverError"));
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
      });
      if (!response.ok) throw new Error("Failed to reject church");
      setPendingChurches(
        pendingChurches.filter((church) => church.id !== selectedChurchId)
      );
      setModalOpen(false);
      setRejectionReason("");
      setSelectedChurchId(null);
    } catch (err) {
      console.error("Error rejecting church:", err);
      setError(t("serverError"));
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">{t("dashboard")}</h1>
      <h2 className="text-xl font-semibold mb-4">{t("pendingChurches")}</h2>
      {pendingChurches.map((church) => (
        <div key={church.id} className="bg-white p-4 mb-4 rounded-md shadow-md">
          <p>
            {church.name} - {church.address}
          </p>
          <Button onClick={() => handleApproveChurch(church.id)}>
            {t("approve")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setSelectedChurchId(church.id);
              setModalOpen(true);
            }}
          >
            {t("reject")}
          </Button>
        </div>
      ))}
      <h2 className="text-xl font-semibold mb-4">{t("pendingUsers")}</h2>
      {pendingUsers.map((user) => (
        <div key={user.id} className="bg-white p-4 mb-4 rounded-md shadow-md">
          <p>
            {user.name} - {user.email}
          </p>
          {/* Add approval/rejection buttons for users if needed */}
        </div>
      ))}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-semibold mb-4">{t("rejectionReason")}</h2>
        <textarea
          className="w-full p-2 border rounded-md"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
        <Button onClick={handleRejectChurch}>{t("confirm")}</Button>
      </Modal>
      {error && (
        <Modal isOpen={!!error} onClose={() => setError(null)}>
          <p>{error}</p>
        </Modal>
      )}
    </div>
  );
}
