// src/app/[locale]/setlists/shared/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/utils/useRouter";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Loading from "@/components/Loading";
import { useSearchParams } from "next/navigation";
import { MemberList } from "@/components/setList/MemberList";

interface Member {
  id: string;
  name: string;
  profileImage: string | null;
  teams: { id: string; name: string }[];
}

interface Team {
  id: string;
  name: string;
}

function SharedSetlist() {
  const t = useTranslations("Setlist");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.churchId) {
      router.push(`/dashboard`);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const teamIds = searchParams.get("teams")?.split(",") || [];
        if (teamIds.length === 0) {
          throw new Error(t("noTeamsShared"));
        }

        const teamRes = await fetch(`/api/teams?churchId=${user.churchId}`);
        if (!teamRes.ok) {
          throw new Error(t("fetchError"));
        }
        const teamData = await teamRes.json();
        if (!Array.isArray(teamData.teams)) {
          throw new Error(t("fetchError"));
        }
        const filteredTeams = teamData.teams.filter((team: Team) =>
          teamIds.includes(team.id)
        );
        setTeams(filteredTeams);

        const memberRes = await fetch("/api/members", {
          headers: { "Content-Type": "application/json" },
        });
        if (!memberRes.ok) {
          throw new Error(t("fetchMembersError"));
        }
        const memberData = await memberRes.json();
        if (!Array.isArray(memberData.members)) {
          throw new Error(t("fetchMembersError"));
        }
        const filteredMembers = memberData.members.filter((member: Member) =>
          member.teams.some((team) => teamIds.includes(team.id))
        );
        setMembers(filteredMembers);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("fetchError"));
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, searchParams, t, router]);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          {/* 헤더 섹션 */}
          <div className="text-center mb-14">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                {t("sharedTitle")}
              </h1>
            </div>
            <p className="text-base text-gray-600 mb-8">{t("sharedMessage")}</p>
          </div>

          {/* 에러 메시지 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            {/* 공유된 팀 목록 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t("sharedTeams")}
              </h2>
              {teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {teams.map((team) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {team.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {team.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("noTeams")}</p>
              )}
            </div>

            {/* 공유된 멤버 목록 */}
            <div>
              <MemberList members={members} emptyMessage={t("noMembers")} />
            </div>

            {/* 콘티 목록으로 이동 버튼 */}
            <Link href={`/${locale}/setlists`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#fc089e] hover:bg-[#ff66c4] transition-colors shadow-sm"
              >
                {t("goToSetlists")}
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SharedSetlistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SharedSetlist />
    </Suspense>
  );
}
