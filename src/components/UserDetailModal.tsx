// src/components/UserDetailModal.tsx
import { useTranslation } from "next-i18next";
import Modal from "./Modal";
import Button from "./Button";
import Image from "next/image";
import { User } from "@prisma/client";

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function UserDetailModal({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: UserDetailModalProps) {
  const { t } = useTranslation("common");

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-white rounded-2xl w-full p-6 mx-4 sm:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("userDetails")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={t("close")}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-6">
          {/* Profile Image and Name */}
          <div className="flex items-center space-x-4">
            <Image
              src={user.profileImage || "/default_user.png"}
              alt={user.name}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-gray-200"
              onError={(e) => (e.currentTarget.src = "/default_user.png")}
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("phone")}</p>
              <p className="text-sm text-gray-900">{user.phone || t("none")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("kakaoId")}
              </p>
              <p className="text-sm text-gray-900">
                {user.kakaoId || t("none")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("lineId")}</p>
              <p className="text-sm text-gray-900">
                {user.lineId || t("none")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("country")}
              </p>
              <p className="text-sm text-gray-900">
                {user.country || t("none")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("city")}</p>
              <p className="text-sm text-gray-900">{user.city || t("none")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("region")}</p>
              <p className="text-sm text-gray-900">
                {user.region || t("none")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("address")}
              </p>
              <p className="text-sm text-gray-900">
                {user.address || t("none")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("birthDate")}
              </p>
              <p className="text-sm text-gray-900">
                {new Date(user.birthDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("gender")}</p>
              <p className="text-sm text-gray-900">{user.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("position")}
              </p>
              <p className="text-sm text-gray-900">
                {user.position ? user.position : t("noPosition")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("createdAt")}
              </p>
              <p className="text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-8 space-x-3">
          {onReject ? (
            <Button
              onClick={onReject}
              className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              {t("reject")}
            </Button>
          ) : null}

          {onApprove ? (
            <Button
              onClick={onApprove}
              className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              {t("approve")}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
