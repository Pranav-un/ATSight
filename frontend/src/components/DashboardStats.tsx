import { motion } from "framer-motion";
import { FiTrendingUp, FiTarget, FiFileText, FiClock } from "react-icons/fi";
import type { DashboardStats as DashboardStatsType } from "../types/analytics";

interface StatsProps {
  stats: DashboardStatsType | null;
  loading?: boolean;
}

export default function DashboardStats({ stats, loading = false }: StatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const dashboardItems = [
    {
      title: "Total Analyses",
      value: stats.totalAnalyses,
      icon: FiTarget,
      color: "teal",
      bgColor: "from-teal-500 to-cyan-500",
    },
    {
      title: "Average Score",
      value: `${Math.round(stats.averageScore)}%`,
      icon: FiTrendingUp,
      color: "blue",
      bgColor: "from-blue-500 to-indigo-500",
    },
    {
      title: "Resume Versions",
      value: stats.totalResumes,
      icon: FiFileText,
      color: "purple",
      bgColor: "from-purple-500 to-pink-500",
    },
    {
      title: "Last Analysis",
      value: stats.lastAnalysisDate
        ? new Date(stats.lastAnalysisDate).toLocaleDateString()
        : "Never",
      icon: FiClock,
      color: "emerald",
      bgColor: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {dashboardItems.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-5`}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${stat.bgColor} text-white`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-dark-800">
                  {stat.value}
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-dark-600">{stat.title}</h3>
          </div>

          {/* Hover effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0`}
            whileHover={{ opacity: 0.05 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );
}
