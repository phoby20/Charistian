// src/app/[locale]/setlists/[id]/edit/page.tsx
"use client";
import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Trash2 } from "lucide-react";
import Loading from "@/components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import { ko, ja } from "date-fns/locale";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { SelectedSong, SetlistResponse, Team } from "@/types/score";
import { useRouter } from "@/utils/useRouter";
import SelectedSongsList from "@/components/scores/SelectedSongsList";
import Button from "@/components/Button";

export default function SetlistEditPage() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>("");
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<{ [index: number]: string }>(
    {}
  ); // selectedKey 상태 추가
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFormInvalid, setIsFormInvalid] = useState<boolean>(false);
  const [selectedUrls, setSelectedUrls] = useState<{ [key: string]: string }>(
    {}
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const dateLocale = locale === "ko" ? ko : ja;

  useEffect(() => {
    const isInvalid =
      !title.trim() ||
      !date ||
      !description.trim() ||
      selectedSongs.length === 0 ||
      selectedTeams.length === 0;
    setIsFormInvalid(isInvalid);
  }, [title, date, description, selectedSongs, selectedTeams]);

  useEffect(() => {
    if (!user || !user.churchId) {
      setError(t("authError"));
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const setlistRes = await fetch(`/api/setlists/${id}`);
        if (!setlistRes.ok) throw new Error(t("fetchError"));
        const { setlist }: { setlist: SetlistResponse; appUrl: string } =
          await setlistRes.json();

        const canEdit =
          user &&
          (user.id === setlist?.creatorId ||
            ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role));

        if (!canEdit) {
          router.push(`/setlists`);
          return;
        }

        setTitle(setlist.title || "");
        if (setlist.date) {
          const parsedDate = parseISO(setlist.date);
          if (!isNaN(parsedDate.getTime())) {
            setDate(parsedDate);
          } else {
            setError(t("invalidDateFormat"));
            setDate(null);
          }
        } else {
          setDate(null);
        }
        setDescription(setlist.description || "");
        const initialSongs: SelectedSong[] = Array.isArray(setlist.scores)
          ? setlist.scores
              .sort((a, b) => a.order - b.order)
              .map((score) => ({
                id: score.creation.id,
                title: score.creation.title || "",
                titleJa: score.creation.titleJa || "",
                titleEn: score.creation.titleEn || "",
                scoreKeys: score.creation.scoreKeys || [], // key 대신 scoreKeys 사용
                referenceUrls: score.creation.referenceUrls || [],
              }))
          : [];
        setSelectedSongs(initialSongs);
        const initialUrls: { [key: string]: string } = {};
        const initialKeys: { [index: number]: string } = {};
        setlist.scores.forEach((score, index) => {
          if (score.selectedReferenceUrl) {
            initialUrls[score.creation.id] = score.selectedReferenceUrl;
          }
          if (score.selectedKey) {
            initialKeys[index] = score.selectedKey; // 초기 selectedKey 설정
          }
        });
        setSelectedUrls(initialUrls);
        setSelectedKeys(initialKeys);
        sessionStorage.setItem(
          "selectedSongList",
          JSON.stringify(initialSongs)
        );
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
          throw new Error(t("invalidResponseFormat"));
        }
        setTeams(teamData.teams);

        const teamShares =
          setlist.shares
            ?.filter((s: { team?: Team }) => s.team)
            .map((s) => s.team?.id ?? "") || [];
        setSelectedTeams(teamShares);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, t, user, router]);

  // 키 선택 핸들러 추가
  const handleKeySelect = (index: number, key: string) => {
    setSelectedKeys((prev) => ({ ...prev, [index]: key }));
  };

  // YouTube URL 선택 핸들러
  const handleUrlSelect = (songId: string, url: string) => {
    setSelectedUrls((prev) => ({ ...prev, [songId]: url }));
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/setlists/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || t("deleteError"));
      }
      sessionStorage.removeItem("selectedSongList");
      router.push(`/setlists`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isFormInvalid) {
      setError(t("requiredFields"));
      return;
    }
    if (!user?.id || !user?.churchId) {
      setError(t("authError"));
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/setlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: date ? format(date, "yyyy-MM-dd") : null,
          description,
          scores: selectedSongs.map((song, index) => ({
            creationId: song.id,
            order: index + 1,
            selectedReferenceUrl:
              selectedUrls[song.id] ||
              song.referenceUrls.find(
                (url) => url.includes("youtube.com") || url.includes("youtu.be")
              ),
            selectedKey: selectedKeys[index] || song.scoreKeys[0]?.key || "", // selectedKey 추가
          })),
          shares: [...selectedTeams.map((teamId) => ({ teamId }))],
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || t("updateError"));
      }
      sessionStorage.removeItem("selectedSongList");
      router.push(`/setlists`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSong = (index: number) => {
    setSelectedSongs((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      sessionStorage.setItem("selectedSongList", JSON.stringify(updated));
      // selectedKeys에서도 해당 인덱스 제거
      setSelectedKeys((prev) => {
        const updatedKeys = { ...prev };
        delete updatedKeys[index];
        // 인덱스 재조정
        const newKeys: { [index: number]: string } = {};
        Object.keys(updatedKeys).forEach((key) => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            newKeys[oldIndex - 1] = updatedKeys[oldIndex];
          } else if (oldIndex < index) {
            newKeys[oldIndex] = updatedKeys[oldIndex];
          }
        });
        return newKeys;
      });
      return updated;
    });
  };

  const handleReorderSongs = (newSongs: SelectedSong[]) => {
    setSelectedSongs(() => {
      sessionStorage.setItem("selectedSongList", JSON.stringify(newSongs));
      // selectedKeys 재조정
      setSelectedKeys((prev) => {
        const newKeys: { [index: number]: string } = {};
        newSongs.forEach((song, newIndex) => {
          const oldIndex = selectedSongs.findIndex((s) => s.id === song.id);
          if (prev[oldIndex]) {
            newKeys[newIndex] = prev[oldIndex];
          }
        });
        return newKeys;
      });
      return newSongs;
    });
  };

  if (isLoading || !user) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-14">
            <div className="flex items-center justify-between w-full">
              <Link href={`/${locale}/setlists/${id}`}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer flex items-center space-x-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-xl shadow-sm hover:bg-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {t("backToDetail")}
                  </span>
                </motion.button>
              </Link>
              <motion.button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                whileHover={{ scale: isDeleting ? 1 : 1.05 }}
                whileTap={{ scale: isDeleting ? 1 : 0.95 }}
                className={`cursor-pointer flex items-center space-x-2 ${
                  isDeleting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white py-2 px-4 rounded-xl shadow-sm transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">{t("delete")}</span>
              </motion.button>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-8">
            {t("editSetlist")}
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
                className={`block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50 ${
                  error && !title.trim() ? "border-red-500" : ""
                }`}
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
                className={`block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 transition-all duration-200 hover:bg-gray-50 ${
                  error && !date ? "border-red-500" : ""
                }`}
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
                className={`block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-800 text-sm py-3 px-4 min-h-[100px] resize-y transition-all duration-200 hover:bg-gray-50 ${
                  error && !description.trim() ? "border-red-500" : ""
                }`}
                rows={4}
                required
                aria-label={t("description")}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <SelectedSongsList
                selectedSongs={selectedSongs}
                onRemoveSong={handleRemoveSong}
                onReorderSongs={handleReorderSongs}
                onKeySelect={handleKeySelect} // onKeySelect prop 추가
                t={t}
                onUrlSelect={handleUrlSelect}
                selectedUrls={selectedUrls}
              />
            </motion.div>
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">
                {t("shareWith")}
              </h2>
              <div className="space-y-6">
                <div>
                  <CheckboxGroup
                    items={teams}
                    selectedIds={selectedTeams}
                    setSelectedIds={setSelectedTeams}
                    emptyMessage={t("noTeams")}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" isDisabled={isSubmitting || isFormInvalid}>
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("submitting")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
