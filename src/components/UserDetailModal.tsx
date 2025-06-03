// src/components/UserDetailModal.tsx
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import Image from "next/image";
import { User as PrismaUser } from "@prisma/client";

interface Position {
  id: string;
  name: string;
}

interface User
  extends Omit<PrismaUser, "position" | "birthDate" | "createdAt"> {
  position: Position | null;
  birthDate: string; // API 응답과 일치
  createdAt: string; // API 응답과 일치
}

interface FormData extends Omit<User, "birthDate" | "createdAt"> {
  birthDate: string; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    ...user,
    birthDate: user.birthDate.split("T")[0], // ISO 문자열에서 YYYY-MM-DD 추출
    createdAt: user.createdAt.split("T")[0], // ISO 문자열에서 YYYY-MM-DD 추출
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch("/api/positions");
        if (!response.ok) throw new Error("Failed to fetch positions");
        const { positions } = await response.json();
        setPositions(positions);
      } catch (err) {
        console.error("Error fetching positions:", err);
        setError(t("serverError"));
      }
    };
    fetchPositions();
  }, []);

  useEffect(() => {
    setFormData({
      ...user,
      birthDate: user.birthDate.split("T")[0],
      createdAt: user.createdAt.split("T")[0],
    });
    setIsEditing(false);
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const positionId = e.target.value;
    const selectedPosition =
      positions.find((pos) => pos.id === positionId) || null;
    setFormData((prev) => ({ ...prev, position: selectedPosition }));
  };

  const validateForm = () => {
    if (!formData.name) return t("required", { field: t("name") });
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return t("invalidEmail");
    if (!formData.birthDate) return t("required", { field: t("birthDate") });
    if (!formData.gender) return t("required", { field: t("gender") });
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          kakaoId: formData.kakaoId,
          lineId: formData.lineId,
          country: formData.country,
          city: formData.city,
          region: formData.region,
          address: formData.address,
          birthDate: formData.birthDate, // YYYY-MM-DD 그대로 전송
          gender: formData.gender,
          positionId: formData.position?.id || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update user");
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError(t("serverError"));
    }
  };

  const handleCancel = () => {
    setFormData({
      ...user,
      birthDate: user.birthDate.split("T")[0],
      createdAt: user.createdAt.split("T")[0],
    });
    setIsEditing(false);
    setError(null);
  };

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

        {error && <p className="text-red-600 mb-4">{error}</p>}

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
              {isEditing ? (
                <>
                  <label className="text-sm font-medium text-gray-700">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label={t("name")}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "phone", label: t("phone"), type: "text" },
              { key: "kakaoId", label: t("kakaoId"), type: "text" },
              { key: "lineId", label: t("lineId"), type: "text" },
              { key: "country", label: t("country"), type: "text" },
              { key: "city", label: t("city"), type: "text" },
              { key: "region", label: t("region"), type: "text" },
              { key: "address", label: t("address"), type: "textarea" },
              { key: "birthDate", label: t("birthDate"), type: "date" },
              {
                key: "gender",
                label: t("gender"),
                type: "select",
                options: ["Male", "Female"],
              },
              { key: "position", label: t("position"), type: "selectPosition" },
              {
                key: "createdAt",
                label: t("createdAt"),
                type: "text",
                disabled: true,
              },
            ].map(({ key, label, type, options, disabled }) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {isEditing ? (
                  type === "textarea" ? (
                    <textarea
                      name={key}
                      value={(formData[key as keyof FormData] as string) || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      aria-label={label}
                    />
                  ) : type === "select" ? (
                    <select
                      name={key}
                      value={(formData[key as keyof FormData] as string) || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      aria-label={label}
                    >
                      <option value="">{t("selectOption")}</option>
                      {options!.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : type === "selectPosition" ? (
                    <select
                      value={formData.position?.id || ""}
                      onChange={handlePositionChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      aria-label={label}
                    >
                      <option value="">{t("noPosition")}</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      name={key}
                      value={
                        key === "birthDate" || key === "createdAt"
                          ? (formData[key as keyof FormData] as string)
                          : (formData[key as keyof FormData] as string) || ""
                      }
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      disabled={disabled}
                      aria-label={label}
                      required={[
                        "name",
                        "email",
                        "birthDate",
                        "gender",
                      ].includes(key)}
                    />
                  )
                ) : (
                  <p className="text-sm text-gray-900">
                    {key === "birthDate" || key === "createdAt"
                      ? new Date(
                          formData[key as keyof FormData] as string
                        ).toLocaleDateString()
                      : key === "position"
                      ? formData.position?.name || t("noPosition")
                      : (formData[key as keyof FormData] as string) ||
                        t("none")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                {t("save")}
              </Button>
            </>
          ) : (
            <>
              {onReject && (
                <Button
                  onClick={onReject}
                  className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  {t("reject")}
                </Button>
              )}
              {onApprove && (
                <Button
                  onClick={onApprove}
                  className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  {t("approve")}
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                {t("edit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
