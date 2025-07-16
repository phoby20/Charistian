"use client";
import { useScoreForm } from "@/app/hooks/useScoreForm";
import { ComposerLyricistSection } from "@/components/scores/ComposerLyricistSection";
import { DescriptionSection } from "@/components/scores/DescriptionSection";
import { LyricsSection } from "@/components/scores/LyricsSection";
import { OptionsSection } from "@/components/scores/OptionsSection";
import { ReferenceUrlsSection } from "@/components/scores/ReferenceUrlsSection";
import { SaleDetailsSection } from "@/components/scores/SaleDetailsSection";
import { TempoSection } from "@/components/scores/TempoSection";
import { TitleSection } from "@/components/scores/TitleSection";
import { GENRES } from "@/data/genre";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Loading from "@/components/Loading";
import { ScoreResponse, ScoreFormData, ApiErrorResponse } from "@/types/score";

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TONES = ["Major", "Minor"];

export default function ScoreEditPage() {
  const t = useTranslations("ScoreEdit");
  const router = useRouter();
  const params = useParams();
  const { id, locale } = params as { id: string; locale: string };
  const {
    form,
    fields,
    append,
    remove,
    saleStartDate,
    saleEndDate,
    handleDateChange,
    control,
    isLoading,
  } = useScoreForm();
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const cacheRef = useRef<{ id: string | null; data: ScoreResponse | null }>({
    id: null,
    data: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const { title, tempo, lyrics, description, price, isForSale, key, genre } =
    watch();

  // 폼 유효성 검사
  const isFormValid = (): boolean => {
    const requiredFieldsFilled =
      !!title &&
      !!tempo &&
      !!lyrics &&
      !!description &&
      !!key &&
      !!genre &&
      !errors.title &&
      !errors.tempo &&
      !errors.lyrics &&
      !errors.description &&
      !errors.key &&
      !errors.genre;
    const priceFilled = !isForSale || (isForSale && !!price && !errors.price);
    return requiredFieldsFilled && priceFilled;
  };

  // fetchScore를 메모이제이션
  const fetchScore = useCallback(async () => {
    if (!id) return;

    // 캐시 확인
    if (cacheRef.current.id === id && cacheRef.current.data) {
      console.log("Using cached data for ID:", id);
      const data = cacheRef.current.data;
      form.setValue("title", data.title || "");
      form.setValue("titleEn", data.titleEn || "");
      form.setValue("titleJa", data.titleJa || "");
      form.setValue("genre", data.genre || "");
      form.setValue("key", data.key || "");
      form.setValue("tempo", data.tempo || "");
      form.setValue("description", data.description || "");
      form.setValue("lyrics", data.lyrics || "");
      form.setValue("lyricsEn", data.lyricsEn || "");
      form.setValue("lyricsJa", data.lyricsJa || "");
      form.setValue("composer", data.composer || "");
      form.setValue("lyricist", data.lyricist || "");
      form.setValue("isPublic", data.isPublic || false);
      form.setValue("isForSale", data.isForSale || false);
      form.setValue("isOriginal", data.isOriginal || false);
      form.setValue("price", data.price ? String(data.price) : "");
      form.setValue("saleStartDate", data.saleStartDate || undefined);
      form.setValue("saleEndDate", data.saleEndDate || undefined);
      if (data.referenceUrls?.length) {
        remove(0); // 기본 빈 URL 제거
        data.referenceUrls.forEach((url) => append({ url }));
      }
      setIsFetching(false);
      return;
    }

    console.log("Fetching score for ID:", id); // 디버깅 로그
    try {
      setIsFetching(true);
      const response = await fetch(`/api/scores/${id}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || t("error"));
      }
      const data: ScoreResponse = await response.json();

      // 캐시에 저장
      cacheRef.current = { id, data };

      // 폼 필드 초기화
      form.setValue("title", data.title || "");
      form.setValue("titleEn", data.titleEn || "");
      form.setValue("titleJa", data.titleJa || "");
      form.setValue("genre", data.genre || "");
      form.setValue("key", data.key || "");
      form.setValue("tempo", data.tempo || "");
      form.setValue("description", data.description || "");
      form.setValue("lyrics", data.lyrics || "");
      form.setValue("lyricsEn", data.lyricsEn || "");
      form.setValue("lyricsJa", data.lyricsJa || "");
      form.setValue("composer", data.composer || "");
      form.setValue("lyricist", data.lyricist || "");
      form.setValue("isPublic", data.isPublic || false);
      form.setValue("isForSale", data.isForSale || false);
      form.setValue("isOriginal", data.isOriginal || false);
      form.setValue("price", data.price ? String(data.price) : "");
      form.setValue("saleStartDate", data.saleStartDate || undefined);
      form.setValue("saleEndDate", data.saleEndDate || undefined);
      if (data.referenceUrls?.length) {
        remove(0); // 기본 빈 URL 제거
        data.referenceUrls.forEach((url) => append({ url }));
      }

      setIsFetching(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("error");
      setError(errorMessage);
      console.error("Fetch error:", error);
      setIsFetching(false);
    }
  }, [id, form, append, remove, t]); // 최소 의존성 유지

  useEffect(() => {
    fetchScore();
  }, [id]); // 의존성 배열에서 fetchScore 제거, id만 사용

  const handleFormSubmit = async (data: ScoreFormData) => {
    if (isLoading) return; // 중복 제출 방지
    console.log("Submitting form with data:", JSON.stringify(data, null, 2)); // 디버깅 로그
    try {
      const response = await fetch(`/api/scores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          titleEn: data.titleEn || null,
          titleJa: data.titleJa || null,
          genre: data.genre || null,
          key: data.key || null,
          tempo: data.tempo || null,
          description: data.description || null,
          lyrics: data.lyrics || null,
          lyricsEn: data.lyricsEn || null,
          lyricsJa: data.lyricsJa || null,
          composer: data.composer || null,
          lyricist: data.lyricist || null,
          isPublic: data.isPublic || false,
          isForSale: data.isForSale || false,
          isOriginal: data.isOriginal || false,
          price: data.price ? Number(data.price) : null,
          saleStartDate: data.saleStartDate || null,
          saleEndDate: data.saleEndDate || null,
          referenceUrls:
            data.referenceUrls
              ?.map((r) => r.url)
              .filter(
                (url): url is string => url !== undefined && url.trim() !== ""
              ) || [],
        }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || t("updateError"));
      }

      // 캐시 초기화 (업데이트 후 최신 데이터로 갱신 필요)
      cacheRef.current = { id: null, data: null };
      router.push(`/${locale}/scores/${id}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("updateError");
      setError(errorMessage);
      console.error("Submit error:", error);
    }
  };

  if (isFetching) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-6 max-w-md w-full"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-xl font-semibold">{error}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores`)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all"
            aria-label={t("backToList")}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t("backToList")}</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-8">
      {isLoading && <Loading />}
      <div className="container mx-auto max-w-3xl p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            {t("title")} {/* "악보 수정" */}
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores/${id}`)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t("backToDetail")}</span>
          </motion.button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <TitleSection register={register} errors={errors} />
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
                    required: t("keyRequired"),
                    validate: (value) => {
                      if (!value) return t("keyRequired");
                      const [key, tone] = value.split(" ");
                      return (
                        (KEYS.includes(key) && TONES.includes(tone)) ||
                        t("keyRequired")
                      );
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
          <SaleDetailsSection
            register={register}
            control={control}
            saleStartDate={saleStartDate}
            saleEndDate={saleEndDate}
            handleDateChange={handleDateChange}
            errors={errors}
          />
          <motion.button
            type="submit"
            disabled={isLoading || !isFormValid()}
            whileHover={isFormValid() ? { scale: 1.05 } : {}}
            whileTap={isFormValid() ? { scale: 0.95 } : {}}
            className={`w-full p-3 rounded-md text-white transition-colors ${
              isFormValid()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {t("updateButton")} {/* "수정" */}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
