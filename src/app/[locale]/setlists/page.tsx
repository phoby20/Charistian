"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle, Search } from "lucide-react";
import Loading from "@/components/Loading";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ko, ja } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Setlists } from "@/types/score";
import MobileCardLayout from "@/components/scores/MobileCardLayout";
import DesktopTableLayout from "@/components/scores/DesktopTableLayout";
import Pagination from "@/components/scores/Pagination";

export default function SetlistListPage() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const [setlists, setSetlists] = useState<Setlists[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const dateLocale = locale === "ko" ? ko : ja;

  useEffect(() => {
    const fetchSetlists = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/setlists");
        if (!response.ok) {
          throw new Error((await response.json()).error || t("fetchError"));
        }
        setSetlists(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchSetlists();
  }, [t]);

  const filteredSetlists = setlists.filter((setlist) => {
    const matchesSearch = setlist.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const setlistDate = new Date(setlist.date);
    const matchesStartDate =
      !startDate || setlistDate >= new Date(format(startDate, "yyyy-MM-dd"));
    const matchesEndDate =
      !endDate || setlistDate <= new Date(format(endDate, "yyyy-MM-dd"));
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filteredSetlists.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSetlists = filteredSetlists.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900">{t("setlist")}</h1>
        </motion.div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 pl-10 pr-4 transition-all duration-200 hover:bg-gray-50"
                  aria-label={t("searchPlaceholder")}
                />
              </div>
            </motion.div>
            <div className="flex gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex-1"
              >
                <DatePicker
                  id="startDate"
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  locale={dateLocale}
                  dateFormat="yyyy-MM-dd"
                  placeholderText={t("selectStartDate")}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50"
                  wrapperClassName="w-full"
                  aria-label={t("selectStartDate")}
                  popperClassName="z-50 bg-white rounded-xl shadow-lg border border-gray-200"
                  showYearDropdown
                  yearDropdownItemNumber={10}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex-1"
              >
                <DatePicker
                  id="endDate"
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  locale={dateLocale}
                  dateFormat="yyyy-MM-dd"
                  placeholderText={t("selectEndDate")}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50"
                  wrapperClassName="w-full"
                  aria-label={t("selectEndDate")}
                  popperClassName="z-50 bg-white rounded-xl shadow-lg border border-gray-200"
                  showYearDropdown
                  yearDropdownItemNumber={10}
                />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-700 mr-2">
            {t("itemsPerPage")}
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-2 px-3 transition-all duration-200 hover:bg-gray-50"
            aria-label={t("itemsPerPage")}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {isLoading ? (
          <Loading />
        ) : filteredSetlists.length === 0 ? (
          <p className="text-center text-gray-500">{t("noSongs")}</p>
        ) : (
          <>
            <MobileCardLayout setlists={currentSetlists} />
            <DesktopTableLayout setlists={currentSetlists} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
