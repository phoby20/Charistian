// src/utils/pdf-preview.ts
import type * as PDFJS from "pdfjs-dist";

export async function getPdfFirstPagePreview(
  input: File | string, // File 또는 URL(string) 허용
  pdfjsLib: typeof PDFJS
): Promise<string> {
  let fileData: ArrayBuffer;

  if (typeof input === "string") {
    // URL인 경우 fetch로 데이터 가져오기
    // 주의: 실제 PDF URL이 올바른지 확인 (예: Vercel Blob URL로 수정 필요)
    const response = await fetch(input, { mode: "cors" }); // CORS 모드 명시
    if (!response.ok) {
      throw new Error(`PDF fetch 실패: ${response.statusText}`);
    }
    fileData = await response.arrayBuffer();
  } else {
    // File인 경우 기존 로직
    fileData = await input.arrayBuffer();
  }

  const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("CanvasRenderingContext2D를 생성할 수 없습니다.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL("image/png");
}
