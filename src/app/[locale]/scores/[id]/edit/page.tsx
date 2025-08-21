// src/app/[locale]/scores/[id]/edit/page.tsx
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
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Loading from "@/components/Loading";
import { ScoreResponse, ScoreFormData, ApiErrorResponse } from "@/types/score";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { User } from "@prisma/client";
import { constants } from "@/constants/intex";

const { TIME_SIGNATURES } = constants;

export default function ScoreEditPage() {
  const t = useTranslations("ScoreEdit");
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const locale = useLocale();
  const {
    form,
    referenceUrlFields,
    scoreKeyFields,
    appendReferenceUrl,
    removeReferenceUrl,
    appendScoreKey,
    removeScoreKey,
    fileError,
    setFileError,
    pdfPreviews,
    setPdfPreviews,
    saleStartDate,
    saleEndDate,
    isFormValid,
    handleFileChange,
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
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  // 사용자 정보와 악보 데이터를 가져와 canEdit 조건 확인
  const checkEditPermission = useCallback(
    async (user: User) => {
      if (!id) {
        setError(t("invalidId"));
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);

        // 악보 데이터 가져오기
        const scoreResponse = await fetch(`/api/scores/${id}`);
        if (!scoreResponse.ok) {
          const errorData: ApiErrorResponse = await scoreResponse.json();
          throw new Error(errorData.error || t("error"));
        }
        const score: ScoreResponse = await scoreResponse.json();

        // canEdit 조건 확인
        const canEdit =
          user &&
          score.isOpen &&
          score.churchId === user.churchId &&
          (user.id === score.creatorId ||
            ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role));

        if (!canEdit) {
          router.push(`/${locale}/scores/${id}`);
          return;
        }

        // 캐시 및 폼 데이터 설정
        cacheRef.current = { id, data: score };

        form.setValue("title", score.title || "");
        form.setValue("titleEn", score.titleEn || "");
        form.setValue("titleJa", score.titleJa || "");
        form.setValue("genre", score.genre || "");
        form.setValue("tempo", score.tempo || "");
        form.setValue("description", score.description || "");
        form.setValue("lyrics", score.lyrics || "");
        form.setValue("lyricsEn", score.lyricsEn || "");
        form.setValue("lyricsJa", score.lyricsJa || "");
        form.setValue("composer", score.composer || "");
        form.setValue("lyricist", score.lyricist || "");
        form.setValue("isPublic", score.isPublic || false);
        form.setValue("isForSale", score.isForSale || false);
        form.setValue("isOriginal", score.isOriginal || false);
        form.setValue("price", score.price ? String(score.price) : "");
        form.setValue("saleStartDate", score.saleStartDate || undefined);
        form.setValue("saleEndDate", score.saleEndDate || undefined);
        form.setValue("timeSignature", score.timeSignature || "");
        if (score.scoreKeys?.length) {
          form.setValue(
            "scoreKeys",
            score.scoreKeys.map((sk) => ({ key: sk.key, file: sk.fileUrl }))
          );
          setPdfPreviews(
            score.scoreKeys.map((sk) => ({ key: sk.key, url: sk.fileUrl }))
          );
        }
        if (score.referenceUrls?.length) {
          removeReferenceUrl(0);
          score.referenceUrls.forEach((url) => appendReferenceUrl({ url }));
        }

        setIsFetching(false);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : t("error");
        setError(errorMessage);
        console.error("Fetch error:", error);
        setIsFetching(false);
      }
    },
    [
      id,
      form,
      appendReferenceUrl,
      removeReferenceUrl,
      setPdfPreviews,
      t,
      router,
      locale,
    ]
  );

  useEffect(() => {
    if (user) {
      checkEditPermission(user);
    }
  }, [checkEditPermission, user]);

  const handleFormSubmit = async (data: ScoreFormData) => {
    if (isLoading) return;
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.titleEn) formData.append("titleEn", data.titleEn);
      if (data.titleJa) formData.append("titleJa", data.titleJa);
      if (data.genre) formData.append("genre", data.genre);
      if (data.tempo) formData.append("tempo", data.tempo);
      if (data.description) formData.append("description", data.description);
      if (data.lyrics) formData.append("lyrics", data.lyrics);
      if (data.lyricsEn) formData.append("lyricsEn", data.lyricsEn);
      if (data.lyricsJa) formData.append("lyricsJa", data.lyricsJa);
      if (data.composer) formData.append("composer", data.composer);
      if (data.lyricist) formData.append("lyricist", data.lyricist);
      formData.append("isPublic", String(data.isPublic || false));
      formData.append("isForSale", String(data.isForSale || false));
      formData.append("isOriginal", String(data.isOriginal || false));
      if (data.price) formData.append("price", data.price);
      if (data.saleStartDate)
        formData.append("saleStartDate", data.saleStartDate);
      if (data.saleEndDate) formData.append("saleEndDate", data.saleEndDate);
      if (data.referenceUrls) {
        formData.append(
          "referenceUrls",
          JSON.stringify(
            data.referenceUrls
              .map((r) => r.url)
              .filter(
                (url): url is string => url !== undefined && url.trim() !== ""
              )
          )
        );
      }
      if (data.scoreKeys) {
        data.scoreKeys.forEach((sk, index) => {
          formData.append(`scoreKeys[${index}][key]`, sk.key);
          if (sk.file instanceof File) {
            formData.append(`scoreKeys[${index}][file]`, sk.file);
          } else if (sk.file) {
            formData.append(`scoreKeys[${index}][fileUrl]`, sk.file);
          }
        });
      }
      if (data.timeSignature)
        formData.append("timeSignature", data.timeSignature);

      const response = await fetch(`/api/scores/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || t("updateError"));
      }

      cacheRef.current = { id: null, data: null };
      router.push(`/${locale}/scores/${id}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("updateError");
      setError(errorMessage);
      console.error("Submit error:", error);
      setFileError(errorMessage);
    }
  };

  // 섹션 애니메이션 설정
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isFetching) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            className="cursor-pointer flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      {isLoading && <Loading />}
      <div className="container mx-auto max-w-4xl p-4 bg-white rounded-2xl shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-10 border-b border-gray-200 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            {t("title")}
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/scores/${id}`)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-base font-medium">{t("backToDetail")}</span>
          </motion.button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
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
              appendScoreKey={appendScoreKey}
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

          {/* 박자 섹션 */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("timeSignatureLabel")}
            </h2>
            <div className="space-y-2">
              <select
                {...register("timeSignature", {
                  required: t("timeSignatureRequired"),
                })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">{t("timeSignaturePlaceholder")}</option>
                {TIME_SIGNATURES.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
              {errors.timeSignature && (
                <p className="text-red-500 text-sm flex items-center space-x-1 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.timeSignature.message}</span>
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
              {t("updateButton")}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
