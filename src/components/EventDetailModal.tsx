import { useTranslations } from "next-intl";
import { X, Calendar, FileText, Clock } from "lucide-react"; // 추가 아이콘
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Dispatch, SetStateAction } from "react";
import { CustomCalendarEvent } from "@/types/calendar";
import Button from "./Button";
import { User } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion"; // framer-motion 추가

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

  // 라벨 배지 스타일
  const getLabelBadge = () => {
    const labelStyles: { [key: string]: string } = {
      High: "bg-red-600 text-white shadow-md",
      Medium: "bg-yellow-400 text-gray-900 shadow-md",
      Low: "bg-green-500 text-white shadow-md",
      default: "bg-gray-500 text-white shadow-md",
    };

    const label = selectedEvent.label || "default";
    const style = labelStyles[label] || labelStyles.default;
    return (
      <span
        className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} transition-all duration-200`}
      >
        {label === "default" ? t("Calendar.defaultLabel") : label}
      </span>
    );
  };

  // 이벤트 삭제
  const deleteEvent = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEvent.id }),
        credentials: "include",
      });
      await fetchDataAndEvents();
      setIsDetailModalOpen(false);
    } catch (error) {
      setFetchError(t("fetch_error"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 애니메이션 설정
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-md"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl p-6 w-full max-w-2xl sm:max-w-2xl mx-4 overflow-hidden"
          variants={modalVariants}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {t("Calendar.eventDetails")}
              </h2>
              {getLabelBadge()}
            </div>
            <motion.button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 rounded-full p-1.5 hover:bg-gray-100 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* 콘텐츠 */}
          <div className="mt-5 space-y-3 text-gray-600 text-sm sm:text-base">
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 items-center">
              <div className="flex items-center font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                {t("Calendar.title")}
              </div>
              <p className="text-gray-900 font-medium truncate">
                {selectedEvent.title}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 items-start">
              <div className="flex items-center font-medium text-gray-700">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                {t("Calendar.description")}
              </div>
              <p className="text-gray-900 max-h-20 overflow-y-auto">
                {selectedEvent.description || "-"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 items-center">
              <div className="flex items-center font-medium text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                {t("Calendar.startDate")}
              </div>
              <p className="text-gray-900">
                {format(safeStartDate, "yyyy-MM-dd HH:mm")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 items-center">
              <div className="flex items-center font-medium text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                {t("Calendar.endDate")}
              </div>
              <p className="text-gray-900">
                {format(safeEndDate, "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-6 flex justify-end gap-3">
            {(selectedEvent.creator.id === user.id ||
              user.role === "SUPER_ADMIN" ||
              user.role === "SUB_ADMIN" ||
              user.role === "ADMIN") && (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="danger" onClick={deleteEvent}>
                  {t("Calendar.delete")}
                </Button>
              </motion.div>
            )}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                {t("Calendar.close")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
