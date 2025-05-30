"use client";

import { useTranslation } from "next-i18next";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";
import { ChurchApplication } from "@prisma/client";
import ChurchApplicationCard from "@/components/ChurchApplicationCard";
import ImagePreviewModal from "@/components/ImagePreviewModal";

interface User {
  id: string;
  name: string;
  email: string;
  churchId: string;
}

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const [pendingChurches, setPendingChurches] = useState<ChurchApplication[]>(
    []
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // 사용자 거부용
  const [rejectionType, setRejectionType] = useState<"church" | "user" | null>(
    null
  ); // 거부 대상 구분
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);

  // Fetch current user role and churchId
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.role);
          setUserChurchId(data.user.churchId);
        } else {
          setError(t("authError"));
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(t("serverError"));
      }
    };
    fetchUserRole();
  }, [t]);

  // Fetch pending data
  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        const response = await fetch("/api/pending");
        if (!response.ok) throw new Error("Failed to fetch data");
        const { pendingChurches, pendingUsers } = await response.json();
        setPendingChurches(pendingChurches);

        // Filter pendingUsers based on churchId for SUPER_ADMIN or ADMIN
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
          if (userChurchId) {
            const filteredUsers = pendingUsers.filter(
              (user: User) => user.churchId === userChurchId
            );
            setPendingUsers(filteredUsers);
          } else {
            setPendingUsers([]);
          }
        } else {
          setPendingUsers([]);
        }
      } catch (err) {
        console.error("Error fetching pending data:", err);
        setError(t("serverError"));
      }
    };

    if (userRole !== null && userChurchId !== null) {
      fetchPendingData();
    }
  }, [userRole, userChurchId]);

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
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedChurchId(null);
      setRejectionType(null);
    } catch (err) {
      console.error("Error rejecting church:", err);
      setError(t("serverError"));
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to approve user");
      setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Error approving user:", err);
      setError(t("serverError"));
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUserId) return;
    try {
      const response = await fetch("/api/users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          reason: rejectionReason,
        }),
      });
      if (!response.ok) throw new Error("Failed to reject user");
      setPendingUsers(
        pendingUsers.filter((user) => user.id !== selectedUserId)
      );
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedUserId(null);
      setRejectionType(null);
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError(t("serverError"));
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleOpenRejectionModal = (type: "church" | "user", id: string) => {
    setRejectionType(type);
    if (type === "church") {
      setSelectedChurchId(id);
      setSelectedUserId(null);
    } else {
      setSelectedUserId(id);
      setSelectedChurchId(null);
    }
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = () => {
    if (rejectionType === "church") {
      handleRejectChurch();
    } else if (rejectionType === "user") {
      handleRejectUser();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {t("dashboard")}
        </h1>

        {userRole === "MASTER" && (
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
                    onApprove={handleApproveChurch}
                    onReject={(id) => handleOpenRejectionModal("church", id)}
                    onImageClick={openImageModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {t("pendingUsers")}
            </h2>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 italic">{t("noPendingUsers")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                  >
                    <p className="text-lg font-bold text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      {t("churchId")}: {user.churchId}
                    </p>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                      >
                        {t("approve")}
                      </Button>
                      <Button
                        onClick={() =>
                          handleOpenRejectionModal("user", user.id)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                      >
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 거부 모달 */}
        <Modal
          isOpen={isRejectionModalOpen}
          onClose={() => {
            setRejectionModalOpen(false);
            setRejectionReason("");
            setSelectedChurchId(null);
            setSelectedUserId(null);
            setRejectionType(null);
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {rejectionType === "user"
              ? t("userRejectionReason")
              : t("rejectionReason")}
          </h2>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={
              rejectionType === "user"
                ? t("enterUserRejectionReason")
                : t("enterRejectionReason")
            }
          />
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleRejectSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              {t("confirm")}
            </Button>
          </div>
        </Modal>

        {/* 이미지 확대 모달 */}
        <ImagePreviewModal
          isOpen={isImageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageUrl={selectedImage}
          alt="Building image"
        />

        {/* 에러 모달 */}
        {error && (
          <Modal isOpen={!!error} onClose={() => setError(null)}>
            <p className="text-red-600">{error}</p>
          </Modal>
        )}
      </div>
    </div>
  );
}
