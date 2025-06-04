// src/components/UserDetailView.tsx
import { useTranslation } from "next-i18next";
import Image from "next/image";
import Modal from "./Modal";
import Button from "./Button";
import Loading from "./Loading";
import { User } from "@/types/customUser";

interface UserDetailViewProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function UserDetailView({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onEdit,
  isLoading,
  error,
}: UserDetailViewProps) {
  const { t } = useTranslation("common");

  const fields = [
    { key: "phone", label: t("phone") },
    { key: "kakaoId", label: t("kakaoId") },
    { key: "lineId", label: t("lineId") },
    { key: "country", label: t("country") },
    { key: "city", label: t("city") },
    { key: "region", label: t("region") },
    { key: "address", label: t("address") },
    { key: "birthDate", label: t("birthDate") },
    { key: "gender", label: t("gender") },
    { key: "position", label: t("position") },
    { key: "groupId", label: t("group") },
    { key: "subGroupId", label: t("subGroup") },
    { key: "dutyIds", label: t("duties") },
    { key: "teamIds", label: t("teams") },
  ];

  if (isLoading) return <Loading />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-white rounded-2xl w-full p-6 mx-4 sm:mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("userDetails")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={t("close")}
            disabled={isLoading}
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

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Image
              src={user.profileImage || "/default_user.png"}
              alt={user.name}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-gray-200"
              onError={(e) => (e.currentTarget.src = "/default_user.png")}
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-sm text-gray-900">
                  {key === "birthDate"
                    ? user.birthDate
                      ? new Date(user.birthDate).toLocaleDateString()
                      : t("none")
                    : key === "position"
                    ? user.position?.name || t("noPosition")
                    : key === "groupId"
                    ? user.group?.name || t("noGroup")
                    : key === "subGroupId"
                    ? user.subGroup?.name || t("noSubGroup")
                    : key === "dutyIds"
                    ? user.duties && user.duties.length > 0
                      ? user.duties.map((duty) => duty.name).join(", ")
                      : t("noDuties")
                    : key === "teamIds"
                    ? user.teams && user.teams.length > 0
                      ? user.teams.map((team) => team.name).join(", ")
                      : t("noTeams")
                    : (user[key as keyof User] as string) || t("none")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-3">
          {onReject && (
            <Button
              onClick={onReject}
              className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200"
              disabled={isLoading}
            >
              {t("reject")}
            </Button>
          )}
          {onApprove && (
            <Button
              onClick={onApprove}
              className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200"
              disabled={isLoading}
            >
              {t("approve")}
            </Button>
          )}
          <Button
            onClick={onEdit}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            disabled={isLoading}
          >
            {t("edit")}
          </Button>
          <Button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            disabled={isLoading}
          >
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
