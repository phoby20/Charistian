// src/components/ChurchRegistrationStep3.tsx
"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { ChurchFormData } from "@/types/church";
import Loading from "../Loading";
import { Check } from "lucide-react";

interface ChurchRegistrationStep3Props {
  formData: ChurchFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePrevStep: () => void;
  isLoading: boolean;
}

export default function ChurchRegistrationStep3({
  formData,
  handleInputChange,
  handleSubmit,
  handlePrevStep,
  isLoading,
}: ChurchRegistrationStep3Props) {
  const t = useTranslations("churchRegistration");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 비밀번호 보안 강도 계산
  const passwordStrength = useMemo(() => {
    const password = formData.password;
    let score = 0;
    const rules = [
      { regex: /.{8,}/, met: password.length >= 8 }, // 최소 8자
      { regex: /[A-Z]/, met: /[A-Z]/.test(password) }, // 대문자
      { regex: /[a-z]/, met: /[a-z]/.test(password) }, // 소문자
      { regex: /[0-9]/, met: /[0-9]/.test(password) }, // 숫자
      { regex: /[!@#$%^&*]/, met: /[!@#$%^&*]/.test(password) }, // 특수문자
    ];

    score = rules.filter((rule) => rule.met).length;

    if (!password) return { level: "none", score: 0 };
    if (score <= 2) return { level: "weak", score };
    if (score <= 4) return { level: "moderate", score };
    return { level: "strong", score };
  }, [formData.password]);

  // 인증 이메일 발송
  const handleSendVerificationEmail = async () => {
    if (!formData.superAdminEmail) {
      setEmailError(t("superAdminEmailRequired"));
      setEmailSuccess(null);
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/church/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.superAdminEmail,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setEmailError(result.error || t("emailSendFailed"));
        setEmailSuccess(null);
      } else {
        setEmailError(null);
        setEmailSuccess(t("verificationEmailSent"));
      }
    } catch (error: unknown) {
      console.error("인증 이메일 전송 오류:", error);
      setEmailError(t("serverError"));
      setEmailSuccess(null);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 인증번호 검증
  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setEmailError(t("verificationCodeRequired"));
      setEmailSuccess(null);
      return;
    }

    try {
      const response = await fetch("/api/church/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.superAdminEmail,
          code: formData.verificationCode,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setEmailError(result.error || t("verificationFailed"));
        setEmailSuccess(null);
      } else {
        setEmailError(null);
        setEmailSuccess(null);
        handleInputChange({
          target: { name: "isEmailVerified", value: "true" },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    } catch (error: unknown) {
      console.error("이메일 인증 오류:", error);
      setEmailError(t("serverError"));
      setEmailSuccess(null);
    }
  };

  // 비밀번호 입력 여부 및 강도 확인
  const isPasswordFilled = formData.password.trim() !== "";
  const isPasswordStrong = passwordStrength.level === "strong";

  // 제출 시 비밀번호 유효성 검사
  const validatePassword = () => {
    const password = formData.password;
    if (!password) return t("passwordRequired");
    if (password.length < 8) return t("passwordMinLengthError");
    if (!/[A-Z]/.test(password)) return t("passwordUppercaseError");
    if (!/[a-z]/.test(password)) return t("passwordLowercaseError");
    if (!/[0-9]/.test(password)) return t("passwordNumberError");
    if (!/[!@#$%^&*]/.test(password)) return t("passwordSpecialCharError");
    return null;
  };

  // 폼 제출 핸들러 오버라이드
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validatePassword();
    if (error) {
      setPasswordError(error);
      return;
    }
    setPasswordError(null);
    await handleSubmit(e);
  };

  return (
    <motion.form
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div className="mb-10">
        <label className="block text-sm font-medium text-gray-800">
          {t("superAdminEmail")}
          <span className="text-red-600"> *</span>
        </label>
        <div className="flex items-center flex-col gap-4">
          <Input
            label=""
            type="email"
            name="superAdminEmail"
            value={formData.superAdminEmail}
            onChange={handleInputChange}
            required
            placeholder={t("superAdminEmail")}
            aria-label={t("superAdminEmail")}
            disabled={formData.isEmailVerified}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendVerificationEmail}
            isDisabled={isSendingEmail || formData.isEmailVerified}
          >
            {isSendingEmail ? <Loading /> : t("sendVerificationEmail")}
          </Button>
        </div>
        {emailError && (
          <p className="text-red-600 text-sm mt-1">{emailError}</p>
        )}
        {emailSuccess && (
          <p className="text-green-600 text-sm mt-1">{emailSuccess}</p>
        )}
      </div>
      <div className="mb-10">
        <label className="block text-sm font-medium text-gray-800">
          {t("verificationCode")}
          <span className="text-red-600"> *</span>
        </label>
        <div className="flex items-center gap-4 justify-center">
          <Input
            label=""
            name="verificationCode"
            value={formData.verificationCode || ""}
            onChange={handleInputChange}
            required
            placeholder={t("verificationCode")}
            disabled={formData.isEmailVerified}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleVerifyCode}
            isDisabled={formData.isEmailVerified}
          >
            {formData.isEmailVerified ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t("verified")}
              </>
            ) : (
              t("verify")
            )}
          </Button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800">
          {t("password")}
          <span className="text-red-600"> *</span>
        </label>
        <Input
          label=""
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) => {
            handleInputChange(e);
            setPasswordError(null); // 입력 변경 시 에러 초기화
          }}
          required
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
          placeholder={t("password")}
        />
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-800">
            {t("passwordStrength")}:{" "}
            <span
              className={
                passwordStrength.level === "none" ||
                passwordStrength.level === "weak"
                  ? "text-red-600"
                  : passwordStrength.level === "moderate"
                    ? "text-yellow-600"
                    : "text-green-600"
              }
            >
              {t(passwordStrength.level)}
            </span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={
                passwordStrength.level === "none"
                  ? "bg-gray-200 h-2 rounded-full"
                  : passwordStrength.level === "weak"
                    ? "bg-red-600 h-2 rounded-full"
                    : passwordStrength.level === "moderate"
                      ? "bg-yellow-600 h-2 rounded-full"
                      : "bg-green-600 h-2 rounded-full"
              }
              style={{
                width:
                  passwordStrength.level === "none"
                    ? "0%"
                    : passwordStrength.level === "weak"
                      ? "33%"
                      : passwordStrength.level === "moderate"
                        ? "66%"
                        : "100%",
              }}
            />
          </div>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li className="flex items-center">
              {formData.password.length >= 8 && (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              )}
              <span
                className={
                  formData.password.length >= 8
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {t("passwordMinLength")}
              </span>
            </li>
            <li className="flex items-center">
              {/[A-Z]/.test(formData.password) && (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              )}
              <span
                className={
                  /[A-Z]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {t("passwordUppercase")}
              </span>
            </li>
            <li className="flex items-center">
              {/[a-z]/.test(formData.password) && (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              )}
              <span
                className={
                  /[a-z]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {t("passwordLowercase")}
              </span>
            </li>
            <li className="flex items-center">
              {/[0-9]/.test(formData.password) && (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              )}
              <span
                className={
                  /[0-9]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {t("passwordNumber")}
              </span>
            </li>
            <li className="flex items-center">
              {/[!@#$%^&*]/.test(formData.password) && (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              )}
              <span
                className={
                  /[!@#$%^&*]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {t("passwordSpecialChar")}
              </span>
            </li>
          </ul>
          {passwordError && (
            <p className="text-red-600 text-sm mt-1">{passwordError}</p>
          )}
        </div>
      </div>
      <div className="flex justify-between gap-4 mt-14">
        <Button variant="outline" type="button" onClick={handlePrevStep}>
          {t("back")}
        </Button>
        <Button
          type="submit"
          isDisabled={
            isLoading ||
            !formData.isEmailVerified ||
            !isPasswordFilled ||
            !isPasswordStrong
          }
        >
          {isLoading ? <Loading /> : t("submit")}
        </Button>
      </div>
    </motion.form>
  );
}
