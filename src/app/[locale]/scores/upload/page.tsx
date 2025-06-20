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
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function ScoreUploadPage() {
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
  } = useScoreForm();
  const router = useRouter();
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-3xl p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800 text-center"
          >
            악보 업로드
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores`)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">목록으로 돌아가기</span>
          </motion.button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FileUploadSection
            fileError={fileError}
            pdfPreview={pdfPreview}
            handleFileChange={handleFileChange}
            removePdfPreview={removePdfPreview}
            errors={errors}
            control={control}
          />
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
            disabled={!isFormValid()}
            whileHover={isFormValid() ? { scale: 1.05 } : {}}
            whileTap={isFormValid() ? { scale: 0.95 } : {}}
            className={`w-full p-3 rounded-md text-white transition-colors ${
              isFormValid()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            업로드
          </motion.button>
        </form>
      </div>
    </div>
  );
}
