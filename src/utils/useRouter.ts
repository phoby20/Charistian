import { createNavigation } from "next-intl/navigation";

export const { useRouter, getPathname } = createNavigation({
  locales: ["ko", "ja"],
  defaultLocale: "ko",
});
