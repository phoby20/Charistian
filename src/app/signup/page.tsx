"use client";

import { useTranslation } from "next-i18next";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { appWithTranslation } from "next-i18next";
import { citiesByCountry } from "@/data/cities";
import { regionsByCity } from "@/data/regions";
import { countryOptions } from "@/data/country";
import { X } from "lucide-react";
import Loading from "@/components/Loading";

function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [churches, setChurches] = useState<{ value: string; label: string }[]>(
    []
  );
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for loading state
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
    churchId: "",
  });

  // Initial setup: Country, City, Region
  useEffect(() => {
    if (countryOptions.length > 0 && isInitialLoad) {
      const defaultCountry = countryOptions[0].value || "";
      const defaultCity = citiesByCountry[defaultCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCountry(defaultCountry);
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        country: defaultCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      }));
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Country change: Reset City, Region, Church, Position
  useEffect(() => {
    if (selectedCountry && !isInitialLoad) {
      const defaultCity = citiesByCountry[selectedCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        country: selectedCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      }));
      setChurches([]);
      setPositions([]);
    }
  }, [selectedCountry, isInitialLoad]);

  // City change: Reset Region, Church, Position
  useEffect(() => {
    if (selectedCity && !isInitialLoad) {
      const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
      setSelectedRegion(defaultRegion);
      setFormData((prev) => ({
        ...prev,
        city: selectedCity,
        region: defaultRegion,
        churchId: "",
        position: "",
      }));
      setChurches([]);
      setPositions([]);
    }
  }, [selectedCity, isInitialLoad]);

  // Region change: Fetch Churches
  useEffect(() => {
    const fetchChurches = async () => {
      if (selectedCountry && selectedCity && selectedRegion && !isInitialLoad) {
        try {
          const response = await fetch(
            `/api/churches/filter?country=${encodeURIComponent(
              selectedCountry
            )}&city=${encodeURIComponent(
              selectedCity
            )}&region=${encodeURIComponent(selectedRegion)}`
          );
          if (response.ok) {
            const data = await response.json();
            setChurches(
              data.map((church: { id: string; name: string }) => ({
                value: church.id,
                label: church.name,
              }))
            );
            setSelectedChurch(data[0]?.id || "");
          } else {
            setChurches([]);
            setPositions([]);
            setError(t("noChurchesFound"));
          }
        } catch (err) {
          console.error("Error fetching churches:", err);
          setChurches([]);
          setPositions([]);
          setError(t("serverError"));
        }
      } else {
        setChurches([]);
        setPositions([]);
      }
    };

    fetchChurches();
  }, [selectedRegion, isInitialLoad, selectedCountry, selectedCity]);

  // Church change: Fetch Positions
  useEffect(() => {
    const fetchPositions = async () => {
      if (selectedChurch && !isInitialLoad) {
        try {
          const response = await fetch(
            `/api/churches/${encodeURIComponent(selectedChurch)}/positions`
          );
          if (response.ok) {
            const data = await response.json();
            setPositions(
              data.map((position: { id: string; name: string }) => ({
                value: position.id,
                label: position.name,
              }))
            );
            setFormData((prev) => ({ ...prev, position: "" }));
          } else {
            setPositions([]);
            setError(t("noPositionsFound"));
          }
        } catch (err) {
          console.error("Error fetching positions:", err);
          setPositions([]);
          setError(t("serverError"));
        }
      } else {
        setPositions([]);
        setFormData((prev) => ({ ...prev, position: "" }));
      }
    };

    fetchPositions();
  }, [formData.churchId, isInitialLoad, selectedChurch]);

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
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formDataToSubmit = new FormData(e.currentTarget);

    if (!formDataToSubmit.get("city")) {
      setError(t("pleaseFillCityFields"));
      setIsSubmitting(false);
      return;
    }

    if (!formDataToSubmit.get("region")) {
      setError(t("pleaseFillRegionFields"));
      setIsSubmitting(false);
      return;
    }

    if (!formDataToSubmit.get("churchId")) {
      setError(t("pleaseFillChurchFields"));
      setIsSubmitting(false);
      return;
    }

    if (!formDataToSubmit.get("position")) {
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

      router.push("/signup/complete");
    } catch (err) {
      console.error("Signup error:", err);
      setError(t("serverError"));
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6">
      {isSubmitting || (isInitialLoad && <Loading />)}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-8 text-center">
          {t("signup")}
        </h1>
        {error && (
          <div className="mb-6 flex items-center justify-between bg-red-50 text-red-600 p-4 rounded-lg text-sm animate-slide-in">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="hover:text-red-800 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}
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
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("name")}
          />
          <Input
            label={t("birthDate")}
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Input
            label={t("email")}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("email")}
          />
          <Input
            label={t("password")}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("password")}
          />
          <Input
            label={t("phone")}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("phone")}
          />
          <Input
            label={t("kakaoId")}
            name="kakaoId"
            value={formData.kakaoId}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("kakaoId")}
          />
          <Input
            label={t("lineId")}
            name="lineId"
            value={formData.lineId}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
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
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Input
            label={t("address")}
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder={t("address")}
          />
          <Select
            label={t("country")}
            name="country"
            options={countryOptions}
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Select
            label={t("city")}
            name="city"
            options={citiesByCountry[selectedCountry] || []}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Select
            label={t("region")}
            name="region"
            options={regionsByCity[selectedCity] || []}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Select
            label={t("church")}
            name="churchId"
            options={churches}
            value={selectedChurch}
            onChange={(e) => {
              setSelectedChurch(e.target.value);
            }}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
          />
          <Select
            label={t("position")}
            name="position"
            options={positions}
            value={formData.position}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
            disabled={!selectedChurch || positions.length === 0}
          />
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("profileImage")}{" "}
              <span className="text-gray-400">({t("optional")})</span>
            </label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all duration-200"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  {t("submitting")}
                </span>
              ) : (
                t("signup")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default appWithTranslation(SignupPage);
