// src/app/[locale]/scores/upload/master/page.tsx
"use client";

import { ComposerLyricistSection } from "@/components/scores/ComposerLyricistSection";
import { DescriptionSection } from "@/components/scores/DescriptionSection";
import { FileUploadSection } from "@/components/scores/FileUploadSection";
import { LyricsSection } from "@/components/scores/LyricsSection";
import { OptionsSection } from "@/components/scores/OptionsSection";
import { ReferenceUrlsSection } from "@/components/scores/ReferenceUrlsSection";
import { TempoSection } from "@/components/scores/TempoSection";
import { TitleSection } from "@/components/scores/TitleSection";
import { GENRES } from "@/data/genre";
import { citiesByCountry } from "@/data/cities";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Select from "@/components/Select";
import Loading from "@/components/Loading";
import { countryOptions } from "@/data/country";
import { regionsByCity } from "@/data/regions";
import { ScoreFormData } from "@/types/score";
import { constants } from "@/constants/intex";

const { KEYS, TONES } = constants;

// 타입 가드를 위한 유틸리티 함수
const isValidKey = (value: string): value is (typeof KEYS)[number] =>
  KEYS.includes(value as (typeof KEYS)[number]);
const isValidTone = (value: string): value is (typeof TONES)[number] =>
  TONES.includes(value as (typeof TONES)[number]);

interface ChurchOption {
  value: string;
  label: string;
}

interface ChurchFormData {
  country: string;
  city: string;
  region: string;
  churchId: string;
}

