import { CustomCalendarEvent } from "@/types/calendar";
import { Dispatch, SetStateAction } from "react";
import { DayCell } from "./DayCell";
import { getWeekMaxEvents } from "../utils/calendarUtils";

interface CalendarBodyProps {
  currentDate: Date;
  calendarDays: Date[];
  events: CustomCalendarEvent[];
  setSelectedEvent: Dispatch<SetStateAction<CustomCalendarEvent | null>>;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  onDoubleClick: (day: Date) => void;
}

const EVENT_HEIGHT = 26;
const EVENT_GAP = 5;
const ROW_MARGIN = 50;
const MIN_ROW_HEIGHT = 100;

export const CalendarBody = ({
  currentDate,
  calendarDays,
  events,
  setSelectedEvent,
  setIsDetailModalOpen,
  onDoubleClick,
}: CalendarBodyProps) => (
  <tbody
    className="h-full relative"
    style={{ position: "relative", width: "100%" }}
  >
    {[...Array(6).keys()].map((weekIndex) => {
      const weekStart = calendarDays[weekIndex * 7];
      const weekEnd = calendarDays[weekIndex * 7 + 6];
      const maxEvents = getWeekMaxEvents(weekIndex, calendarDays, events);
      const rowHeight = Math.max(
        MIN_ROW_HEIGHT,
        maxEvents * EVENT_HEIGHT + (maxEvents - 1) * EVENT_GAP + ROW_MARGIN
      );

      return (
        <tr key={weekIndex} style={{ height: `${rowHeight}px` }}>
          {calendarDays
            .slice(weekIndex * 7, (weekIndex + 1) * 7)
            .map((day, index) => (
              <DayCell
                key={index}
                day={day}
                index={index}
                currentDate={currentDate}
                weekStart={weekStart}
                weekEnd={weekEnd}
                calendarDays={calendarDays}
                events={events}
                setSelectedEvent={setSelectedEvent}
                setIsDetailModalOpen={setIsDetailModalOpen}
                onDoubleClick={onDoubleClick}
              />
            ))}
        </tr>
      );
    })}
  </tbody>
);
