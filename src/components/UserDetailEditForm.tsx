// src/components/UserDetailEditForm.tsx
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import Image from "next/image";
import Loading from "./Loading";
import {
  User,
  FormData,
  Position,
  Group,
  SubGroup,
  Duty,
} from "@/types/customUser";

interface UserDetailEditFormProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  positions: Position[];
  groups: Group[];
  subGroups: SubGroup[];
  duties: Duty[];
  isLoading: boolean;
  error: string | null;
}

export default function UserDetailEditForm({
  user,
  isOpen,
  onClose,
  onSave,
  positions,
  groups,
  subGroups,
  duties,
  isLoading,
  error: parentError,
}: UserDetailEditFormProps) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState<FormData>({
    ...user,
    birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
    groupId: user.group?.id || null,
    subGroupId: user.subGroup?.id || null,
    dutyIds: user.duties ? user.duties.map((duty) => duty.id) : [],
    gender: user.gender || "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      ...user,
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      groupId: user.group?.id || null,
      subGroupId: user.subGroup?.id || null,
      dutyIds: user.duties ? user.duties.map((duty) => duty.id) : [],
      gender: user.gender || "",
    });
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value || null;
    setFormData((prev) => ({ ...prev, groupId, subGroupId: null }));
  };

  const handleSubGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subGroupId = e.target.value || null;
    setFormData((prev) => ({ ...prev, subGroupId }));
  };

  const handleDutyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, dutyIds: selectedOptions }));
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
    if (formData.subGroupId && !formData.groupId) return t("selectGroupFirst");
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
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
          birthDate: formData.birthDate,
          gender: formData.gender,
          positionId: formData.position?.id || null,
          groupId: formData.groupId,
          subGroupId: formData.subGroupId,
          dutyIds: formData.dutyIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "사용자 업데이트에 실패했습니다.");
      }

      const apiUser = await response.json();
      console.log("API 응답:", apiUser);

      const updatedUser: User = {
        ...user,
        name: apiUser.name || formData.name,
        email: apiUser.email || formData.email,
        phone: apiUser.phone || formData.phone,
        kakaoId: apiUser.kakaoId || formData.kakaoId,
        lineId: apiUser.lineId || formData.lineId,
        country: apiUser.country || formData.country,
        city: apiUser.city || formData.city,
        region: apiUser.region || formData.region,
        address: apiUser.address || formData.address,
        birthDate: apiUser.birthDate || formData.birthDate,
        gender: apiUser.gender || formData.gender,
        position:
          apiUser.position ||
          positions.find((p) => p.id === formData.position?.id) ||
          null,
        group:
          apiUser.group ||
          groups.find((g) => g.id === formData.groupId) ||
          null,
        subGroup:
          apiUser.subGroup ||
          subGroups.find((sg) => sg.id === formData.subGroupId) ||
          null,
        duties:
          apiUser.duties ||
          duties.filter((d) => formData.dutyIds.includes(d.id)) ||
          [],
        churchId: user.churchId,
        createdAt: user.createdAt,
        id: user.id,
      };

      setFormError(null);
      onSave(updatedUser);
    } catch (err) {
      console.error("사용자 업데이트 오류:", err);
      setFormError(err instanceof Error ? err.message : t("serverError"));
    }
  };

  const handleCancel = () => {
    setFormData({
      ...user,
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      groupId: user.group?.id || null,
      subGroupId: user.subGroup?.id || null,
      dutyIds: user.duties ? user.duties.map((duty) => duty.id) : [],
      gender: user.gender || "",
    });
    setFormError(null);
    onClose();
  };

  const fields = [
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
    { key: "groupId", label: t("group"), type: "selectGroup" },
    { key: "subGroupId", label: t("subGroup"), type: "selectSubGroup" },
    { key: "dutyIds", label: t("duties"), type: "selectDuties" },
  ];

  if (isLoading) return <Loading />;
  if (parentError) return <p className="text-red-600">{parentError}</p>;

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

        {(formError || parentError) && (
          <p className="text-red-600 mb-4">{formError || parentError}</p>
        )}

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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ key, label, type, options }) => (
              <div key={key}>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {type === "textarea" ? (
                  <textarea
                    name={key}
                    value={(formData[key as keyof FormData] as string) || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    disabled={isLoading}
                  />
                ) : type === "select" ? (
                  <select
                    name={key}
                    value={(formData[key as keyof FormData] as string) || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    disabled={isLoading}
                  >
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
                    disabled={isLoading}
                  >
                    <option value="">{t("noPosition")}</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                ) : type === "selectGroup" ? (
                  <select
                    value={formData.groupId || ""}
                    onChange={handleGroupChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    disabled={isLoading}
                  >
                    <option value="">{t("noGroup")}</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                ) : type === "selectSubGroup" ? (
                  <select
                    value={formData.subGroupId || ""}
                    onChange={handleSubGroupChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    disabled={!formData.groupId || isLoading}
                  >
                    <option value="">{t("noSubGroup")}</option>
                    {subGroups.map((subGroup) => (
                      <option key={subGroup.id} value={subGroup.id}>
                        {subGroup.name}
                      </option>
                    ))}
                  </select>
                ) : type === "selectDuties" ? (
                  <select
                    multiple
                    value={formData.dutyIds || []}
                    onChange={handleDutyChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    disabled={isLoading}
                  >
                    {duties.map((duty) => (
                      <option key={duty.id} value={duty.id}>
                        {duty.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    name={key}
                    value={(formData[key as keyof FormData] as string) || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-label={label}
                    required={["name", "email", "birthDate", "gender"].includes(
                      key as string
                    )}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-3">
          <Button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            disabled={isLoading}
          >
            {t("save")}
          </Button>
          <Button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
