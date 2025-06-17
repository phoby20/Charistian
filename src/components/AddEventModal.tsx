import { Dispatch, SetStateAction, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Role } from "@prisma/client";
import { NewEvent } from "@/types/calendar";
import Button from "./Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toZonedTime } from "date-fns-tz";
import { addHours, isAfter } from "date-fns";
import { toCamelCase } from "@/utils/toCamelCase";

type AddEventModalProps = {
  newEvent: NewEvent;
  setIsAddModalOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedDate: Dispatch<SetStateAction<Date | null>>;
  handleAddEvent: () => Promise<void>;
  setNewEvent: Dispatch<SetStateAction<NewEvent>>;
};

export function AddEventModal({
  newEvent,
  setIsAddModalOpen,
  setSelectedDate,
  handleAddEvent,
  setNewEvent,
}: AddEventModalProps) {
  const t = useTranslations();
  const kstTimeZone = "Asia/Seoul";

  // KST 기준 기본 날짜 설정
  useEffect(() => {
    if (!newEvent.startDate || !newEvent.endDate) {
      const nowKst = toZonedTime(new Date(), kstTimeZone);
      const defaultEnd = addHours(nowKst, 1); // startDate + 1시간
      setNewEvent((prev) => ({
        ...prev,
        startDate: nowKst,
        endDate: defaultEnd,
      }));
    }
  }, [newEvent.startDate, newEvent.endDate, setNewEvent]);

  // 기본 역할 설정
  useEffect(() => {
    if (!newEvent.roles || newEvent.roles.length === 0) {
      setNewEvent((prev) => ({
        ...prev,
        roles: [Role.GENERAL, Role.SUPER_ADMIN, Role.ADMIN, Role.SUB_ADMIN],
      }));
    }
  }, [newEvent.roles, setNewEvent]);

  // startDate 변경 시 endDate 조정
  useEffect(() => {
    if (newEvent.startDate && newEvent.endDate) {
      const start = new Date(newEvent.startDate);
      const end = new Date(newEvent.endDate);
      if (!isAfter(end, start)) {
        const newEnd = addHours(start, 1);
        setNewEvent((prev) => ({ ...prev, endDate: newEnd }));
      }
    }
  }, [newEvent.startDate, setNewEvent]);

  // DatePicker에서 선택된 날짜를 KST로 변환
  const handleDateChange = (date: Date | null, field: keyof NewEvent) => {
    if (date) {
      const kstDate = toZonedTime(date, kstTimeZone);
      if (field === "startDate") {
        setNewEvent((prev) => {
          const newStart = kstDate;
          const currentEnd = prev.endDate ? new Date(prev.endDate) : null;
          // endDate가 startDate 이하라면 startDate + 1시간으로 조정
          const newEnd =
            currentEnd && isAfter(currentEnd, newStart)
              ? currentEnd
              : addHours(newStart, 1);
          return { ...prev, startDate: newStart, endDate: newEnd };
        });
      } else {
        setNewEvent((prev) => ({ ...prev, [field]: kstDate }));
      }
    } else {
      setNewEvent((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-out scale-100 hover:scale-[1.02]">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            {t("Calendar.addEvent")}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(false);
              setNewEvent({});
              setSelectedDate(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleAddEvent();
          }}
          className="mt-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.title")}
            </label>
            <input
              type="text"
              value={newEvent.title || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.description")}
            </label>
            <textarea
              value={newEvent.description || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
              placeholder={t("Calendar.enterDescription")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.startDate")}
            </label>
            <DatePicker
              selected={newEvent.startDate}
              onChange={(date: Date | null) =>
                handleDateChange(date, "startDate")
              }
              showTimeSelect
              timeFormat="HH:mm"
              dateFormat="yyyy-MM-dd HH:mm"
              timeIntervals={15}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.endDate")}
            </label>
            <DatePicker
              selected={newEvent.endDate}
              onChange={(date: Date | null) =>
                handleDateChange(date, "endDate")
              }
              showTimeSelect
              timeFormat="HH:mm"
              dateFormat="yyyy-MM-dd HH:mm"
              timeIntervals={15}
              minDate={newEvent.startDate}
              minTime={
                newEvent.startDate &&
                new Date(newEvent.startDate).toDateString() ===
                  new Date(newEvent.endDate || new Date()).toDateString()
                  ? new Date(
                      new Date(newEvent.startDate).setMinutes(
                        new Date(newEvent.startDate).getMinutes() + 15
                      )
                    )
                  : undefined
              }
              maxTime={
                newEvent.startDate &&
                new Date(newEvent.startDate).toDateString() ===
                  new Date(newEvent.endDate || new Date()).toDateString()
                  ? new Date(new Date().setHours(23, 45))
                  : undefined
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.label")}
            </label>
            <select
              value={newEvent.label || ""}
              onChange={(e) =>
                setNewEvent({ ...newEvent, label: e.target.value || null })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="Low">{t("Calendar.low")}</option>
              <option value="Medium">{t("Calendar.medium")}</option>
              <option value="High">{t("Calendar.high")}</option>
            </select>
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1">
              {t("Calendar.roles")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(Role)
                .filter(
                  (role) => !["MASTER", "CHECKER", "VISITOR"].includes(role)
                )
                .map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  >
                    <span
                      className={`relative flex items-center justify-center w-5 h-5 border-2 ${
                        (newEvent.roles || []).includes(role)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      } rounded-sm transition-all duration-200`}
                    >
                      {(newEvent.roles || []).includes(role) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={(newEvent.roles || []).includes(role)}
                      onChange={(e) => {
                        const roles = (newEvent.roles as Role[]) || [];
                        if (e.target.checked) {
                          setNewEvent({
                            ...newEvent,
                            roles: [...roles, role],
                          });
                        } else {
                          setNewEvent({
                            ...newEvent,
                            roles: roles.filter((r) => r !== role),
                          });
                        }
                      }}
                      className="absolute opacity-0 w-5 h-5 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">
                      {t(toCamelCase(role))}
                    </span>
                  </label>
                ))}
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewEvent({});
                setSelectedDate(null);
              }}
            >
              {t("Calendar.cancel")}
            </Button>
            <Button variant="primary" type="submit">
              {t("Calendar.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
