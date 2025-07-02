import { motion } from "framer-motion";
import {
  FiZap,
  FiTarget,
  FiFileText,
  FiTrendingUp,
  FiClock,
  FiUsers,
} from "react-icons/fi";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  onNewAnalysis: () => void;
  onViewHistory: () => void;
  onManageResumes: () => void;
  onViewTrends: () => void;
  hasResumes: boolean;
}

export default function QuickActions({
  onNewAnalysis,
  onViewHistory,
  onManageResumes,
  onViewTrends,
  hasResumes,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: "New Analysis",
      description: "Analyze your resume against a job description",
      icon: FiZap,
      color: "teal",
      bgColor: "from-teal-500 to-cyan-500",
      onClick: onNewAnalysis,
      disabled: !hasResumes,
    },
    {
      title: "View History",
      description: "Browse your past analysis results",
      icon: FiClock,
      color: "blue",
      bgColor: "from-blue-500 to-indigo-500",
      onClick: onViewHistory,
    },
    {
      title: "Manage Resumes",
      description: "Upload and organize your resume versions",
      icon: FiFileText,
      color: "purple",
      bgColor: "from-purple-500 to-pink-500",
      onClick: onManageResumes,
    },
    {
      title: "View Trends",
      description: "See your improvement over time",
      icon: FiTrendingUp,
      color: "emerald",
      bgColor: "from-emerald-500 to-green-500",
      onClick: onViewTrends,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg mr-3">
          <FiTarget className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-dark-800">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`p-4 rounded-xl border-2 border-transparent text-left transition-all transform hover:scale-105 ${
              action.disabled
                ? "bg-gray-50 cursor-not-allowed opacity-50"
                : "hover:border-gray-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-start">
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${action.bgColor} text-white mr-4 flex-shrink-0`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-dark-800 mb-1">
                  {action.title}
                </h4>
                <p className="text-sm text-dark-600 leading-relaxed">
                  {action.description}
                </p>
                {action.disabled && (
                  <p className="text-xs text-red-500 mt-1">
                    Upload a resume first
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Additional Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
        <div className="flex items-start">
          <FiUsers className="w-5 h-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-teal-800 mb-1">Pro Tip</h4>
            <p className="text-sm text-teal-700">
              Run multiple analyses to compare how your resume performs against
              different job descriptions. Use the insights to optimize your
              resume for better matches!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
