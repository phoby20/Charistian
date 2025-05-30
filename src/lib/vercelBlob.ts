// src/lib/vercelBlob.ts
import { del, list, put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

export async function uploadFile(file: File, filename: string) {
  try {
    // 파일 유효성 검사
    if (!file || file.size === 0) {
      throw new Error("유효하지 않거나 빈 파일입니다.");
    }

    // 환경 확인
    const isLocal = process.env.NODE_ENV === "development";
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, filename);

    if (isLocal) {
      // 로컬 환경: 파일 시스템에 저장
      await fs.mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      return `/uploads/${filename}`; // 클라이언트가 접근 가능한 URL 반환
    } else {
      // Vercel 환경: Vercel Blob에 저장
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        throw new Error(
          "BLOB_READ_WRITE_TOKEN 환경 변수가 설정되지 않았습니다."
        );
      }

      const { url } = await put(filename, file, {
        access: "public",
        token,
      });
      return url;
    }
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    throw error;
  }
}

export async function deleteFile(url: string) {
  try {
    const isLocal = process.env.NODE_ENV === "development";
    if (isLocal) {
      const filePath = path.join(process.cwd(), "public", url);
      await fs.unlink(filePath);
    } else {
      await del(url);
    }
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    throw error;
  }
}

export async function listFiles() {
  try {
    const isLocal = process.env.NODE_ENV === "development";
    if (isLocal) {
      const uploadDir = path.join(process.cwd(), "public/uploads");
      const files = await fs.readdir(uploadDir);
      return files.map((file) => ({ url: `/uploads/${file}` }));
    } else {
      return await list();
    }
  } catch (error) {
    console.error("파일 목록 조회 오류:", error);
    throw error;
  }
}
