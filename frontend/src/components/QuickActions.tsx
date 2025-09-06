import { motion } from "framer-motion";
import {
  FiZap,
  FiTarget,
  FiFileText,
  FiTrendingUp,
  FiClock,
  FiUsers,
  FiChevronRight,
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
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg mr-3 shadow-md">
          <FiTarget className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-dark-800">Quick Actions</h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`group w-full p-4 rounded-xl border-2 text-left transition-all transform hover:scale-[1.02] shadow-sm ${
              action.disabled
                ? "bg-gray-50 cursor-not-allowed opacity-50 border-gray-200"
                : "hover:border-teal-100 hover:shadow-lg bg-gradient-to-br from-white to-gray-50/50 border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${action.bgColor} text-white mr-4 flex-shrink-0 shadow-md`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-dark-800 mb-1 text-base">
                    {action.title}
                  </h4>
                  <p className="text-sm text-dark-600 leading-relaxed">
                    {action.description}
                  </p>
                  {action.disabled && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      Upload a resume first
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <FiChevronRight
                  className={`w-5 h-5 transition-transform ${
                    action.disabled
                      ? "text-gray-400"
                      : "text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1"
                  }`}
                />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Additional Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
        <div className="flex items-start">
          <div className="p-2 bg-teal-100 rounded-lg mr-3 flex-shrink-0">
            <FiUsers className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h4 className="font-semibold text-teal-800 mb-1">
              Professional Tip
            </h4>
            <p className="text-sm text-teal-700 leading-relaxed">
              Run multiple analyses to compare how your resume performs against
              different job descriptions. Use the insights to optimize your
              resume for better matches.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
