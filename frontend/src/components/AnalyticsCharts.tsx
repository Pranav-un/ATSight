import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { FiTrendingUp, FiTarget, FiBarChart } from "react-icons/fi";
import type { AnalyticsData } from "../types/analytics";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface AnalyticsChartsProps {
  analyticsData: AnalyticsData | null;
  loading?: boolean;
}

export default function AnalyticsCharts({
  analyticsData,
  loading = false,
}: AnalyticsChartsProps) {
  if (loading || !analyticsData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Skills Distribution Doughnut Chart
  const skillsData = {
    labels: Object.keys(analyticsData.skillsDistribution),
    datasets: [
      {
        data: Object.values(analyticsData.skillsDistribution),
        backgroundColor: [
          "#0d9488", // teal-600
          "#06b6d4", // cyan-500
          "#3b82f6", // blue-500
          "#8b5cf6", // violet-500
          "#ec4899", // pink-500
          "#f59e0b", // amber-500
          "#ef4444", // red-500
          "#84cc16", // lime-500
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 8,
        hoverBorderWidth: 3,
      },
    ],
  };

  // Score History Bar Chart with gradient
  const scoresData = {
    labels: analyticsData.scoreHistory.map((h) => h.date),
    datasets: [
      {
        label: "Match Score (%)",
        data: analyticsData.scoreHistory.map((h) => h.score * 100),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(13, 148, 136, 0.8)";

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top
          );
          gradient.addColorStop(0, "rgba(13, 148, 136, 0.1)");
          gradient.addColorStop(1, "rgba(13, 148, 136, 0.8)");
          return gradient;
        },
        borderColor: "rgb(13, 148, 136)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            weight: "bold" as const,
          },
          color: "#374151",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          },
        },
      },
    },
    cutout: "60%",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Skills Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg mr-4">
            <FiTarget className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Skills Distribution
            </h3>
            <p className="text-sm text-gray-600">Breakdown by categories</p>
          </div>
        </div>
        <div className="h-56 relative">
          {Object.keys(analyticsData.skillsDistribution).length > 0 ? (
            <>
              <Doughnut data={skillsData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.keys(analyticsData.skillsDistribution).length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FiTarget className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div>No skills data available</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Score Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-4">
            <FiTrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Performance Trends
            </h3>
            <p className="text-sm text-gray-600">Match scores over time</p>
          </div>
        </div>
        <div className="h-56">
          {analyticsData.scoreHistory.length > 0 ? (
            <Bar data={scoresData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div>No analysis history</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg mr-4">
            <FiBarChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Top Skills</h3>
            <p className="text-sm text-gray-600">Most requested skills</p>
          </div>
        </div>
        <div className="space-y-4">
          {analyticsData.topSkills.length > 0 ? (
            analyticsData.topSkills.slice(0, 6).map((skill, index) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800">
                    {skill.skill}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (skill.frequency /
                            Math.max(
                              ...analyticsData.topSkills.map((s) => s.frequency)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-600 min-w-[2rem] text-right">
                    {skill.frequency}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <FiBarChart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>No skills data available</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