export default function ScoreUploadPageForMaster() {
  const t = useTranslations("MasterScoreUpload");
  const router = useRouter();
  const locale = useLocale();

  // Form state
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ScoreFormData>({
    defaultValues: {
      title: "",
      titleEn: "",
      titleJa: "",
      description: "",
      tempo: "",
      file: null,
      thumbnail: null,
      price: "",
      referenceUrls: [{ url: "" }],
      lyrics: "",
      lyricsEn: "",
      lyricsJa: "",
      composer: "",
      lyricist: "",
      saleStartDate: "",
      saleEndDate: "",
      isPublic: false,
      isForSale: false,
      isOriginal: false,
      genre: "",
      key: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "referenceUrls",
  });

  // Church selection state
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [churchFormData, setChurchFormData] = useState<ChurchFormData>({
    country: "",
    city: "",
    region: "",
    churchId: "",
  });
  const [fileError, setFileError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  // File handling
  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.type !== "application/pdf") {
        setFileError(t("fileRequired"));
        return;
      }
      setFileError(null);
      setPdfPreview(URL.createObjectURL(file));
      setValue("file", file); // Update form state
    } else {
      setFileError(t("fileRequired"));
      setPdfPreview(null);
      setValue("file", null);
    }
  };

  const removePdfPreview = () => {
    setPdfPreview(null);
    setFileError(t("fileRequired"));
    setValue("file", null);
  };

  // Initialize default values for country, city, region
  useEffect(() => {
    if (countryOptions.length > 0 && isInitialLoad) {
      const defaultCountry = countryOptions[0].value || "";
      const defaultCity = citiesByCountry[defaultCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCountry(defaultCountry);
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setChurchFormData({
        country: defaultCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      });
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Handle country change
  useEffect(() => {
    if (selectedCountry && !isInitialLoad) {
      const defaultCity = citiesByCountry[selectedCountry]?.[0]?.value || "";
      const defaultRegion = regionsByCity[defaultCity]?.[0]?.value || "";
      setSelectedCity(defaultCity);
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setChurchFormData({
        country: selectedCountry,
        city: defaultCity,
        region: defaultRegion,
        churchId: "",
      });
      setChurches([]);
      if (!citiesByCountry[selectedCountry]?.length) {
        setError(t("noCitiesAvailable"));
      }
    }
  }, [selectedCountry, isInitialLoad, t]);

  // Handle city change
  useEffect(() => {
    if (selectedCity && !isInitialLoad) {
      const defaultRegion = regionsByCity[selectedCity]?.[0]?.value || "";
      setSelectedRegion(defaultRegion);
      setSelectedChurch("");
      setChurchFormData((prev) => ({
        ...prev,
        city: selectedCity,
        region: defaultRegion,
        churchId: "",
      }));
      setChurches([]);
      if (!regionsByCity[selectedCity]?.length) {
        setError(t("noRegionsAvailable"));
      }
    }
  }, [selectedCity, isInitialLoad, t]);

  // Fetch churches based on region
  useEffect(() => {
    if (isInitialLoad) return;

    const fetchChurches = async () => {
      if (selectedCountry && selectedCity && selectedRegion) {
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
            const churchOptions: ChurchOption[] = data.map(
              (church: { id: string; name: string }) => ({
                value: church.id,
                label: church.name,
              })
            );
            setChurches(churchOptions);
            const defaultChurch = churchOptions[0]?.value || "";
            setSelectedChurch(defaultChurch);
            setChurchFormData((prev) => ({
              ...prev,
              churchId: defaultChurch,
            }));
          } else {
            setChurches([]);
            setError(t("noChurchesFound"));
          }
        } catch (err) {
          console.error("Error fetching churches:", err);
          setChurches([]);
          setError(t("serverError"));
        }
      } else {
        setChurches([]);
      }
    };

    fetchChurches();
  }, [selectedRegion, isInitialLoad, selectedCountry, selectedCity, t]);

  // Submit handler
  const handleSubmitWithChurch = async (data: ScoreFormData) => {
    console.log("handleSubmitWithChurch...");
    if (!churchFormData.churchId) {
      setError(t("pleaseFillChurchFields"));
      return;
    }
    if (!data.file) {
      setFileError(t("fileRequired"));
      return;
    }
    setIsSubmitting(true);
    console.log("isSubmitting...");
    try {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.thumbnail) formData.append("thumbnail", data.thumbnail);
      formData.append("title", data.title);
      if (data.titleEn) formData.append("titleEn", data.titleEn);
      if (data.titleJa) formData.append("titleJa", data.titleJa);
      if (data.description) formData.append("description", data.description);
      if (data.tempo) formData.append("tempo", data.tempo);
      if (data.price) formData.append("price", data.price);
      if (data.key) formData.append("key", data.key);
      formData.append("referenceUrls", JSON.stringify(data.referenceUrls));
      if (data.lyrics) formData.append("lyrics", data.lyrics);
      if (data.lyricsEn) formData.append("lyricsEn", data.lyricsEn);
      if (data.lyricsJa) formData.append("lyricsJa", data.lyricsJa);
      if (data.composer) formData.append("composer", data.composer);
      if (data.lyricist) formData.append("lyricist", data.lyricist);
      if (data.saleStartDate)
        formData.append("saleStartDate", data.saleStartDate);
      if (data.saleEndDate) formData.append("saleEndDate", data.saleEndDate);
      if (data.genre) formData.append("genre", data.genre);
      formData.append("isPublic", String(data.isPublic));
      formData.append("isForSale", String(data.isForSale));
      formData.append("isOriginal", String(data.isOriginal));
      formData.append("churchId", churchFormData.churchId);

      console.log("api/scores/master start");
      const response = await fetch("/api/scores/master", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("serverError"));
      }

      router.push(`/${locale}/scores/upload/master/complete`);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err instanceof Error ? err.message : t("serverError"));
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  const isFormValid = () => {
    const isErrorsEmpty = Object.keys(errors).length === 0;
    const hasChurchId = !!churchFormData.churchId;
    const hasFile = !!watch("file");

    console.log(
      "isFormValid - Errors Empty:",
      isErrorsEmpty,
      "Errors:",
      errors
    );
    console.log(
      "isFormValid - Church ID Present:",
      hasChurchId,
      "Church ID:",
      churchFormData.churchId
    );
    console.log("isFormValid - File Present:", hasFile, "File:", watch("file"));

    return isErrorsEmpty && hasChurchId && hasFile;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-8">
      {isSubmitting && <Loading />}
      <div className="container mx-auto max-w-3xl p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            {t("titleForMaster")} {/* "MASTER 악보 업로드" */}
          </motion.h1>
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
                aria-label={t("dismissError")}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSubmit(handleSubmitWithChurch)}
          className="space-y-6"
        >
          {/* Church Selection Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {t("selectChurch")}
            </h2>
            <Select
              label={t("country")}
              name="country"
              options={countryOptions}
              value={selectedCountry}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedCountry(value);
                setChurchFormData((prev) => ({ ...prev, country: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("city")}
              name="city"
              options={citiesByCountry[selectedCountry] || []}
              value={selectedCity}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedCity(value);
                setChurchFormData((prev) => ({ ...prev, city: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("region")}
              name="region"
              options={regionsByCity[selectedCity] || []}
              value={selectedRegion}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedRegion(value);
                setChurchFormData((prev) => ({ ...prev, region: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
            <Select
              label={t("church")}
              name="churchId"
              options={churches}
              value={selectedChurch}
              onChange={(e) => {
                const value = e.target.value || "";
                setSelectedChurch(value);
                setChurchFormData((prev) => ({ ...prev, churchId: value }));
              }}
              required
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            />
          </div>

          {/* Score Upload Form */}
          <FileUploadSection
            fileError={fileError ? t("fileRequired") : ""}
            pdfPreview={pdfPreview}
            handleFileChange={handleFileChange}
            removePdfPreview={removePdfPreview}
            errors={errors}
            control={control}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("genreLabel")} {/* "장르" */}
            </label>
            <select
              {...register("genre", { required: t("genreRequired") })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("genrePlaceholder")}</option>
              {GENRES.map((genre) => (
                <option key={genre.value} value={genre.value}>
                  {locale === "ja" ? genre.ja : genre.ko}
                </option>
              ))}
            </select>
            {errors.genre && (
              <p className="text-red-500 text-sm flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.genre.message}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("keyLabel")} {/* "키" */}
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  {...register("key", {
                    required: t("keyRequired"), // "키를 선택해야 합니다."
                    validate: (value) => {
                      if (!value) return t("keyRequired");
                      const [key, tone] = value.split(" ");
                      if (!isValidKey(key) || !isValidTone(tone)) {
                        return t("keyRequired");
                      }
                      return true;
                    },
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t("keyPlaceholder")}</option>
                  {KEYS.flatMap((key) =>
                    TONES.map((tone) => (
                      <option key={`${key} ${tone}`} value={`${key} ${tone}`}>
                        {`${key} ${tone}`}
                      </option>
                    ))
                  )}
                </select>
                {errors.key && (
                  <p className="text-red-500 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.key.message}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <TitleSection register={register} errors={errors} />
          <TempoSection register={register} errors={errors} />
          <ReferenceUrlsSection
            fields={fields}
            append={append}
            remove={remove}
            register={register}
          />
          <LyricsSection register={register} errors={errors} />
          <ComposerLyricistSection register={register} />
          <DescriptionSection register={register} errors={errors} />
          <OptionsSection register={register} control={control} />

          <motion.button
            type="submit"
            // disabled={isSubmitting || !isFormValid()}
            whileHover={isFormValid() ? { scale: 1.05 } : {}}
            whileTap={isFormValid() ? { scale: 0.95 } : {}}
            className={`w-full p-3 rounded-md text-white transition-colors ${
              isFormValid()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {t("uploadButton")} {/* "업로드" */}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
