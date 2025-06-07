import { createNavigation } from "next-intl/navigation";

export const { useRouter } = createNavigation({
  locales: ["ko", "ja"],
  defaultLocale: "ko",
});
