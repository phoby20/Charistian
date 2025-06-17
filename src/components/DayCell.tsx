import { CustomCalendarEvent } from "@/types/calendar";
import {
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { Dispatch, SetStateAction, useRef } from "react";
import { EventItem } from "./EventItem";

interface MultiDayEvent extends CustomCalendarEvent {
  segmentStart: Date;
  segmentEnd: Date;
  startDayIndex: number;
  endDayIndex: number;
  spanCells: number;
  eventIndex: number;
}

interface SingleDayEvent extends CustomCalendarEvent {
  eventIndex: number;
}

interface DayCellProps {
  day: Date;
  index: number;
  currentDate: Date;
  weekStart: Date;
  weekEnd: Date;
  calendarDays: Date[];
  events: CustomCalendarEvent[];
  setSelectedEvent: Dispatch<SetStateAction<CustomCalendarEvent | null>>;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  onDoubleClick: (day: Date) => void;
}

const filterMultiDayEvents = (
  events: CustomCalendarEvent[],
  day: Date,
  weekStart: Date,
  weekEnd: Date,
  calendarDays: Date[]
): Omit<MultiDayEvent, "eventIndex">[] => {
  const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 0 });
  const weekEndDate = endOfWeek(weekEnd, { weekStartsOn: 0 });

  return events
    .map((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const isMultiDay = !isSameDay(eventStart, eventEnd);

      if (
        !isMultiDay ||
        eventStart > weekEndDate ||
        eventEnd < weekStartDate ||
        !(
          isSameDay(day, eventStart) ||
          isSameDay(day, eventEnd) ||
          isWithinInterval(day, { start: eventStart, end: eventEnd })
        )
      ) {
        return null;
      }

      const segmentStart =
        eventStart > weekStartDate ? eventStart : weekStartDate;
      const segmentEnd = eventEnd < weekEndDate ? eventEnd : weekEndDate;
      const startDayIndex = calendarDays.findIndex((d) =>
        isSameDay(d, segmentStart)
      );
      const endDayIndex = calendarDays.findIndex((d) =>
        isSameDay(d, segmentEnd)
      );
      const spanCells = isSameDay(day, segmentStart)
        ? endDayIndex - startDayIndex + 1
        : 0;

      return {
        ...event,
        segmentStart,
        segmentEnd,
        startDayIndex,
        endDayIndex,
        spanCells,
      };
    })
    .filter(
      (event): event is Omit<MultiDayEvent, "eventIndex"> => event !== null
    );
};

const filterSingleDayEvents = (
  events: CustomCalendarEvent[],
  day: Date
): Omit<SingleDayEvent, "eventIndex">[] => {
  return events
    .map((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const isMultiDay = !isSameDay(eventStart, eventEnd);

      if (isMultiDay || !isSameDay(day, eventStart)) return null;

      return {
        ...event,
      };
    })
    .filter(
      (event): event is Omit<SingleDayEvent, "eventIndex"> => event !== null
    );
};

export const DayCell = ({
  day,
  index,
  currentDate,
  weekStart,
  weekEnd,
  calendarDays,
  events,
  setSelectedEvent,
  setIsDetailModalOpen,
  onDoubleClick,
}: DayCellProps) => {
  const isCurrentMonth =
    day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate);
  const isToday = isSameDay(day, new Date());
  const multiDayEventsRaw = filterMultiDayEvents(
    events,
    day,
    weekStart,
    weekEnd,
    calendarDays
  );
  const singleDayEventsRaw = filterSingleDayEvents(events, day);

  // 멀티 이벤트를 startDate 기준으로 정렬
  const sortedMultiDayEvents = [...multiDayEventsRaw].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // 모든 멀티 이벤트의 시작일과 eventIndex 매핑 (주 전체 기준)
  const multiEventStartIndices: { startDate: Date; eventIndex: number }[] = [];
  const weekEvents = events
    .filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (
        !isSameDay(eventStart, eventEnd) &&
        (isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
          isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
          (eventStart <= weekStart && eventEnd >= weekEnd))
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  weekEvents.forEach((event, idx) => {
    multiEventStartIndices.push({
      startDate: new Date(event.startDate),
      eventIndex: idx,
    });
  });

  // 현재 날짜에 영향을 주는 멀티 이벤트의 최대 시작일 eventIndex 계산
  let maxStartIndex = -1;
  multiEventStartIndices.forEach(({ startDate, eventIndex }) => {
    const event = weekEvents.find((e) =>
      isSameDay(new Date(e.startDate), startDate)
    );
    if (event) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      if (
        isWithinInterval(day, { start: eventStart, end: eventEnd }) ||
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd)
      ) {
        maxStartIndex = Math.max(maxStartIndex, eventIndex);
      }
    }
  });

  // 멀티 이벤트와 싱글 이벤트를 결합하여 날짜별 eventIndex 할당
  const allEvents: (MultiDayEvent | SingleDayEvent)[] = [
    ...sortedMultiDayEvents.map((event, idx) => ({
      ...event,
      eventIndex:
        multiEventStartIndices.find((entry) =>
          isSameDay(entry.startDate, new Date(event.startDate))
        )?.eventIndex ?? idx,
    })),
    ...singleDayEventsRaw.map((event, idx) => ({
      ...event,
      eventIndex: maxStartIndex >= 0 ? maxStartIndex + 1 + idx : idx,
    })),
  ];

  // 이벤트 요소를 위한 ref 배열
  const eventRefs = useRef<(HTMLDivElement | null)[]>(
    new Array(allEvents.length).fill(null)
  );

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    for (let i = 0; i < eventRefs.current.length; i++) {
      const elem = eventRefs.current[i];
      if (!elem) continue;

      const rect = elem.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (
        clickX >= 0 &&
        clickX <= rect.width &&
        clickY >= 0 &&
        clickY <= rect.height
      ) {
        const event = allEvents[i];
        if (event) {
          setSelectedEvent(event);
          setIsDetailModalOpen(true);
        }
        break;
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    let isEventClicked = false;
    for (let i = 0; i < eventRefs.current.length; i++) {
      const elem = eventRefs.current[i];
      if (!elem) continue;

      const rect = elem.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (
        clickX >= 0 &&
        clickX <= rect.width &&
        clickY >= 0 &&
        clickY <= rect.height
      ) {
        isEventClicked = true;
        break;
      }
    }
    if (isCurrentMonth && !isEventClicked) {
      onDoubleClick(day);
    }
  };

  return (
    <td
      key={index}
      className={`p-0 w-[14.28%] border border-gray-400 relative ${!isCurrentMonth ? "text-gray-300" : ""}`}
      style={{
        minHeight: "100px",
        overflow: "visible",
        position: "relative",
        verticalAlign: "top",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="absolute top-1 right-1 text-right z-10">
        {isToday ? (
          <span className="relative">
            <span className="absolute p-3 -left-5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
              {format(day, "d")}
            </span>
          </span>
        ) : (
          format(day, "d")
        )}
      </div>
      {allEvents.map((event, idx) => {
        // 멀티 이벤트는 spanCells > 0인 경우만 렌더링
        if ("spanCells" in event && event.spanCells === 0) {
          return null;
        }
        return (
          <EventItem
            key={event.id + "_" + event.eventIndex}
            event={event}
            isMultiDay={"spanCells" in event}
            multiDayEventsLength={multiDayEventsRaw.length}
            eventRef={(el) => {
              eventRefs.current[idx] = el;
            }}
          />
        );
      })}
    </td>
  );
};
