import { motion } from "framer-motion";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  FiTarget,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiZap,
  FiBookOpen,
  FiAward,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface EnhancedAnalysis {
  id: number;
  resumeFileName: string;
  jobTitle: string;
  overallMatchScore: number;
  matchPercentage: number;
  matchLevel: string;
  matchedSkills: string[];
  missingSkills: string[];
  totalRequiredSkills: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
  categoryScores: Record<string, number>;
  skillCategories: Array<{
    categoryName: string;
    skills: string[];
    matchScore: number;
    requiredCount: number;
    matchedCount: number;
    missingSkills: string[];
  }>;
  improvementSuggestions: string[];
  resumeTips: string[];
  learningRecommendations: string[];
  analyzedAt: string;
  analysisDuration: string;
}

interface AnalysisResultsProps {
  analysis: EnhancedAnalysis;
  onNewAnalysis: () => void;
}

export default function AnalysisResults({
  analysis,
  onNewAnalysis,
}: AnalysisResultsProps) {
  // Debug log to see what data we're receiving
  console.log("AnalysisResults received data:", analysis);

  // Safety check - if analysis data is incomplete, show error
  if (!analysis) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>No analysis data available</p>
      </div>
    );
  }

  const [expandedSections, setExpandedSections] = useState({
    improvements: false,
    tips: false,
    learning: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getMatchLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "excellent":
        return "text-green-600 bg-green-100 border-green-200";
      case "good":
        return "text-teal-600 bg-teal-100 border-teal-200";
      case "fair":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "poor":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  // Chart data for skills breakdown
  const skillsChartData = {
    labels: ["Matched Skills", "Missing Skills"],
    datasets: [
      {
        data: [analysis.matchedSkillsCount, analysis.missingSkillsCount],
        backgroundColor: ["#0d9488", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Category scores chart
  const categoryData = {
    labels: Object.keys(analysis.categoryScores || {}),
    datasets: [
      {
        label: "Category Scores",
        data: Object.values(analysis.categoryScores || {}).map(
          (score) => score * 100
        ),
        backgroundColor: "rgba(13, 148, 136, 0.8)",
        borderColor: "rgb(13, 148, 136)",
        borderWidth: 1,
        borderRadius: 4,
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
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analysis Complete!</h2>
            <p className="opacity-90">
              {analysis.resumeFileName} vs {analysis.jobTitle}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {analysis.matchPercentage}%
            </div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getMatchLevelColor(
                analysis.matchLevel
              )} bg-white`}
            >
              {analysis.matchLevel}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">
              {analysis.matchedSkillsCount}
            </div>
            <div className="text-sm opacity-80">Matched Skills</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {analysis.missingSkillsCount}
            </div>
            <div className="text-sm opacity-80">Missing Skills</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {analysis.totalRequiredSkills}
            </div>
            <div className="text-sm opacity-80">Total Required</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FiTarget className="w-5 h-5 text-teal-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-800">
              Skills Breakdown
            </h3>
          </div>
          <div className="h-48">
            <Doughnut
              data={skillsChartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FiTrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-800">
              Category Scores
            </h3>
          </div>
          <div className="h-48">
            {Object.keys(analysis.categoryScores || {}).length > 0 ? (
              <Bar data={categoryData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-800">
              Matched Skills
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analysis.matchedSkills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center p-2 bg-green-50 rounded-lg"
              >
                <FiCheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-green-800">{skill}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FiXCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-dark-800">
              Missing Skills
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analysis.missingSkills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center p-2 bg-red-50 rounded-lg"
              >
                <FiXCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-red-800">{skill}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Analysis Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
          <FiZap className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold text-indigo-900">
            Enhanced Analysis Insights
          </h2>
        </div>
        <p className="text-gray-600 mt-2">
          Personalized recommendations to boost your career prospects
        </p>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Improvement Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiZap className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-dark-800">
                Improvement Suggestions
              </h3>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {(analysis.improvementSuggestions || []).length} tips
            </span>
          </div>
          <div className="space-y-3">
            {(expandedSections.improvements
              ? analysis.improvementSuggestions || []
              : (analysis.improvementSuggestions || []).slice(0, 3)
            ).map((suggestion, index) => (
              <motion.div
                key={index}
                className="flex items-start p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FiArrowRight className="w-4 h-4 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-dark-700 leading-relaxed">
                  {suggestion}
                </p>
              </motion.div>
            ))}
            {(analysis.improvementSuggestions || []).length > 3 && (
              <button
                onClick={() => toggleSection("improvements")}
                className="w-full flex items-center justify-center mt-4 py-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
              >
                {expandedSections.improvements ? (
                  <>
                    <FiChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <FiChevronDown className="w-4 h-4 mr-1" />
                    Show All (
                    {(analysis.improvementSuggestions || []).length - 3} more)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resume Tips */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiAward className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-dark-800">
                Resume Tips
              </h3>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {(analysis.resumeTips || []).length} tips
            </span>
          </div>
          <div className="space-y-3">
            {(expandedSections.tips
              ? analysis.resumeTips || []
              : (analysis.resumeTips || []).slice(0, 3)
            ).map((tip, index) => (
              <motion.div
                key={index}
                className="flex items-start p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FiArrowRight className="w-4 h-4 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-dark-700 leading-relaxed">{tip}</p>
              </motion.div>
            ))}
            {(analysis.resumeTips || []).length > 3 && (
              <button
                onClick={() => toggleSection("tips")}
                className="w-full flex items-center justify-center mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                {expandedSections.tips ? (
                  <>
                    <FiChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <FiChevronDown className="w-4 h-4 mr-1" />
                    Show All ({(analysis.resumeTips || []).length - 3} more)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Learning Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiBookOpen className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-dark-800">
                Learning Recommendations
              </h3>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {(analysis.learningRecommendations || []).length} paths
            </span>
          </div>
          <div className="space-y-3">
            {(expandedSections.learning
              ? analysis.learningRecommendations || []
              : (analysis.learningRecommendations || []).slice(0, 3)
            ).map((recommendation, index) => (
              <motion.div
                key={index}
                className="flex items-start p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FiArrowRight className="w-4 h-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-dark-700 leading-relaxed">
                  {recommendation}
                </p>
              </motion.div>
            ))}
            {(analysis.learningRecommendations || []).length > 3 && (
              <button
                onClick={() => toggleSection("learning")}
                className="w-full flex items-center justify-center mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {expandedSections.learning ? (
                  <>
                    <FiChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <FiChevronDown className="w-4 h-4 mr-1" />
                    Show All (
                    {(analysis.learningRecommendations || []).length - 3} more)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 transform hover:scale-105 transition-all"
        >
          <FiTarget className="w-5 h-5 mr-2" />
          Run New Analysis
        </button>
      </div>
    </motion.div>
  );
}
