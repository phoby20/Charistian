// src/app/[locale]/reset-password/confirm/page.tsx
import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import Loading from "@/components/Loading";
import { useLocale } from "next-intl";

export default function ResetPasswordConfirmPage() {
  const locale = useLocale();
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordForm locale={locale} />
    </Suspense>
  );
}
