// src/app/hooks/useScoreForm.ts
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useForm,
  useFieldArray,
  UseFormReturn,
  FieldArrayWithId,
  Control,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import {
  ScoreFormData,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/score";

interface UseScoreFormReturn {
  form: UseFormReturn<ScoreFormData>;
  referenceUrlFields: FieldArrayWithId<ScoreFormData, "referenceUrls", "id">[];
  scoreKeyFields: FieldArrayWithId<ScoreFormData, "scoreKeys", "id">[];
  appendReferenceUrl: UseFieldArrayAppend<ScoreFormData, "referenceUrls">;
  removeReferenceUrl: UseFieldArrayRemove;
  appendScoreKey: UseFieldArrayAppend<ScoreFormData, "scoreKeys">;
  removeScoreKey: (index: number) => void;
  fileError: string | null;
  setFileError: (error: string | null) => void;
  pdfPreviews: { key: string; url: string | null }[];
  setPdfPreviews: React.Dispatch<
    React.SetStateAction<{ key: string; url: string | null }[]>
  >;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  locale: string;
  isFormValid: () => boolean;
  handleFileChange: (index: number, file: File | null) => void;
  handleDateChange: (
    date: Date | null,
    field: "saleStartDate" | "saleEndDate"
  ) => void;
  onSubmit: (data: ScoreFormData) => Promise<void>;
  control: Control<ScoreFormData>;
  isLoading: boolean;
}

export const useScoreForm = (): UseScoreFormReturn => {
  const form: UseFormReturn<ScoreFormData> = useForm<ScoreFormData>({
    defaultValues: {
      referenceUrls: [{ url: "" }],
      scoreKeys: [{ key: "", file: null }],
      isPublic: false,
      isForSale: false,
      isOriginal: false,
      title: "",
      tempo: "",
      lyrics: "",
      description: "",
      genre: "",
    },
  });

  const {
    fields: referenceUrlFields,
    append: appendReferenceUrl,
    remove: removeReferenceUrl,
  } = useFieldArray<ScoreFormData, "referenceUrls", "id">({
    control: form.control,
    name: "referenceUrls",
  });

  const {
    fields: scoreKeyFields,
    append: appendScoreKey,
    remove: originalRemoveScoreKey,
  } = useFieldArray<ScoreFormData, "scoreKeys", "id">({
    control: form.control,
    name: "scoreKeys",
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<
    { key: string; url: string | null }[]
  >([]);
  const [saleStartDate, setSaleStartDate] = useState<Date | null>(null);
  const [saleEndDate, setSaleEndDate] = useState<Date | null>(null);
  const router = useRouter();
  const params = useParams();
  const { locale } = params;

  const { scoreKeys, title, tempo, lyrics, description, price, isForSale } =
    form.watch();

  const isFormValid = (): boolean => {
    const { errors } = form.formState;
    if (!scoreKeys) {
      return false; // scoreKeys가 undefined일 경우 false 반환
    }
    const requiredFieldsFilled =
      scoreKeys.length > 0 &&
      scoreKeys.every((sk) => !!sk.file && !!sk.key) &&
      !!title &&
      !!tempo &&
      !!lyrics &&
      !!description &&
      !errors.scoreKeys &&
      !errors.title &&
      !errors.tempo &&
      !errors.lyrics &&
      !errors.description;
    const priceFilled = !isForSale || (isForSale && !!price && !errors.price);
    return requiredFieldsFilled && priceFilled;
  };

  useEffect(() => {
    if (!isForSale) {
      form.setValue("price", undefined);
      form.setValue("saleStartDate", undefined);
      form.setValue("saleEndDate", undefined);
      setSaleStartDate(null);
      setSaleEndDate(null);
    }
  }, [isForSale, form]);

  useEffect(() => {
    if (!form.getValues("scoreKeys")) {
      form.setValue("scoreKeys", [{ key: "", file: null }]);
    }
  }, [form]);

  useEffect(() => {
    // scoreKeyFields와 pdfPreviews 길이 동기화
    if (scoreKeyFields.length !== pdfPreviews.length) {
      setPdfPreviews(
        scoreKeyFields.map((field, index) => ({
          key: scoreKeys?.[index]?.key ?? "",
          url:
            scoreKeys?.[index]?.file instanceof File
              ? (scoreKeys[index].file?.name ?? null)
              : (scoreKeys?.[index]?.file ?? null),
        }))
      );
    }
  }, [scoreKeyFields, scoreKeys]);

  const handleFileChange = (index: number, file: File | null): void => {
    setPdfPreviews((prev) => {
      const newPreviews = [...prev];
      // 인덱스가 배열 길이를 초과하면 새로운 항목 추가
      if (index >= newPreviews.length) {
        newPreviews.push({
          key: file?.name ?? "",
          url: file ? file.name : null,
        });
      } else {
        newPreviews[index] = {
          key: scoreKeys?.[index]?.key ?? "",
          url: file ? file.name : null,
        };
      }
      return newPreviews;
    });
    setFileError(null);
  };

  const removeScoreKey = (index: number) => {
    originalRemoveScoreKey(index); // react-hook-form의 필드 제거
    setPdfPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index); // 해당 인덱스 미리보기 제거
      return newPreviews;
    });
  };

  const handleDateChange = (
    date: Date | null,
    field: "saleStartDate" | "saleEndDate"
  ): void => {
    if (date) {
      const formattedDate = date.toISOString();
      form.setValue(field, formattedDate);
      if (field === "saleStartDate") setSaleStartDate(date);
      if (field === "saleEndDate") setSaleEndDate(date);
    } else {
      form.setValue(field, undefined);
      if (field === "saleStartDate") setSaleStartDate(null);
      if (field === "saleEndDate") setSaleEndDate(null);
    }
  };

  const onSubmit = async (data: ScoreFormData): Promise<void> => {
    const formData = new FormData();
    data.scoreKeys?.forEach((sk, index) => {
      if (sk.file instanceof File) {
        formData.append(`scoreKeys[${index}].file`, sk.file);
      } else if (sk.file) {
        formData.append(`scoreKeys[${index}].fileUrl`, sk.file);
      }
      formData.append(`scoreKeys[${index}].key`, sk.key);
    });
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);
    formData.append("title", data.title);
    formData.append("titleEn", data.titleEn || "");
    formData.append("titleJa", data.titleJa || "");
    formData.append("description", data.description || "");
    formData.append("tempo", data.tempo || "");
    formData.append("price", data.price || "");
    formData.append(
      "referenceUrls",
      JSON.stringify(data.referenceUrls.map((r) => r.url))
    );
    formData.append("lyrics", data.lyrics || "");
    formData.append("lyricsEn", data.lyricsEn || "");
    formData.append("lyricsJa", data.lyricsJa || "");
    formData.append("composer", data.composer || "");
    formData.append("lyricist", data.lyricist || "");
    formData.append("saleStartDate", data.saleStartDate || "");
    formData.append("saleEndDate", data.saleEndDate || "");
    formData.append("isPublic", String(data.isPublic));
    formData.append("isForSale", String(data.isForSale));
    formData.append("isOriginal", String(data.isOriginal));
    formData.append("genre", data.genre || "");

    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || "업로드에 실패했습니다.");
      }

      const { id } = (await response.json()) as ApiSuccessResponse;
      router.push(`/${locale}/scores/${id}`);
    } catch (error: unknown) {
      let errorMessage = "업로드에 실패했습니다.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(error);
      setFileError(errorMessage);
    }
  };

  return {
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
    locale: locale as string,
    isFormValid,
    handleFileChange,
    handleDateChange,
    onSubmit,
    control: form.control,
    isLoading: form.formState.isSubmitting,
  };
};
