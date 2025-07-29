import { regionsByCityUSA } from "./regionsByCityUSA";
import { regionsByCityJapan } from "./regionsJapan";
import { regionsByCityKorea } from "./regionsKorea";

export const regionsByCity: Record<string, { value: string; label: string }[]> =
  {
    ...regionsByCityKorea,
    ...regionsByCityJapan,
    ...regionsByCityUSA,
    "": [],
  };
