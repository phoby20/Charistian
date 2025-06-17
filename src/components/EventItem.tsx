import { CustomCalendarEvent } from "@/types/calendar";
import { RefCallback } from "react";

interface MultiDayEvent extends CustomCalendarEvent {
  spanCells: number;
  eventIndex: number;
}

interface SingleDayEvent extends CustomCalendarEvent {
  eventIndex: number;
}

interface EventItemProps {
  event: MultiDayEvent | SingleDayEvent;
  isMultiDay: boolean;
  multiDayEventsLength?: number;
  eventRef?: RefCallback<HTMLDivElement>;
}

const EVENT_HEIGHT = 24; // 이벤트 높이
const EVENT_MARGIN = 2; // 좌우 여백
const EVENT_MARGIN_TOP = 30; // 0번째 싱글 이벤트의 margin-top
const EVENT_MARGIN_BOTTOM = 4; // 모든 싱글 이벤트의 margin-bottom

// label별 배경색
const LABEL_COLOR_MAP: Record<string, string> = {
  High: "bg-red-500",
  default: "bg-blue-500",
  Low: "bg-green-500",
};

export const EventItem = ({
  event,
  isMultiDay,
  multiDayEventsLength,
  eventRef,
}: EventItemProps) => {
  const baseStyles = {
    position: "absolute" as const,
    color: "white",
    padding: "4px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "visible",
    zIndex: isMultiDay ? 2 : 1,
    height: `${EVENT_HEIGHT}px`, // 명시적 높이
  };

  const multiDayStyles = isMultiDay
    ? {
        width: `${(event as MultiDayEvent).spanCells * 100}%`,
        margin: `${EVENT_MARGIN_TOP}px ${EVENT_MARGIN}px`,
        top: `${
          // 멀티 이벤트 오프셋
          (multiDayEventsLength || 0) +
          // 싱글 이벤트 오프셋: 날짜별 eventIndex에 따라
          event.eventIndex * (EVENT_HEIGHT + EVENT_MARGIN_BOTTOM)
        }px`,
      }
    : {};

  const singleDayStyles = !isMultiDay
    ? {
        width: `calc(100% - ${2 * EVENT_MARGIN}px)`,
        margin: `${EVENT_MARGIN_TOP}px ${EVENT_MARGIN}px`,
        top: `${
          // 멀티 이벤트 오프셋
          (multiDayEventsLength || 0) +
          // 싱글 이벤트 오프셋: 날짜별 eventIndex에 따라
          event.eventIndex * (EVENT_HEIGHT + EVENT_MARGIN_BOTTOM)
        }px`,
      }
    : {};

  const backgroundClass = event.label
    ? LABEL_COLOR_MAP[event.label] || "bg-blue-500"
    : "bg-blue-500";

  return (
    <div
      ref={eventRef}
      id={event.id}
      className={`text-white p-1 rounded cursor-pointer flex justify-between items-center ${backgroundClass} ${isMultiDay ? "rounded-l rounded-r" : ""}`}
      style={{ ...baseStyles, ...multiDayStyles, ...singleDayStyles }}
    >
      <span>
        {event.title}
        {event.eventIndex}
      </span>
    </div>
  );
};
