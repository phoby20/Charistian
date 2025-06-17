import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz"; // KST로 변환
import { Dispatch, SetStateAction } from "react";
import { CustomCalendarEvent } from "@/types/calendar";
import Button from "./Button";
import { User } from "@prisma/client";

type EventDetailModalProps = {
  user: User;
  setIsDetailModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedEvent: CustomCalendarEvent | null;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  fetchDataAndEvents: () => Promise<void>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

export function EventDetailModal({
  user,
  setIsDetailModalOpen,
  selectedEvent,
  setFetchError,
  fetchDataAndEvents,
  setIsLoading,
}: EventDetailModalProps) {
  const t = useTranslations();

  if (!selectedEvent) return null;

  const kstTimeZone = "Asia/Seoul";
  const safeStartDate = selectedEvent.startDate
    ? toZonedTime(new Date(selectedEvent.startDate), kstTimeZone)
    : toZonedTime(new Date(), kstTimeZone);
  const safeEndDate = selectedEvent.endDate
    ? toZonedTime(new Date(selectedEvent.endDate), kstTimeZone)
    : toZonedTime(new Date(), kstTimeZone);

  // const attendeeCount = selectedEvent.attendees.length;

  // label에 따른 배지 스타일과 텍스트 (인덱스 시그니처 추가)
  const getLabelBadge = () => {
    const labelStyles: { [key: string]: string } = {
      High: "bg-red-500 text-white",
      Medium: "bg-yellow-500 text-black",
      Low: "bg-green-500 text-white",
      default: "bg-gray-500 text-white",
    };

    if (!selectedEvent.label) {
      // falsy 값일 경우 default 스타일 적용
      return (
        <span
          className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${labelStyles.default}`}
        >
          {t("Calendar.defaultLabel")} {/* 또는 빈 문자열 "" */}
        </span>
      );
    }
    const style = labelStyles[selectedEvent.label] || labelStyles.default;
    return (
      <span
        className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${style}`}
      >
        {selectedEvent.label}
      </span>
    );
  };

  const deleteEvent = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id,
        }),
        credentials: "include",
      });
      fetchDataAndEvents();
      setIsDetailModalOpen(false);
      setIsLoading(false);
    } catch (error) {
      setFetchError(t("fetch_error"));
      console.error(error);
    }
  };

  return (
    <div className="fixed p-2 inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-out scale-100 hover:scale-[1.02]">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            {t("Calendar.eventDetails")}
            {getLabelBadge()}
          </h2>
          <button
            type="button"
            onClick={() => setIsDetailModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mt-6 space-y-4 text-gray-700">
          <p className="flex justify-between">
            <span className="font-medium">{t("Calendar.title")}:</span>
            <span className="text-gray-900">{selectedEvent.title}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">{t("Calendar.description")}:</span>
            <span className="text-gray-900">
              {selectedEvent.description || "-"}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">{t("Calendar.startDate")}:</span>
            <span className="text-gray-900">
              {format(safeStartDate, "yyyy-MM-dd HH:mm")}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">{t("Calendar.endDate")}:</span>
            <span className="text-gray-900">
              {format(safeEndDate, "yyyy-MM-dd HH:mm")}
            </span>
          </p>

          {/* <p className="flex justify-between">
            <span className="font-medium">{t("Calendar.attendees")}:</span>
            <span className="text-gray-900">{attendeeCount}명</span>
          </p> */}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          {(selectedEvent.creator.id === user.id ||
            user.role === "SUPER_ADMIN" ||
            user.role === "SUB_ADMIN" ||
            user.role === "ADMIN") && (
            <Button variant="danger" onClick={() => deleteEvent()}>
              삭제
            </Button>
          )}

          <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
            {t("Calendar.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
