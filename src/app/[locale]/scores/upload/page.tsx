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
import { TitleSection } from "@/components/scores/TitleSection";
import { GENRES } from "@/data/genre";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import type * as PDFJS from "pdfjs-dist";
import { getPdfFirstPagePreview } from "@/utils/pdf-preview";

export default function ScoreUploadPage() {
  const t = useTranslations("ScoreUpload");
  const {
    form,
    referenceUrlFields,
    scoreKeyFields,
    appendReferenceUrl,
    removeReferenceUrl,
    appendScoreKey,
    removeScoreKey,
    fileError,
    pdfPreviews: initialPdfPreviews,
    setPdfPreviews,
    saleStartDate,
    saleEndDate,
    isFormValid,
    handleFileChange: originalHandleFileChange,
    handleDateChange,
    onSubmit,
    control,
    isLoading,
  } = useScoreForm();
  const router = useRouter();
  const locale = useLocale();

  // 로컬 pdfPreviews 상태
  const [pdfPreviews, setLocalPdfPreviews] = useState<
    { key: string; url: string | null }[]
  >([]);
  // pdfjs-dist 로드 상태
  const [pdfjsLib, setPdfjsLib] = useState<typeof PDFJS | null>(null);

  // pdfjs-dist 동적 로드
  useEffect(() => {
    (async () => {
      try {
        const pdfjs: typeof PDFJS = await import("pdfjs-dist");
        const workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error("pdfjs-dist 로드 실패:", error);
      }
    })();
  }, []);

  // 초기 pdfPreviews 동기화
  useEffect(() => {
    setLocalPdfPreviews(
      initialPdfPreviews.length
        ? initialPdfPreviews
        : scoreKeyFields.map(() => ({ key: "", url: null }))
    );
  }, [initialPdfPreviews, scoreKeyFields]);

  // handleFileChange에서 미리보기 생성 및 동기화
  const handleFileChange = async (index: number, file: File | null) => {
    originalHandleFileChange(index, file);
    if (!file || !pdfjsLib) {
      setLocalPdfPreviews((prev) => {
        const newPreviews = [...prev];
        if (index >= newPreviews.length) {
          newPreviews.push({ key: "", url: null });
        } else {
          newPreviews[index] = { key: "", url: null };
        }
        setPdfPreviews(newPreviews);
        return newPreviews;
      });
      return;
    }

    try {
      const previewUrl = await getPdfFirstPagePreview(file, pdfjsLib);
      setLocalPdfPreviews((prev) => {
        const newPreviews = [...prev];
        if (index >= newPreviews.length) {
          newPreviews.push({ key: file.name, url: previewUrl });
        } else {
          newPreviews[index] = { key: file.name, url: previewUrl };
        }
        setPdfPreviews(newPreviews);
        return newPreviews;
      });
    } catch (error) {
      console.error("PDF 미리보기 생성 실패:", error);
      setLocalPdfPreviews((prev) => {
        const newPreviews = [...prev];
        if (index >= newPreviews.length) {
          newPreviews.push({ key: file.name, url: null });
        } else {
          newPreviews[index] = { key: file.name, url: null };
        }
        setPdfPreviews(newPreviews);
        return newPreviews;
      });
    }
  };

  // addKey 핸들러 추가
  const handleAddKey = () => {
    appendScoreKey({ key: "", file: null });
    setLocalPdfPreviews((prev) => {
      const newPreviews = [...prev, { key: "", url: null }];
      setPdfPreviews(newPreviews);
      return newPreviews;
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  // 섹션 애니메이션 설정
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      {isLoading && <Loading />}
      <div className="container mx-auto max-w-4xl p-8 bg-white rounded-2xl shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-10 border-b border-gray-200 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            {t("title")} {/* "악보 업로드" */}
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores`)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-base font-medium">{t("backToList")}</span>
          </motion.button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 파일 업로드 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <FileUploadSection
              fileError={fileError ? t("fileRequired") : ""}
              pdfPreviews={pdfPreviews}
              handleFileChange={handleFileChange}
              errors={errors}
              control={control}
              scoreKeyFields={scoreKeyFields}
              appendScoreKey={handleAddKey}
              removeScoreKey={removeScoreKey}
            />
          </motion.section>

          {/* 장르 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("genreLabel")}
            </h2>
            <div className="space-y-2">
              <select
                {...register("genre", { required: t("genreRequired") })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">{t("genrePlaceholder")}</option>
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {locale === "ja"
                      ? genre.ja
                      : locale === "ko"
                        ? genre.ko
                        : genre.en}
                  </option>
                ))}
              </select>
              {errors.genre && (
                <p className="text-red-500 text-sm flex items-center space-x-1 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.genre.message}</span>
                </p>
              )}
            </div>
          </motion.section>

          {/* 제목 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("titleSectionTitle")}
            </h2>
            <TitleSection register={register} errors={errors} />
          </motion.section>

          {/* 템포 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <TempoSection register={register} errors={errors} />
          </motion.section>

          {/* 참조 URL 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <ReferenceUrlsSection
              fields={referenceUrlFields}
              append={appendReferenceUrl}
              remove={removeReferenceUrl}
              register={register}
            />
          </motion.section>

          {/* 가사 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("lyricsTitle")}
            </h2>
            <LyricsSection register={register} errors={errors} />
          </motion.section>

          {/* 작곡가/작사가 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("composerLyricistTitle")}
            </h2>
            <ComposerLyricistSection register={register} />
          </motion.section>

          {/* 설명 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <DescriptionSection register={register} errors={errors} />
          </motion.section>

          {/* 옵션 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("optionsTitle")}
            </h2>
            <OptionsSection register={register} control={control} />
          </motion.section>

          {/* 판매 세부 정보 섹션 */}
          <SaleDetailsSection
            register={register}
            control={control}
            saleStartDate={saleStartDate}
            saleEndDate={saleEndDate}
            handleDateChange={handleDateChange}
            errors={errors}
          />

          {/* 제출 버튼 */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-end mt-8"
          >
            <Button type="submit" isDisabled={isLoading || !isFormValid()}>
              {t("uploadButton")} {/* "업로드" */}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
