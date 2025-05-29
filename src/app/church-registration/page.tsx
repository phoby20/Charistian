"use client";

import { useTranslation } from "next-i18next";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { regionsByCity } from "@/data/regions/regions";
import { citiesByCountry } from "@/data/cities";
import { countryOptions } from "@/data/country";

export default function ChurchRegistrationPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("Korea"); // 기본값을 "Korea"로 설정
  const [selectedCity, setSelectedCity] = useState<string>("Seoul");
  const [selectedRegion, setSelectedRegion] = useState<string>("Gangnam");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/church/register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || t("registrationFailed"));
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(t("serverError"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6">{t("churchRegistration")}</h1>
        <form onSubmit={handleSubmit}>
          <Input label={t("churchName")} name="churchName" required />
          <Select
            label={t("country")}
            name="country"
            options={countryOptions}
            required
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedCity(""); // 도시 초기화
            }}
          />
          <Select
            label={t("city")}
            name="city"
            options={citiesByCountry[selectedCountry] || []}
            required
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          />
          <Select
            label={t("region")}
            name="region"
            value={selectedRegion}
            options={regionsByCity[selectedCity] || []}
            onChange={(e) => setSelectedRegion(e.target.value)}
            required
          />
          <Input label={t("address")} name="address" required />
          <Input label={t("churchPhone")} name="churchPhone" required />
          <Input
            label={t("superAdminEmail")}
            name="superAdminEmail"
            type="email"
            required
          />
          <Input
            label={t("password")}
            name="password"
            type="password"
            required
          />
          <Input label={t("contactName")} name="contactName" required />
          <Input label={t("contactPosition")} name="contactPosition" required />
          <Input label={t("contactPhone")} name="contactPhone" required />
          <Select
            label={t("contactGender")}
            name="contactGender"
            options={[
              { value: "M", label: t("male") },
              { value: "F", label: t("female") },
            ]}
            required
          />
          <Input
            label={t("contactBirthDate")}
            type="date"
            name="contactBirthDate"
            required
          />
          <Select
            label={t("plan")}
            name="plan"
            options={[
              { value: "FREE", label: t("free") },
              { value: "SMART", label: t("smart") },
              { value: "ENTERPRISE", label: t("enterprise") },
            ]}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              {t("contactImage")}
            </label>
            <input
              type="file"
              name="contactImage"
              accept="image/*"
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              {t("buildingImage")}
            </label>
            <input
              type="file"
              name="buildingImage"
              accept="image/*"
              className="mt-1"
            />
          </div>
          <Button type="submit">{t("churchRegistration")}</Button>
        </form>
        <Modal isOpen={!!error} onClose={() => setError(null)}>
          <p>{error}</p>
          <Button onClick={() => setError(null)}>{t("confirm")}</Button>
        </Modal>
      </div>
    </div>
  );
}
