// src/app/signup/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { appWithTranslation } from "next-i18next";

function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        body: formData, // FormData를 직접 전송
      });

      if (!response.ok) {
        setError(t("signupFailed"));
        return;
      }

      router.push("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError(t("serverError"));
    }
  };

  const positions = [
    { value: "PASTOR", label: t("pastor") },
    { value: "EVANGELIST", label: t("evangelist") },
    // ... 기타 직분
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6">{t("signup")}</h1>
        <form onSubmit={handleSubmit}>
          <Input label={t("name")} name="name" required />
          <Input label={t("birthDate")} type="date" name="birthDate" required />
          <Input label={t("email")} type="email" name="email" required />
          <Input
            label={t("password")}
            type="password"
            name="password"
            required
          />
          <Input label={t("phone")} type="tel" name="phone" />
          <Input label={t("kakaoId")} name="kakaoId" />
          <Input label={t("lineId")} name="lineId" />
          <Select
            label={t("gender")}
            name="gender"
            options={[
              { value: "M", label: t("male") },
              { value: "F", label: t("female") },
            ]}
            required
          />
          <Input label={t("address")} name="address" />
          <Input label={t("country")} name="country" required />
          <Input label={t("region")} name="region" />
          <Input label={t("churchId")} name="churchId" required />
          <Select
            label={t("position")}
            name="position"
            options={positions}
            required
          />
          <Input label={t("groupId")} name="groupId" required />
          <input type="file" name="profileImage" accept="image/*" />
          <Button type="submit">{t("signup")}</Button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}

export default appWithTranslation(SignupPage);
