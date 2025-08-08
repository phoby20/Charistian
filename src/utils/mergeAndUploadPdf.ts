// src/utils/pdf.ts
import { PDFDocument } from "pdf-lib";
import { put, del } from "@vercel/blob";
import { createKoreaDate } from "@/utils/creatKoreaDate";

interface Score {
  creationId: string;
  fileUrl: string;
  order: number;
  selectedKey: string; // 새 필드 추가
}

export async function mergeAndUploadPdf(
  scores: Score[],
  setlistId: string,
  existingFileUrl?: string | null
): Promise<string> {
  // 기존 PDF 삭제 (PUT 요청 시)
  if (existingFileUrl) {
    try {
      await del(existingFileUrl);
      console.log(`Vercel Blob에서 기존 PDF 삭제 완료: ${existingFileUrl}`);
    } catch (error) {
      console.error(`Vercel Blob PDF 삭제 오류: ${existingFileUrl}`, error);
    }
  }

  // PDF 병합
  const mergedPdf = await PDFDocument.create();
  const pdfPromises = scores.map(async ({ fileUrl, selectedKey }) => {
    if (!fileUrl) {
      throw new Error(
        `PDF 파일 URL이 없습니다. | creationId: ${scores.find((s) => s.fileUrl === fileUrl)?.creationId}, selectedKey: ${selectedKey}`
      );
    }
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `PDF 다운로드 실패 | URL: ${fileUrl}, selectedKey: ${selectedKey}`
      );
    }
    return response.arrayBuffer();
  });

  try {
    const pdfBuffers = await Promise.all(pdfPromises);
    for (const pdfBytes of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
  } catch (error) {
    console.error("PDF 병합 중 오류 발생:", error);
    throw new Error(
      `PDF 병합 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }

  // 병합된 PDF를 바이트로 저장
  const mergedPdfBytes = await mergedPdf.save();
  const buffer = Buffer.from(mergedPdfBytes);

  // Vercel Blob에 업로드
  const koreaDate = createKoreaDate();
  const blob = await put(
    `setlists/merged_setlist/${koreaDate}_${setlistId}.pdf`,
    buffer,
    { access: "public", allowOverwrite: true }
  );

  return blob.url;
}
