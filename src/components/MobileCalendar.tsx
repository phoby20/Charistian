// src/components/MobileCalendar.tsx
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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { LucidePlus } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

type MobileCalendarProps = {
  currentDate: Date;
  events: CustomCalendarEvent[];
  selectedDay: Date | null;
  setSelectedDate: Dispatch<SetStateAction<Date | null>>;
  setSelectedEvent: Dispatch<SetStateAction<CustomCalendarEvent | null>>;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  fetchDataAndEvents: () => Promise<void>;
  onAddClick: () => void;
};

// 라벨과 색상 매핑
const defaultLabelColors: Record<string, string> = {
  High: "#FF4444",
  Medium: "#FFBB33",
  Low: "#00C853",
};

export default function MobileCalendar({
  currentDate,
  events,
  selectedDay,
  setSelectedDate,
  setSelectedEvent,
  setIsDetailModalOpen,
  // fetchDataAndEvents,
  onAddClick,
}: MobileCalendarProps) {
  const locale = useLocale();
  const pathname = usePathname(); // 현재 경로 가져오기
  const [isDashboard, setIsDashboard] = useState(false);
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

  const today = new Date("2025-06-16T08:50:00+09:00"); // 현재 시간 반영

  const getEventCountAndColor = (day: Date) => {
    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.startDate), day)
    );
    if (dayEvents.length === 0) return { count: 0, color: "#000000" };
    const label = dayEvents[0].label || "Low";
    return {
      count: dayEvents.length,
      color: defaultLabelColors[label] || "#000000",
    };
  };

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

  useEffect(() => {
    const expectedPath = `/${locale}/calendar`;
    if (pathname !== expectedPath) {
      setIsDashboard(true);
      return;
    }
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      {!isDashboard && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              onAddClick(); // 기존 onAddClick 호출
            }}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            <LucidePlus size={20} />
          </button>
        </div>
      )}

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-center">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <th key={day} className="p-2 w-[14.28%]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(6).keys()].map((weekIndex) => (
            <tr key={weekIndex} className="h-1/6">
              {calendarDays
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((day, index) => {
                  const isCurrentMonth =
                    day >= startOfMonth(currentDate) &&
                    day <= endOfMonth(currentDate);
                  const { count, color } = getEventCountAndColor(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isToday = isSameDay(day, today);

                  return (
                    <td
                      key={index}
                      className={`p-2 w-[14.28%] border border-gray-400 relative ${
                        !isCurrentMonth ? "text-gray-300" : ""
                      }`}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setSelectedDate(day);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="flex items-center justify-center">
                          {isSelected ? (
                            <span className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300">
                              {format(day, "d")}
                            </span>
                          ) : isToday ? (
                            <span className="relative">
                              <span className="p-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                                {format(day, "d")}
                              </span>
                            </span>
                          ) : (
                            format(day, "d")
                          )}
                        </div>
                        {count > 0 && (
                          <div className="flex justify-center mt-1">
                            {Array.from({ length: count }, (_, i) => (
                              <span
                                key={i}
                                className="inline-block w-2 h-2 rounded-full ml-1"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
      {selectedDay && (
        <div className="mt-4 p-2 bg-white rounded-lg shadow">
          <h3 className="text-lg font-bold mb-2">
            {format(selectedDay, "yyyy년 MM월 dd일")} 일정
          </h3>
          {events
            .filter((event) =>
              isSameDay(new Date(event.startDate), selectedDay)
            )
            .map((event) => (
              <div
                key={event.id}
                className="p-2 mb-2 border text-xs rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                style={{
                  backgroundColor:
                    defaultLabelColors[event.label || "Low"] || "#FFFFFF",
                }}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsDetailModalOpen(true);
                }}
              >
                <span>
                  ({format(new Date(event.startDate), "HH:mm")}) {event.title}
                </span>
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
            ))}
        </div>
      )}
    </div>
  );
}
