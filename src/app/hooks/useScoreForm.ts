// src/hooks/useScoreForm.ts
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
  fields: FieldArrayWithId<ScoreFormData, "referenceUrls", "id">[];
  append: UseFieldArrayAppend<ScoreFormData, "referenceUrls">;
  remove: UseFieldArrayRemove;
  fileError: string | null;
  setFileError: (error: string | null) => void;
  thumbnailPreview: string | null;
  pdfPreview: string | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  locale: string;
  isFormValid: () => boolean;
  handleThumbnailChange: (file: File | null) => void;
  removeThumbnail: () => void;
  handleFileChange: (file: File | null) => void;
  removePdfPreview: () => void;
  handleDateChange: (
    date: Date | null,
    field: "saleStartDate" | "saleEndDate"
  ) => void;
  onSubmit: (data: ScoreFormData) => Promise<void>;
  control: Control<ScoreFormData>;
}

export const useScoreForm = (): UseScoreFormReturn => {
  const form: UseFormReturn<ScoreFormData> = useForm<ScoreFormData>({
    defaultValues: {
      referenceUrls: [{ url: "" }],
      isPublic: false,
      isForSale: false,
      isOriginal: false,
      file: null,
      thumbnail: null,
      title: "",
      tempo: "",
      lyrics: "",
      description: "",
      genre: "",
    },
  });

  const { fields, append, remove } = useFieldArray<ScoreFormData>({
    control: form.control,
    name: "referenceUrls",
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [saleStartDate, setSaleStartDate] = useState<Date | null>(null);
  const [saleEndDate, setSaleEndDate] = useState<Date | null>(null);
  const router = useRouter();
  const params = useParams();
  const { locale } = params;

  const {
    file,
    thumbnail,
    title,
    tempo,
    lyrics,
    description,
    price,
    isForSale,
  } = form.watch();

  const isFormValid = (): boolean => {
    const { errors } = form.formState;
    const requiredFieldsFilled =
      !!file &&
      !!thumbnail &&
      !!title &&
      !!tempo &&
      !!lyrics &&
      !!description &&
      !errors.file &&
      !errors.thumbnail &&
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
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const handleThumbnailChange = (file: File | null): void => {
    if (file && ["image/jpeg", "image/png"].includes(file.type)) {
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else {
      setThumbnailPreview(null);
    }
  };

  const removeThumbnail = (): void => {
    setThumbnailPreview(null);
    form.setValue("thumbnail", null, { shouldValidate: true });
  };

  const handleFileChange = (file: File | null): void => {
    setPdfPreview(file ? file.name : null);
    setFileError(null);
  };

  const removePdfPreview = (): void => {
    setPdfPreview(null);
    form.setValue("file", null, { shouldValidate: true });
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
    if (data.file) formData.append("file", data.file);
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
    fields,
    append,
    remove,
    fileError,
    setFileError,
    thumbnailPreview,
    pdfPreview,
    saleStartDate,
    saleEndDate,
    locale: locale as string,
    isFormValid,
    handleThumbnailChange,
    removeThumbnail,
    handleFileChange,
    removePdfPreview,
    handleDateChange,
    onSubmit,
    control: form.control,
  };
};
