// src/components/DesktopCalendar.tsx
import { CustomCalendarEvent } from "@/types/calendar";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from "date-fns";
// import { LucideUserPlus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type DesktopCalendarProps = {
  currentDate: Date;
  events: CustomCalendarEvent[];
  setSelectedEvent: Dispatch<SetStateAction<CustomCalendarEvent | null>>;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  fetchDataAndEvents: () => Promise<void>;
  onDoubleClick: (day: Date) => void; // 더블클릭 핸들러 추가
};

export default function DesktopCalendar({
  currentDate,
  events,
  setSelectedEvent,
  setIsDetailModalOpen,
  // fetchDataAndEvents,
  onDoubleClick,
}: DesktopCalendarProps) {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const firstDayOfWeek = getDay(start);
  const daysBefore = Array.from({ length: firstDayOfWeek }, (_, i) =>
    addDays(start, -firstDayOfWeek + i)
  );
  const daysInCurrentMonth = eachDayOfInterval({ start, end });
  const totalCells = 42;
  const daysAfter = Array.from(
    { length: totalCells - daysBefore.length - daysInCurrentMonth.length },
    (_, i) => addDays(end, i + 1)
  );
  const calendarDays = [...daysBefore, ...daysInCurrentMonth, ...daysAfter];
  const today = new Date(); // 현재 시간 반영

  // const handleAttend = async (eventId: string) => {
  //   const res = await fetch("/api/events/attendance", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ eventId }),
  //     credentials: "include",
  //   });

  //   if (res.ok) {
  //     fetchDataAndEvents();
  //   }
  // };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full table-fixed border-collapse h-full">
        <thead>
          <tr className="text-center">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <th key={day} className="p-2 w-[14.28%]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="h-full relative"
          style={{ position: "relative", width: "100%" }}
        >
          {[...Array(6).keys()].map((weekIndex) => (
            <tr key={weekIndex} className="h-1/6">
              {calendarDays
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((day, index) => {
                  const isCurrentMonth =
                    day >= startOfMonth(currentDate) &&
                    day <= endOfMonth(currentDate);
                  const isToday = isSameDay(day, today);
                  // 시작 날짜가 현재 주에 속하는 이벤트만 필터링
                  const dayEvents = events.filter((event) => {
                    const eventStart = new Date(event.startDate);
                    const eventStartIndex = calendarDays.findIndex((d) =>
                      isSameDay(d, eventStart)
                    );
                    const eventStartWeekIndex = Math.floor(eventStartIndex / 7);
                    return (
                      eventStartWeekIndex === weekIndex &&
                      isSameDay(eventStart, day)
                    );
                  });

                  return (
                    <td
                      key={index}
                      className={`p-0 w-[14.28%] border border-gray-400 relative ${
                        !isCurrentMonth ? "text-gray-300" : ""
                      }`}
                      style={{
                        minHeight: "100px",
                        overflow: "visible",
                        position: "relative",
                      }}
                      onDoubleClick={(e) => {
                        const eventElements =
                          e.currentTarget.getElementsByClassName("bg-blue-500");
                        let isEventClicked = false;
                        for (const elem of eventElements) {
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
                          onDoubleClick(day); // 더블클릭 핸들러 호출
                        }
                      }}
                      onClick={(e) => {
                        const eventElements =
                          e.currentTarget.getElementsByClassName("bg-blue-500");
                        for (const elem of eventElements) {
                          const rect = elem.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const clickY = e.clientY - rect.top;
                          if (
                            clickX >= 0 &&
                            clickX <= rect.width &&
                            clickY >= 0 &&
                            clickY <= rect.height
                          ) {
                            const event = dayEvents.find(
                              (e) => e.id === elem.id
                            );
                            if (event) {
                              setSelectedEvent(event);
                              setIsDetailModalOpen(true);
                            }
                            break;
                          }
                        }
                      }}
                    >
                      <div
                        className={`absolute top-1 right-1 text-right ${
                          isToday ? "flex items-center" : ""
                        }`}
                      >
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
                      {dayEvents.map((event, eventIndex) => {
                        const isMultiDay = !isSameDay(
                          new Date(event.startDate),
                          new Date(event.endDate)
                        );
                        const startDayIndex = calendarDays.findIndex((d) =>
                          isSameDay(d, new Date(event.startDate))
                        );
                        const endDayIndex = calendarDays.findIndex((d) =>
                          isSameDay(d, new Date(event.endDate))
                        );
                        const totalSpanCells = endDayIndex - startDayIndex + 1;

                        // 다중 일정은 시작 날짜 셀에서만 렌더링
                        if (
                          isMultiDay &&
                          !isSameDay(day, new Date(event.startDate))
                        ) {
                          return null; // 중간 및 종료 날짜에서는 렌더링하지 않음
                        }

                        return (
                          <div
                            key={event.id + "_" + eventIndex}
                            id={event.id}
                            className={`bg-blue-500 text-white p-1 mt-1 rounded cursor-pointer flex justify-between items-center ${
                              isMultiDay ? "rounded-l rounded-r" : ""
                            }`}
                            style={{
                              position: isMultiDay ? "absolute" : "relative",
                              width: isMultiDay
                                ? `${totalSpanCells * 100}%`
                                : "auto",
                              top: isMultiDay
                                ? `${eventIndex * 1 + 30}px`
                                : "12px",
                              zIndex: isMultiDay ? 2 : 1, // 다중 일정은 상단에 표시
                              overflow: "visible",
                            }}
                          >
                            <span>{event.title}</span>
                            {/* <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAttend(event.id);
                              }}
                              className="ml-2 text-green-300 hover:text-green-500"
                            >
                              <LucideUserPlus size={16} />
                            </button> */}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
