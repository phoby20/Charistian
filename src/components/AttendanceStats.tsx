// src/components/AttendanceStats.tsx
"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { User } from "@prisma/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceStatsData {
  todayCount: number;
  weekRate: number;
  last7Days: { date: string; count: number }[];
}

interface AttendanceStatsProps {
  user: User | null;
  attendanceStats: AttendanceStatsData;
  selectedGroups: string[];
  selectedSubGroups: string[];
  selectedTeams: string[];
}

export default function AttendanceStats({
  user,
  attendanceStats,
  selectedGroups,
  selectedSubGroups,
  selectedTeams,
}: AttendanceStatsProps) {
  const t = useTranslations();

  const chartData = {
    labels: attendanceStats.last7Days.map((day) => day.date),
    datasets: [
      {
        label: t("last7Days"),
        data: attendanceStats.last7Days.map((day) => day.count),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${t("attendanceCount")}: ${context.parsed.y} ${t("people")}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t("date"),
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t("attendanceCount"),
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
  };

  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-lg shadow-md w-full"
    >
      <h2 className="text-xl font-semibold mb-4">{t("attendanceStats")}</h2>
      <div className="mb-4">
        <p className="text-gray-600">
          {t("filtersApplied")}:{" "}
          {selectedGroups.length > 0
            ? `${t("groupLabel")}: ${selectedGroups.join(", ")}`
            : t("noGroups")}
          {", "}
          {selectedSubGroups.length > 0
            ? `${t("subGroupLabel")}: ${selectedSubGroups.join(", ")}`
            : t("noSubGroups")}
          {", "}
          {selectedTeams.length > 0
            ? `${t("teamLabel")}: ${selectedTeams.join(", ")}`
            : t("noTeams")}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">{t("todayAttendance")}</p>
          <p className="text-2xl font-bold text-blue-600">
            {attendanceStats.todayCount}
          </p>
        </div>
        <div>
          <p className="text-gray-600">{t("weeklyAttendanceRate")}</p>
          <p className="text-2xl font-bold text-blue-600">
            {attendanceStats.weekRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-gray-600">{t("last7Days")}</p>
          <div className="h-64" aria-label={t("last7Days")}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
