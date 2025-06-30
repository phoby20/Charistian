// src/app/[locale]/setlists/create/page.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ChevronDown } from "lucide-react";
import Loading from "@/components/Loading";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { useRouter } from "@/utils/useRouter";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ko, ja } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import SelectedSongsList from "@/components/scores/SelectedSongsList";
import { Group, SelectedSong, Team } from "@/types/score";

export default function CreateSetlistPage() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>("");
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // date-fns 로케일 매핑
  const dateLocale = locale === "ko" ? ko : ja;

  useEffect(() => {
    if (!user || !user.churchId) return;

    const stored = sessionStorage.getItem("selectedSongList");
    if (stored) {
      try {
        setSelectedSongs(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing selectedSongList:", err);
      }
    }

    const fetchShares = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [groupRes, teamRes] = await Promise.all([
          fetch(`/api/groups/public?churchId=${user.churchId}`),
          fetch(`/api/teams?churchId=${user.churchId}`),
        ]);

        if (!groupRes.ok || !teamRes.ok) {
          throw new Error(t("fetchError"));
        }

        const groupData = await groupRes.json();
        const teamData = await teamRes.json();

        if (
          !Array.isArray(groupData.groups) ||
          !Array.isArray(teamData.teams)
        ) {
          throw new Error("Invalid response format");
        }

        setGroups(groupData.groups);
        setTeams(teamData.teams);
      } catch (err: unknown) {
        setError(t("fetchError"));
        console.error("Error fetching shares:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShares();
  }, [user, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!title || !date || !description || selectedSongs.length === 0) {
      setError(t("requiredFields"));
      setIsLoading(false);
      return;
    }
    if (!selectedGroup && selectedTeams.length === 0) {
      setError(t("requiredShares"));
      setIsLoading(false);
      return;
    }
    if (!user?.id || !user?.churchId) {
      setError(t("authError"));
      setIsLoading(false);
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/setlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: format(date, "yyyy-MM-dd"),
          description,
          scores: selectedSongs.map((song, index) => ({
            creationId: song.id,
            order: index + 1,
          })),
          shares: [
            ...(selectedGroup ? [{ groupId: selectedGroup }] : []),
            ...selectedTeams.map((teamId) => ({ teamId })),
          ],
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || t("createError"));
      }
      sessionStorage.removeItem("selectedSongList");
      router.push(`/setlists`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleRemoveSong = (index: number) => {
    setSelectedSongs((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      sessionStorage.setItem("selectedSongList", JSON.stringify(updated));
      return updated;
    });
  };

  const handleReorderSongs = (newSongs: SelectedSong[]) => {
    setSelectedSongs(newSongs);
    sessionStorage.setItem("selectedSongList", JSON.stringify(newSongs));
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {t("createSetlist")}
          </h1>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                {t("title")}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("enterTitle")}
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50"
                required
                aria-label={t("title")}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <label
                htmlFor="date"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                {t("date")}
              </label>
              <DatePicker
                id="date"
                selected={date}
                onChange={(date: Date | null) => setDate(date)}
                locale={dateLocale}
                dateFormat="yyyy-MM-dd"
                placeholderText={t("selectDate")}
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50"
                wrapperClassName="w-full"
                required
                aria-label={t("date")}
                popperClassName="z-50"
                showYearDropdown
                yearDropdownItemNumber={10}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                {t("description")}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("enterDescription")}
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 min-h-[100px] resize-y transition-all duration-200 hover:bg-gray-50"
                rows={4}
                required
                aria-label={t("description")}
              />
            </motion.div>

            {/* 선곡된 리스트 */}
            <SelectedSongsList
              selectedSongs={selectedSongs}
              onRemoveSong={handleRemoveSong}
              onReorderSongs={handleReorderSongs}
              t={t}
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("shareWith")}
              </h2>
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    {t("groups")}
                  </h3>
                  {groups.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("noGroups")}</p>
                  ) : (
                    <div className="relative">
                      <select
                        id="group"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 pr-10 appearance-none transition-all duration-200 hover:bg-gray-50"
                        aria-label={t("groups")}
                      >
                        <option value="">{t("selectGroup")}</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  )}
                </motion.div>
                <div>
                  <CheckboxGroup
                    items={teams}
                    selectedIds={selectedTeams}
                    setSelectedIds={setSelectedTeams}
                    label={t("teams")}
                    emptyMessage={t("noTeams")}
                  />
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={
                isSubmitting ||
                selectedSongs.length === 0 ||
                !title ||
                !date ||
                !description ||
                !selectedGroup ||
                selectedTeams.length === 0
              }
              className={`w-full py-3 rounded-xl text-white font-semibold text-sm ${
                isSubmitting ||
                selectedSongs.length === 0 ||
                !title ||
                !date ||
                !description ||
                !selectedGroup ||
                selectedTeams.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200 shadow-sm`}
            >
              {isSubmitting ? t("submitting") : t("createSetlist")}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
