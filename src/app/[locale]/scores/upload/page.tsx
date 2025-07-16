// src/app/[locale]/scores/upload/page.tsx
"use client";
import { useScoreForm } from "@/app/hooks/useScoreForm";
import { ComposerLyricistSection } from "@/components/scores/ComposerLyricistSection";
import { DescriptionSection } from "@/components/scores/DescriptionSection";
import { FileUploadSection } from "@/components/scores/FileUploadSection";
import { LyricsSection } from "@/components/scores/LyricsSection";
import { OptionsSection } from "@/components/scores/OptionsSection";
import { ReferenceUrlsSection } from "@/components/scores/ReferenceUrlsSection";
import { SaleDetailsSection } from "@/components/scores/SaleDetailsSection";
import { TempoSection } from "@/components/scores/TempoSection";
import { ThumbnailUploadSection } from "@/components/scores/ThumbnailUploadSection";
import { TitleSection } from "@/components/scores/TitleSection";
import { GENRES } from "@/data/genre";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TONES = ["Major", "Minor"];

export default function ScoreUploadPage() {
  const t = useTranslations("ScoreUpload");
  const {
    form,
    fields,
    append,
    remove,
    fileError,
    thumbnailPreview,
    pdfPreview,
    saleStartDate,
    saleEndDate,
    isFormValid,
    handleThumbnailChange,
    removeThumbnail,
    handleFileChange,
    removePdfPreview,
    handleDateChange,
    onSubmit,
    control,
    isLoading,
  } = useScoreForm();
  const router = useRouter();
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

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
            {t("title")}
            {/* "악보 업로드" */}
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores`)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t("backToList")}</span>
          </motion.button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 파일 업로드 섹션 */}
          <FileUploadSection
            fileError={fileError ? t("fileRequired") : ""}
            pdfPreview={pdfPreview}
            handleFileChange={handleFileChange}
            removePdfPreview={removePdfPreview}
            errors={errors}
            control={control}
          />

          {/* 장르 선택 섹션 */}
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

          {/* 코드 키 선택 섹션 */}
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

          <ThumbnailUploadSection
            thumbnailPreview={thumbnailPreview}
            handleThumbnailChange={handleThumbnailChange}
            removeThumbnail={removeThumbnail}
            errors={errors}
            control={control}
          />
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
            {t("uploadButton")} {/* "업로드" */}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
