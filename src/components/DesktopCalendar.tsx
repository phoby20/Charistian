// src/components/DesktopCalendar.tsx

import { CustomCalendarEvent } from "@/types/calendar";
import { Dispatch, SetStateAction, useMemo } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarBody } from "./CalendarBody";
import { generateCalendarDays } from "../utils/calendarUtils";

type DesktopCalendarProps = {
  currentDate: Date;
  events: CustomCalendarEvent[];
  setSelectedEvent: Dispatch<SetStateAction<CustomCalendarEvent | null>>;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  fetchDataAndEvents: () => Promise<void>;
  onDoubleClick: (day: Date) => void;
};

export default function DesktopCalendar({
  currentDate,
  events,
  setSelectedEvent,
  setIsDetailModalOpen,
  onDoubleClick,
}: DesktopCalendarProps) {
  const calendarDays = useMemo(
    () => generateCalendarDays(currentDate),
    [currentDate]
  );

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full table-fixed border-collapse h-full">
        <CalendarHeader />
        <CalendarBody
          currentDate={currentDate}
          calendarDays={calendarDays}
          events={events}
          setSelectedEvent={setSelectedEvent}
          setIsDetailModalOpen={setIsDetailModalOpen}
          onDoubleClick={onDoubleClick}
        />
      </table>
    </div>
  );
}
