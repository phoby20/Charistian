import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format, addDays } from "date-fns";
import { Role, User } from "@prisma/client";
import Button from "./Button";
import { EventDetailModal } from "./EventDetailModal";
import { CustomCalendarEvent, NewEvent } from "@/types/calendar";
import { AddEventModal } from "./AddEventModal";
import DesktopCalendar from "./DesktopCalendar";
import MobileCalendar from "./MobileCalendar";
import { toZonedTime } from "date-fns-tz";
import { usePathname } from "next/navigation"; // usePathname 추가

type EventCalendarProps = {
  user: User;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

export default function EventCalendar({
  user,
  setFetchError,
  setIsLoading,
}: EventCalendarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname(); // 현재 경로 가져오기
  const initialDate = toZonedTime(new Date(), "Asia/Seoul");
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] =
    useState<CustomCalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<NewEvent>({});

  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDataAndEvents = async () => {
    try {
      if (user) {
        const res = await fetch("/api/events", { credentials: "include" });
        if (res.ok) {
          const data: CustomCalendarEvent[] = await res.json();
          const kstEvents = data.map((event) => ({
            ...event,
            startDate: toZonedTime(new Date(event.startDate), "Asia/Seoul"),
            endDate: toZonedTime(new Date(event.endDate), "Asia/Seoul"),
          }));
          setEvents(kstEvents);
        } else {
          setFetchError(t("fetch_events_error"));
        }
      }
    } catch (error) {
      setFetchError(t("fetch_error"));
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDataAndEvents();
  }, [user]);

  const handleAddEvent = async () => {
    if (
      selectedDate &&
      newEvent.title &&
      newEvent.startDate &&
      newEvent.endDate &&
      user?.churchId
    ) {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          churchId: user.churchId,
          startDate: newEvent.startDate.toISOString(),
          endDate: newEvent.endDate.toISOString(),
          status: newEvent.status || "SCHEDULED",
          creatorId: user.id,
          roles: newEvent.roles as Role[],
          label: newEvent.label || "Low",
          description: newEvent.description || "",
        }),
        credentials: "include",
      });

      if (res.ok) {
        fetchDataAndEvents();
        setIsAddModalOpen(false);
        setNewEvent({});
        setSelectedDate(null);
      }
    }
  };

  // 데스크톱에서 더블클릭 시 날짜 설정, /:locale/calendar 경로에서만 실행
  const handleDesktopDoubleClick = (day: Date) => {
    const expectedPath = `/${locale}/calendar`;
    if (pathname !== expectedPath) {
      return;
    }

    if (!isMobile) {
      const kstDay = toZonedTime(day, "Asia/Seoul");
      console.log("kstDay: ", kstDay);
      setSelectedDate(kstDay);
      setNewEvent({
        ...newEvent,
        startDate: kstDay,
        endDate: kstDay,
      });
      setIsAddModalOpen(true);
    }
  };

  // 모바일에서 + 버튼 클릭 시 현재 날짜 설정
  const handleMobileAddClick = () => {
    if (isMobile) {
      const accessDate = selectedDate || toZonedTime(new Date(), "Asia/Seoul");
      console.log("accessDate: ", accessDate);
      setSelectedDate(accessDate);
      setNewEvent({
        ...newEvent,
        startDate: accessDate,
        endDate: accessDate,
      });
      setIsAddModalOpen(true);
    } else {
      setIsAddModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-gray-50 to-gray-200 p-2 rounded-lg h-screen flex flex-col">
        <h2 className="text-xl font-bold mt-6 mb-4 text-center">
          {t("calendar")}
        </h2>
        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(addDays(currentDate, -30))}
          >
            {t("Calendar.prevMonth")}
          </Button>
          <h3 className="text-lg">{format(currentDate, "yyyy년 MM월")}</h3>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(addDays(currentDate, 30))}
          >
            {t("Calendar.nextMonth")}
          </Button>
        </div>
        {isMobile ? (
          <MobileCalendar
            currentDate={currentDate}
            events={events}
            selectedDay={selectedDate}
            setSelectedDate={setSelectedDate}
            setSelectedEvent={setSelectedEvent}
            fetchDataAndEvents={fetchDataAndEvents}
            setIsDetailModalOpen={setIsDetailModalOpen}
            onAddClick={handleMobileAddClick}
          />
        ) : (
          <DesktopCalendar
            currentDate={currentDate}
            events={events}
            setSelectedEvent={setSelectedEvent}
            setIsDetailModalOpen={setIsDetailModalOpen}
            fetchDataAndEvents={fetchDataAndEvents}
            onDoubleClick={handleDesktopDoubleClick}
          />
        )}
      </div>

      {/* 일정 추가 모달 */}
      {isAddModalOpen && (
        <AddEventModal
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          setIsAddModalOpen={setIsAddModalOpen}
          setSelectedDate={setSelectedDate}
          handleAddEvent={handleAddEvent}
        />
      )}

      {/* 일정 상세 모달 */}
      {isDetailModalOpen && selectedEvent && (
        <EventDetailModal
          user={user}
          selectedEvent={selectedEvent}
          setFetchError={setFetchError}
          fetchDataAndEvents={fetchDataAndEvents}
          setIsDetailModalOpen={setIsDetailModalOpen}
          setIsLoading={setIsLoading}
        />
      )}
    </>
  );
}
