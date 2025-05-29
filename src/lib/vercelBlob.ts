import { put, del, list } from "@vercel/blob";

export async function uploadFile(file: File, filename: string) {
  const { url } = await put(filename, file, { access: "public" });
  return url;
}

export async function deleteFile(url: string) {
  await del(url);
}

export async function listFiles() {
  return await list();
}
