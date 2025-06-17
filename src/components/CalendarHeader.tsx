import { useTranslations } from "next-intl";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarHeader = () => {
  const t = useTranslations();
  return (
    <thead>
      <tr className="text-center">
        {DAYS_OF_WEEK.map((day) => (
          <th key={day} className="p-2 w-[14.28%]">
            {t(`Calendar.${day}`)}
          </th>
        ))}
      </tr>
    </thead>
  );
};
