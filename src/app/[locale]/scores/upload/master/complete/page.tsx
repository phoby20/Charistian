// src/app/[locale]/scores/upload/master/complete/page.tsx
"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import Button from "@/components/Button";

export default function SignupCompletePage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 text-center">
          악보 업로드 완료
        </h1>
        <p className="text-gray-700 mb-4 text-base md:text-lg whitespace-pre text-center">
          해당 교회에 악보 업로드가 완료 되었습니다.
        </p>

        <Link href={`/${locale}/scores/upload/master`}>
          <Button
            variant="primary"
            className="cursor-pointer w-full bg-gradient-to-r from-[#ff66c4] to-[#ffde59] py-2 rounded-lg hover:from-[#ffde59] hover:to-[#ff66c4] transition duration-300"
          >
            계속해서 업로드 하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
