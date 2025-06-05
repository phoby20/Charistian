"use client";

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
  Team,
} from "@/types/customUser";
import { countryOptions } from "@/data/country";
import { citiesByCountry } from "@/data/cities";
import { regionsByCity } from "@/data/regions";
import { motion, AnimatePresence } from "framer-motion";

interface SelectOption {
  value: string;
  label: string;
}

interface Field {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "date"
    | "select"
    | "selectPosition"
    | "selectGroup"
    | "selectSubGroup"
    | "selectDuties"
    | "selectTeams"
    | "selectCountry"
    | "selectCity"
    | "selectRegion";
  options?: string[] | SelectOption[];
  icon?: string;
  required?: boolean;
}

interface UserDetailEditFormProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  positions: Position[];
  groups: Group[];
  subGroups: SubGroup[];
  duties: Duty[];
  teams: Team[];
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
  subGroups: initialSubGroups,
  duties,
  teams,
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
    teamIds: user.teams ? user.teams.map((team) => team.id) : [],
    gender: user.gender || "",
    country: user.country || "",
    city: user.city || "",
    region: user.region || "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [subGroups, setSubGroups] = useState<SubGroup[]>(initialSubGroups);
  const [subGroupLoading, setSubGroupLoading] = useState<boolean>(false);
  const [subGroupError, setSubGroupError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      ...user,
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      groupId: user.group?.id || null,
      subGroupId: user.subGroup?.id || null,
      dutyIds: user.duties ? user.duties.map((duty) => duty.id) : [],
      teamIds: user.teams ? user.teams.map((team) => team.id) : [],
      gender: user.gender || "",
      country: user.country || "",
      city: user.city || "",
      region: user.region || "",
    });
    setSubGroups(initialSubGroups);
  }, [user, initialSubGroups]);

  if (!user.churchId) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-600 text-center p-4 text-sm"
      >
        {t("noChurchId")}
      </motion.p>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
      ...(name === "country" ? { city: null, region: null } : {}),
      ...(name === "city" ? { region: null } : {}),
    }));
  };

  const handleGroupChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value || null;
    setFormData((prev) => ({ ...prev, groupId, subGroupId: null }));
    setSubGroupError(null);

    if (groupId) {
      setSubGroupLoading(true);
      try {
        const response = await fetch(
          `/api/subGroups?groupId=${groupId}&churchId=${user.churchId}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "서브그룹을 가져오지 못했습니다.");
        }
        const { subGroups: fetchedSubGroups } = await response.json();
        setSubGroups(fetchedSubGroups || []);
      } catch (err) {
        console.error("서브그룹 가져오기 오류:", err);
        setSubGroupError(
          err instanceof Error ? err.message : t("subGroupFetchError")
        );
        setSubGroups([]);
      } finally {
        setSubGroupLoading(false);
      }
    } else {
      setSubGroups([]);
    }
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

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, teamIds: selectedOptions }));
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
          teamIds: formData.teamIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("updateFailed"));
      }

      const apiUser = await response.json();

      const updatedUser: User = {
        ...user,
        name: apiUser.user.name || formData.name,
        email: apiUser.user.email || formData.email,
        phone: apiUser.user.phone || formData.phone,
        kakaoId: apiUser.user.kakaoId || formData.kakaoId,
        lineId: apiUser.user.lineId || formData.lineId,
        country: apiUser.user.country || formData.country,
        city: apiUser.user.city || formData.city,
        region: apiUser.user.region || formData.region,
        address: apiUser.user.address || formData.address,
        birthDate: apiUser.user.birthDate || formData.birthDate,
        gender: apiUser.user.gender || formData.gender,
        position:
          apiUser.user.position ||
          positions.find((p) => p.id === formData.position?.id) ||
          null,
        group:
          apiUser.user.group ||
          groups.find((g) => g.id === formData.groupId) ||
          null,
        subGroup:
          apiUser.user.subGroup ||
          subGroups.find((sg) => sg.id === formData.subGroupId) ||
          null,
        duties:
          apiUser.user.duties ||
          duties.filter((d) => formData.dutyIds.includes(d.id)) ||
          [],
        teams:
          apiUser.user.teams ||
          teams.filter((t) => formData.teamIds.includes(t.id)) ||
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
      teamIds: user.teams ? user.teams.map((team) => team.id) : [],
      gender: user.gender || "",
      country: user.country || "",
      city: user.city || "",
      region: user.region || "",
    });
    setFormError(null);
    setSubGroupError(null);
    setSubGroups(initialSubGroups);
    onClose();
  };

  const fields: Field[] = [
    { key: "phone", label: t("phone"), type: "text", icon: "phone" },
    { key: "kakaoId", label: t("kakaoId"), type: "text", icon: "chat" },
    { key: "lineId", label: t("lineId"), type: "text", icon: "chat" },
    {
      key: "country",
      label: t("country"),
      type: "selectCountry",
      options: countryOptions,
      icon: "globe",
    },
    {
      key: "city",
      label: t("city"),
      type: "selectCity",
      options: citiesByCountry[formData.country || ""] || [],
      icon: "map-pin",
    },
    {
      key: "region",
      label: t("region"),
      type: "selectRegion",
      options: regionsByCity[formData.city || ""] || [],
      icon: "map-pin",
    },
    { key: "address", label: t("address"), type: "textarea", icon: "home" },
    {
      key: "birthDate",
      label: t("birthDate"),
      type: "date",
      icon: "calendar",
      required: true,
    },
    {
      key: "gender",
      label: t("gender"),
      type: "select",
      options: ["Male", "Female"],
      icon: "user",
      required: true,
    },
    {
      key: "position",
      label: t("position"),
      type: "selectPosition",
      icon: "briefcase",
    },
    { key: "groupId", label: t("group"), type: "selectGroup", icon: "users" },
    {
      key: "subGroupId",
      label: t("subGroup"),
      type: "selectSubGroup",
      icon: "users",
    },
    {
      key: "dutyIds",
      label: t("duties"),
      type: "selectDuties",
      icon: "check-square",
    },
    { key: "teamIds", label: t("teams"), type: "selectTeams", icon: "team" },
  ];

  if (isLoading) return <Loading />;
  if (parentError)
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-red-600 text-center p-4 text-sm"
      >
        {parentError}
      </motion.p>
    );

  return (
    <Modal isOpen={isOpen}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pt-2">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl tracking-tight">
            {t("userDetails")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            aria-label={t("close")}
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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

        {/* 에러 메시지 */}
        {(formError || parentError || subGroupError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-center mb-4 text-sm bg-red-50 p-2 rounded-lg"
          >
            {formError || parentError || subGroupError}
          </motion.p>
        )}

        {/* 프로필 섹션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Image
                src={user.profileImage || "/default_user.png"}
                alt={user.name}
                width={56}
                height={56}
                className="rounded-full object-cover border-2 border-gray-200 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => (e.currentTarget.src = "/default_user.png")}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-300 transition-all" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 flex items-center">
                {t("name")} <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
                required
                aria-label={t("name")}
                disabled={isLoading}
              />
            </div>
          </div>
        </motion.div>

        {/* 입력 필드 */}
        <div className="space-y-3">
          <AnimatePresence>
            {fields.map(
              ({ key, label, type, options, icon, required }, index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 mt-1">
                      {icon === "phone" && "📞"}
                      {icon === "chat" && "💬"}
                      {icon === "globe" && "🌍"}
                      {icon === "map-pin" && "📍"}
                      {icon === "home" && "🏠"}
                      {icon === "calendar" && "📅"}
                      {icon === "user" && "👤"}
                      {icon === "briefcase" && "💼"}
                      {icon === "users" && "👥"}
                      {icon === "check-square" && "✅"}
                      {icon === "team" && "🤝"}
                    </span>
                    <div className="flex-1 relative">
                      <label className="text-sm font-medium text-gray-600 flex items-center">
                        {label}{" "}
                        {required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {type === "textarea" ? (
                        <textarea
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all min-h-[80px]"
                          aria-label={label}
                          disabled={isLoading}
                        />
                      ) : type === "select" ? (
                        <select
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
                          aria-label={label}
                          disabled={isLoading}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {(options as string[])?.map((opt) => (
                            <option key={opt} value={opt}>
                              {t(opt)}
                            </option>
                          ))}
                        </select>
                      ) : type === "selectCountry" ? (
                        <select
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
                          aria-label={label}
                          disabled={isLoading}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {(options as SelectOption[])?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.label)}
                            </option>
                          ))}
                        </select>
                      ) : type === "selectCity" ? (
                        <select
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
                          aria-label={label}
                          disabled={isLoading || !formData.country}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {(options as SelectOption[])?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.label)}
                            </option>
                          ))}
                        </select>
                      ) : type === "selectRegion" ? (
                        <select
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
                          aria-label={label}
                          disabled={isLoading || !formData.city}
                        >
                          <option value="">{t("selectPlaceholder")}</option>
                          {(options as SelectOption[])?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.label)}
                            </option>
                          ))}
                        </select>
                      ) : type === "selectPosition" ? (
                        <select
                          value={formData.position?.id || ""}
                          onChange={handlePositionChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
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
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
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
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all appearance-none"
                          aria-label={label}
                          disabled={
                            !formData.groupId || isLoading || subGroupLoading
                          }
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
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all h-[100px]"
                          aria-label={label}
                          disabled={isLoading}
                        >
                          {duties.map((duty) => (
                            <option key={duty.id} value={duty.id}>
                              {duty.name}
                            </option>
                          ))}
                        </select>
                      ) : type === "selectTeams" ? (
                        <select
                          multiple
                          value={formData.teamIds || []}
                          onChange={handleTeamChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all h-[100px]"
                          aria-label={label}
                          disabled={isLoading}
                        >
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          name={key}
                          value={
                            (formData[key as keyof FormData] as string) || ""
                          }
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm hover:shadow-md transition-all"
                          aria-label={label}
                          required={required}
                          disabled={isLoading}
                        />
                      )}
                      {subGroupLoading && key === "subGroupId" && (
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                          Loading...
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* 버튼 바 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0 bg-white pt-4 mt-6 border-t border-gray-200"
        >
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              disabled={isLoading || subGroupLoading}
            >
              {t("save")}
            </Button>
            <Button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 hover:scale-105 transition-all duration-200"
              disabled={isLoading || subGroupLoading}
            >
              {t("cancel")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </Modal>
  );
}
