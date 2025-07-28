"use client";

import { useTranslations } from "next-intl";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FormEvent, useState, useEffect } from "react";
import { X } from "lucide-react";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/utils/useRouter";

interface FormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
  name: string;
  birthDate: string;
  email: string;
  password: string;
  gender: string;
  position: string;
  profileImage: File | undefined;
}

export default function SignupDetailsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    country: "",
    city: "",
    region: "",
    churchId: "",
    name: "",
    birthDate: "",
    email: "",
    password: "",
    gender: "",
    position: "",
    profileImage: undefined,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 저장된 데이터 확인 및 리디렉션
  useEffect(() => {
    const savedData = localStorage.getItem("signupFormData");
    if (!savedData) {
      router.push("/signup");
      return;
    }
    const parsedData: FormData = JSON.parse(savedData);
    if (!parsedData.churchId) {
      router.push("/signup");
      return;
    }
    setFormData(parsedData);
    if (parsedData.birthDate) {
      setSelectedDate(new Date(parsedData.birthDate));
    }
  }, [router]);

  // churchId 기반으로 직분 목록 가져오기
  useEffect(() => {
    const fetchPositions = async () => {
      if (formData.churchId) {
        try {
          const response = await fetch(
            `/api/churches/${encodeURIComponent(formData.churchId)}/positions`
          );
          if (response.ok) {
            const data = await response.json();
            const positionOptions = data.map(
              (position: { id: string; name: string }) => ({
                value: position.id,
                label: position.name,
              })
            );
            positionOptions.push({
              value: "",
              label: t("enterPositionName"),
            });
            setPositions(positionOptions.reverse());
            setFormData((prev) => ({
              ...prev,
              position: positionOptions[0]?.value || "",
            }));
          } else {
            setPositions([]);
            setError(t("noPositionsFound"));
          }
        } catch (err) {
          console.error("직분 목록 가져오기 오류:", err);
          setPositions([]);
          setError(t("serverError"));
        }
      } else {
        setPositions([]);
        setFormData((prev) => ({ ...prev, position: "" }));
      }
    };

    fetchPositions();
  }, [formData.churchId, t]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setFormData((prev) => ({
      ...prev,
      birthDate: date ? date.toISOString().split("T")[0] : "",
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formDataToSubmit = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "profileImage" && value) {
        formDataToSubmit.append(key, value);
      } else if (value) {
        formDataToSubmit.append(key, value.toString());
      }
    });

    if (!formData.position) {
      setError(t("pleaseFillPositionFields"));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("signupFailed"));
        setIsSubmitting(false);
        return;
      }

      localStorage.removeItem("signupFormData");
      router.push(`/signup/complete`);
    } catch (err) {
      console.error("가입 오류:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    localStorage.setItem("signupFormData", JSON.stringify(formData));
    router.push("/signup");
  };

  const clearError = () => setError(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 sm:p-6"
    >
      {isSubmitting ? (
        <Loading />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 sm:p-10"
        >
          <div className="relative mb-8 py-1">
            <h1 className="text-xl font-bold text-gray-900 text-center">
              {t("signup.signupTitle")}
            </h1>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center">
              2 {t("step")} {t("of")} 2
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <motion.div
                className="bg-[#fc089e] h-2 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6 flex items-center justify-between bg-red-100 text-red-700 p-4 rounded-xl text-sm font-medium"
              >
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="hover:text-red-900 transition-colors duration-200"
                  aria-label={t("signup.dismissError")}
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <Input
              label={t("name")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
              placeholder={t("name")}
            />
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t("birthDate")}
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={t("birthDate")}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
                required
              />
            </div>
            <Input
              label={t("email")}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
              placeholder={t("email")}
            />
            <Input
              label={t("password")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
              placeholder={t("password")}
            />
            <Select
              label={t("gender")}
              name="gender"
              options={[
                { value: "", label: t("selectGender") },
                { value: "M", label: t("male") },
                { value: "F", label: t("female") },
              ]}
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("position")}
              name="position"
              options={positions}
              value={formData.position}
              onChange={handleInputChange}
              required
              disabled={!formData.churchId || positions.length === 0}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
            />

            <div className="col-span-full flex justify-center mt-8 gap-4">
              <Button variant="outline" type="button" onClick={handleBack}>
                {t("back")}
              </Button>
              <Button
                type="submit"
                isDisabled={
                  isSubmitting ||
                  !formData.name ||
                  !formData.birthDate ||
                  !formData.email ||
                  !formData.password ||
                  !formData.gender ||
                  !formData.position
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    {t("submitting")}
                  </span>
                ) : (
                  t("signup.signupTitle")
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}
