// src/app/pending-users/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import UserDetailModal from "@/components/UserDetailModal";
import UserLimitModal from "@/components/UserLimitModal"; // 새 컴포넌트 임포트
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Image from "next/image";
import { CustomUser } from "@/types/customUser";
import { useRouter } from "@/utils/useRouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import Loading from "@/components/Loading";

export default function PendingUsersPage() {
  const t = useTranslations();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<CustomUser[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<CustomUser | null>(null);
  const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserLimitModalOpen, setUserLimitModalOpen] = useState(false);
  const [usageLimit, setUsageLimit] = useState<{
    maxUsers: number;
    remainingUsers: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 역할과 사용량 제한 정보 가져오기
  useEffect(() => {
    const fetchUserRoleAndUsageLimit = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.role);
          setUserChurchId(data.user.churchId);

          // 교회 사용량 제한 정보 가져오기
          const usageResponse = await fetch(`/api/secure/usage-limits`);
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsageLimit({
              maxUsers: usageData.maxUsers,
              remainingUsers: usageData.remainingUsers,
            });
          } else {
            setError(t("serverError") || "서버 오류");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(
          "사용자 역할 또는 사용량 제한 정보를 가져오는 중 오류:",
          err
        );
        setError(t("serverError") || "서버 오류");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserRoleAndUsageLimit();
  }, [router, t]);

  // 대기 중인 사용자 가져오기
  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await fetch("/api/pending");
        if (!response.ok) throw new Error("데이터 가져오기 실패");
        const { pendingUsers } = await response.json();
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
          if (userChurchId) {
            const filteredUsers = pendingUsers.filter(
              (user: CustomUser) => user.churchId === userChurchId
            );
            setPendingUsers(filteredUsers);
          } else {
            setPendingUsers([]);
          }
        } else {
          setPendingUsers([]);
        }
      } catch (err) {
        console.error("대기 중인 사용자 가져오기 오류:", err);
        setError(t("serverError") || "서버 오류");
      }
    };

    if (userRole !== null && userChurchId !== null) {
      fetchPendingUsers();
    }
  }, [userRole, userChurchId, t]);

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("사용자 승인 실패");
      setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
      setSelectedUser(null);
    } catch (err) {
      console.error("사용자 승인 오류:", err);
      setError(t("serverError") || "서버 오류");
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
      if (!response.ok) throw new Error("사용자 거부 실패");
      setPendingUsers(
        pendingUsers.filter((user) => user.id !== selectedUserId)
      );
      setSelectedUser(null);
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedUserId(null);
    } catch (err) {
      console.error("사용자 거부 오류:", err);
      setError(t("serverError") || "서버 오류");
    }
  };

  const handleUpdate = () => {
    const fetchPendingUsers = async () => {
      try {
        const response = await fetch("/api/pending");
        if (!response.ok) throw new Error("데이터 가져오기 실패");
        const { pendingUsers } = await response.json();
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
          if (userChurchId) {
            const filteredUsers = pendingUsers.filter(
              (user: CustomUser) => user.churchId === userChurchId
            );
            setPendingUsers(filteredUsers);
          } else {
            setPendingUsers([]);
          }
        } else {
          setPendingUsers([]);
        }
      } catch (err) {
        console.error("대기 중인 사용자 가져오기 오류:", err);
        setError(t("serverError") || "서버 오류");
      }
    };
    fetchPendingUsers();
  };

  // 사용자 클릭 처리
  const handleUserClick = (user: CustomUser) => {
    if (usageLimit && usageLimit.remainingUsers >= usageLimit.maxUsers) {
      setUserLimitModalOpen(true);
    } else {
      setSelectedUser(user);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {t("pendingUsers") || "대기 중인 사용자"}
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            {t("managePendingUsersDescription") ||
              "승인을 기다리는 사용자를 검토하고 관리합니다."}
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 text-sm font-semibold"
              >
                {t("close") || "닫기"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {pendingUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-white rounded-xl shadow-sm"
          >
            <p className="text-lg text-gray-500 italic">
              {t("noPendingUsers") || "대기 중인 사용자가 없습니다."}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer p-4 flex items-center space-x-4"
                onClick={() => handleUserClick(user)}
              >
                <Image
                  src={user.profileImage || "/default_user.png"}
                  alt={user.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover border-2 border-blue-100"
                  onError={(e) => (e.currentTarget.src = "/default_user.png")}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-lg">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("position") || "직분"}:{" "}
                    {user.position
                      ? user.position.name
                      : t("noPosition") || "없음"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("createdAt") || "생성일"}:{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 사용자 상세 모달 */}
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

        {/* 거부 사유 모달 */}
        <Modal isOpen={isRejectionModalOpen}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("userRejectionReason") || "사용자 거부 사유"}
            </h2>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm resize-y"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={
                t("enterUserRejectionReason") || "거부 사유를 입력하세요"
              }
              rows={5}
            />
            <div className="flex justify-end mt-6 space-x-3">
              <Button
                onClick={handleRejectUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                disabled={!rejectionReason.trim()}
              >
                {t("confirm") || "확인"}
              </Button>
              <Button
                onClick={() => setRejectionModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg"
              >
                {t("close") || "닫기"}
              </Button>
            </div>
          </motion.div>
        </Modal>

        {/* 사용자 제한 초과 모달 */}
        <UserLimitModal
          isOpen={isUserLimitModalOpen}
          onClose={() => setUserLimitModalOpen(false)}
          onUpgrade={() => router.push(`/plans`)} // 로케일 포함
        />
      </div>
    </div>
  );
}
