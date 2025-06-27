"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { FormEvent, useState, useEffect, useRef } from "react"; // useRef 추가
import { X } from "lucide-react";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";
import { useAuth } from "@/context/AuthContext";
import { toCamelCase } from "@/utils/toCamelCase";
import Chip from "@/components/Chip";
import {
  Group,
  SubGroup,
  Team,
  Duty,
  User as PrismaUser,
} from "@prisma/client";

interface ExtendedUser extends PrismaUser {
  groups: Group[];
  subGroups: SubGroup[];
  teams: Team[];
  duties: Duty[];
}

export default function MyPage() {
  const t = useTranslations("MyPage");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    email: "",
    password: "",
    phone: "",
    kakaoId: "",
    lineId: "",
    gender: "M",
    address: "",
    country: "",
    city: "",
    region: "",
    position: "",
    profileImage: undefined as File | undefined,
  });
  // const [positions, setPositions] = useState<
  //   { value: string; label: string }[]
  // >([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 미리보기 URL 상태
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 입력 참조

  // 사용자 정보 초기화 및 직분 조회
  useEffect(() => {
    if (!user) {
      return;
    }

    // useAuth의 user 객체로 formData 초기화
    setFormData({
      name: user.name || "",
      birthDate: user.birthDate
        ? new Date(user.birthDate).toISOString().split("T")[0]
        : "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      kakaoId: user.kakaoId || "",
      lineId: user.lineId || "",
      gender: user.gender || "M",
      address: user.address || "",
      country: user.country || "",
      city: user.city || "",
      region: user.region || "",
      position: user.position || "",
      profileImage: undefined,
    });

    // 초기 프로필 이미지 설정
    setPreviewImage(user.profileImage || null);

    // 직분 조회
    // const fetchPositions = async () => {
    //   if (user.churchId) {
    //     try {
    //       const response = await fetch(
    //         `/api/churches/${encodeURIComponent(user.churchId)}/positions`
    //       );
    //       if (response.ok) {
    //         const data = await response.json();
    //         setPositions(
    //           data.map((p: { id: string; name: string }) => ({
    //             value: p.id,
    //             label: p.name,
    //           }))
    //         );
    //       } else {
    //         setError(t("noPositionsFound"));
    //       }
    //     } catch (err) {
    //       console.error("Error fetching positions:", err);
    //       setError(t("serverError"));
    //     }
    //   }
    // };

    // fetchPositions();
  }, [user, router, t]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setError(t("unsupportedFileType"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t("fileTooLarge"));
        return;
      }
      setFormData((prev) => ({ ...prev, profileImage: file }));
      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  const handleImageClick = () => {
    // 이미지 클릭 시 파일 입력 트리거
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formDataToSubmit = new FormData();

    // 수정 가능 필드만 전송
    const fieldsToSubmit = [
      "name",
      "birthDate",
      "email",
      "password",
      "phone",
      "kakaoId",
      "lineId",
      "gender",
      "address",
      "country",
      "city",
      "region",
      "position",
      "profileImage",
    ];
    fieldsToSubmit.forEach((key) => {
      const value = formData[key as keyof typeof formData];
      if (key === "profileImage" && value) {
        formDataToSubmit.append(key, value);
      } else if (value && value !== "") {
        formDataToSubmit.append(key, value.toString());
      }
    });

    // 유효성 검사
    if (!formData.name || !formData.email || !formData.birthDate) {
      setError(t("requiredFields"));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("updateFailed"));
        setIsSubmitting(false);
        return;
      }

      setError(null);
      router.push("/mypage?success=true");
      setIsSubmitting(false);
    } catch (err) {
      console.error("Update error:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage); // 메모리 누수 방지
      }
    };
  }, [previewImage]);

  const clearError = () => setError(null);

  if (authLoading) {
    return <Loading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-8 sm:p-12"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 text-center tracking-tight">
          {t("title")}
        </h1>
        {/* 프로필 이미지 및 Role 배지 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className="relative w-32 h-32 rounded-full overflow-hidden shadow-md cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={handleImageClick}
          >
            <Image
              src={previewImage || user?.profileImage || "/default_user.png"}
              alt={t("profileImage")}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            name="profileImage"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            aria-label={t("profileImage")}
          />
          {user?.role && (
            <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {t(`${toCamelCase(user.role)}`)}
            </span>
          )}
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-between bg-red-50 text-red-600 p-4 rounded-lg text-sm"
            >
              <span>{error}</span>
              <button
                onClick={clearError}
                className="hover:text-red-800 transition-colors"
                aria-label={t("dismissError")}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups, SubGroups, Teams, Duties 배지 */}
        <div className="mb-6 text-center">
          {user && (
            <div className="flex flex-wrap justify-center gap-2">
              {(user as ExtendedUser).groups &&
                (user as ExtendedUser).groups.length > 0 &&
                (user as ExtendedUser).groups.map((group: Group) => (
                  <Chip key={`group-${group.id}`} label={group.name} />
                ))}
              {(user as ExtendedUser).subGroups &&
                (user as ExtendedUser).subGroups.length > 0 &&
                (user as ExtendedUser).subGroups.map((subGroup: SubGroup) => (
                  <Chip key={`subGroup-${subGroup.id}`} label={subGroup.name} />
                ))}
              {(user as ExtendedUser).teams &&
                (user as ExtendedUser).teams.length > 0 &&
                (user as ExtendedUser).teams.map((team: Team) => (
                  <Chip
                    key={`team-${team.id}`}
                    label={team.name}
                    color="yellow"
                  />
                ))}
              {(user as ExtendedUser).duties &&
                (user as ExtendedUser).duties.length > 0 &&
                (user as ExtendedUser).duties.map((duty: Duty) => (
                  <Chip key={`duty-${duty.id}`} label={duty.name} color="red" />
                ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Input
            label={t("name")}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("name")}
          />
          <Input
            label={t("birthDate")}
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
          />
          <Input
            label={t("email")}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("email")}
          />
          <Input
            label={t("password")}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("passwordPlaceholder")}
          />
          <Input
            label={t("phone")}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("phone")}
          />
          <Input
            label={t("kakaoId")}
            name="kakaoId"
            value={formData.kakaoId}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("kakaoId")}
          />
          <Input
            label={t("lineId")}
            name="lineId"
            value={formData.lineId}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("lineId")}
          />
          <Select
            label={t("gender")}
            name="gender"
            options={[
              { value: "M", label: t("male") },
              { value: "F", label: t("female") },
            ]}
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
          />
          <Input
            label={t("address")}
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("address")}
          />
          <Input
            label={t("country")}
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("country")}
          />
          <Input
            label={t("city")}
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("city")}
          />
          <Input
            label={t("region")}
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            placeholder={t("region")}
          />
          {/* <Select
            label={t("position")}
            name="position"
            options={positions}
            value={formData.position}
            onChange={handleInputChange}
            disabled={positions.length === 0}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200"
          /> */}

          <div className="col-span-full flex justify-center mt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 hover:scale-105 disabled:bg-gray-400 disabled:hover:bg-scale-100 disabled:hover:bg-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-50"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-100"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {t("submitting")}
                </span>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
