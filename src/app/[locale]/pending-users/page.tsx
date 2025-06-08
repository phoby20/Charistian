// src/app/pending-users/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Image from "next/image";
import { User } from "@/types/customUser";
import { useRouter } from "@/utils/useRouter";

export default function PendingUsersPage() {
  const t = useTranslations();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch user role and churchId
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
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(t("serverError"));
      }
    };
    fetchUserRole();
  }, [router]);
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/pending");
      if (!response.ok) throw new Error("Failed to fetch data");
      const { pendingUsers } = await response.json();
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
      console.error("Error fetching pending users:", err);
      setError(t("serverError"));
    }
  };

  // Fetch pending users
  useEffect(() => {
    if (userRole !== null && userChurchId !== null) {
      fetchPendingUsers();
    }
  }, [userRole, userChurchId]);

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("Failed to approve user");
      setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
      setSelectedUser(null);
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
      setSelectedUser(null);
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedUserId(null);
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError(t("serverError"));
    }
  };

  const handleUpdate = () => {
    fetchPendingUsers();
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {t("pendingUsers")}
        </h1>
        {pendingUsers.length === 0 ? (
          <p className="text-gray-500 italic">{t("noPendingUsers")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex items-center space-x-4"
                onClick={() => setSelectedUser(user)}
              >
                <Image
                  src={user.profileImage || "/default_user.png"}
                  alt={user.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => (e.currentTarget.src = "/default_user.png")}
                />
                <div>
                  <p className="font-bold text-gray-700">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    {t("position")}:{" "}
                    {user.position ? user.position.name : t("noPosition")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("createdAt")}:{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            isOpen={!!selectedUser}
            onUpdate={handleUpdate}
            onClose={() => setSelectedUser(null)}
            onApprove={() => handleApproveUser(selectedUser.id)}
            onReject={() => {
              setSelectedUserId(selectedUser.id);
              setRejectionModalOpen(true);
            }}
          />
        )}

        {/* Rejection Modal */}
        <Modal isOpen={isRejectionModalOpen}>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("userRejectionReason")}
            </h2>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("enterUserRejectionReason")}
            />
            <div className="flex justify-end mt-4 space-x-3">
              <Button
                onClick={handleRejectUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                disabled={!rejectionReason.trim()}
              >
                {t("confirm")}
              </Button>
              <Button
                onClick={() => setRejectionModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                {t("close")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Error Modal */}
        {error && (
          <Modal isOpen={!!error}>
            <p className="text-red-600">{error}</p>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setError(null)}
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
