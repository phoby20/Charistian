import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  getDay,
  isSameDay,
  startOfMonth,
  isWithinInterval,
} from "date-fns";
import { CustomCalendarEvent } from "@/types/calendar";

export const TOTAL_CELLS = 42;

export const generateCalendarDays = (currentDate: Date): Date[] => {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const firstDayOfWeek = getDay(start);
  const daysBefore = Array.from({ length: firstDayOfWeek }, (_, i) =>
    addDays(start, -firstDayOfWeek + i)
  );
  const daysInCurrentMonth = eachDayOfInterval({ start, end });
  const daysAfter = Array.from(
    { length: TOTAL_CELLS - daysBefore.length - daysInCurrentMonth.length },
    (_, i) => addDays(end, i + 1)
  );
  return [...daysBefore, ...daysInCurrentMonth, ...daysAfter];
};

export const getWeekMaxEvents = (
  weekIndex: number,
  calendarDays: Date[],
  events: CustomCalendarEvent[]
): number => {
  const weekStart = calendarDays[weekIndex * 7];
  const weekEnd = calendarDays[weekIndex * 7 + 6];
  const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);

  return weekDays.reduce((maxEvents, day) => {
    const multiDayCount = events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const isMultiDay = !isSameDay(eventStart, eventEnd);
      return (
        isMultiDay &&
        (isSameDay(day, eventStart) ||
          isSameDay(day, eventEnd) ||
          isWithinInterval(day, { start: eventStart, end: eventEnd })) &&
        eventStart <= weekEnd &&
        eventEnd >= weekStart
      );
    }).length;

    const singleDayCount = events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const isMultiDay = !isSameDay(eventStart, eventEnd);
      return !isMultiDay && isSameDay(day, eventStart);
    }).length;

    return Math.max(maxEvents, multiDayCount + singleDayCount);
  }, 0);
};
