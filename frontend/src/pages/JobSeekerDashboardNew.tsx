import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiFileText,
  FiBarChart,
  FiUser,
  FiLogOut,
  FiTarget,
  FiChevronRight,
  FiPlay,
  FiEye,
  FiFolder,
  FiSearch,
  FiArchive,
  FiHome,
  FiSettings,
  FiTrendingUp,
  FiBell,
  FiClock,
} from "react-icons/fi";
import {
  apiCall,
  uploadFile,
  isAuthenticated,
  debugAuth,
  fetchDashboardStats,
  fetchFullAnalytics,
} from "../utils/api";
import DashboardStats from "../components/DashboardStats";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ProfileSection from "../components/ProfileSection";
import QuickActions from "../components/QuickActions";
import AnalysisResults from "../components/AnalysisResults";
import ProfileModal from "../components/ProfileModal";
import UserProfileModal from "../components/UserProfileModal";
import ProfilePicture from "../components/ProfilePicture";
import CustomLoader from "../components/CustomLoader";
import type {
  DashboardStats as DashboardStatsType,
  AnalyticsData,
} from "../types/analytics";

// Types based on API responses
interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

interface UserProfile {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  role: string;
}

interface Resume {
  id: number;
  user: User;
  fileName: string;
  filePath: string;
  parsedText: string;
  uploadDate: string;
}

interface EnhancedAnalysis {
  id: number;
  resumeId: number;
  jobDescriptionId: number;
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

const AnalysisLoadingAnimation = () => {
  const loadingTexts = [
    "Processing resume content...",
    "Analyzing job requirements...",
    "Matching qualifications and skills...",
    "Generating compatibility report...",
    "Calculating alignment scores...",
    "Finalizing analysis...",
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center space-y-8">
        {/* Custom Loader */}
        <CustomLoader />

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.h3
              key={currentTextIndex}
              className="text-2xl font-bold text-dark-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {loadingTexts[currentTextIndex]}
            </motion.h3>
          </AnimatePresence>

          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <motion.div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "easeInOut" }}
            />
          </div>

          <p className="text-dark-600">Processing comprehensive analysis...</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function JobSeekerDashboard() {
  const tabs = [
    { id: "overview" as const, name: "Overview", icon: FiHome },
    { id: "analyze" as const, name: "Analyze", icon: FiSearch },
    { id: "results" as const, name: "Results", icon: FiFileText },
    { id: "history" as const, name: "History", icon: FiArchive },
    { id: "analytics" as const, name: "Analytics", icon: FiTrendingUp },
  ];

  const [activeTab, setActiveTab] = useState<
    "overview" | "analyze" | "results" | "history" | "analytics"
  >("overview");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] =
    useState<EnhancedAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [profileResumes, setProfileResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<EnhancedAnalysis[]>(
    []
  );
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications] = useState(3); // Mock notification count
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "user@example.com", // TODO: Get from auth context
    role: "Job Seeker",
  });
  const [dashboardStats, setDashboardStats] =
    useState<DashboardStatsType | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load profile resumes on component mount
  useEffect(() => {
    console.log("Dashboard useEffect triggered");

    // Debug authentication before checking
    debugAuth();

    // Check authentication first
    if (!isAuthenticated()) {
      console.error("User not authenticated - token missing");
      console.log("localStorage contents:", localStorage);
      return;
    }

    console.log("User authenticated, loading data...");

    loadUserProfile();
    loadProfileResumes();
    loadAnalysisHistory();
    loadDashboardStats();
    loadAnalyticsData();
  }, []);

  // Monitor analysis results changes
  useEffect(() => {
    console.log("Analysis results changed:", analysisResults);
    if (analysisResults) {
      console.log(
        "Analysis results are now available, switching to results tab"
      );
      setActiveTab("results");
    }
  }, [analysisResults]);

  const loadUserProfile = async () => {
    try {
      console.log("Loading user profile from backend...");
      const response = await apiCall("/api/user/profile", {}, false);
      if (response.ok) {
        const profileData = await response.json();
        console.log("Loaded user profile:", profileData);
        setUserProfile(profileData);
      } else {
        console.error("Failed to load user profile:", response.status);
        // If profile doesn't exist, set email from localStorage as fallback
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          setUserProfile((prev) => ({
            ...prev,
            email: userEmail,
          }));
        }
        // The backend should create a default profile automatically on first access
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Set email from localStorage as fallback
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        setUserProfile((prev) => ({
          ...prev,
          email: userEmail,
        }));
      }
    }
  };

  const loadProfileResumes = async () => {
    console.log("Loading profile resumes...");
    try {
      const response = await apiCall("/api/resume/versions", {}, false);
      console.log(
        "Resume versions response:",
        response.status,
        response.statusText
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Resume versions data:", data);
        setProfileResumes(data);
      } else if (response.status === 401 || response.status === 403) {
        console.error(
          "Authentication failed on resume versions. May need to re-login."
        );
      } else {
        console.error(
          "Failed to load resumes:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to load resumes:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        console.error("Auth error caught in resume load");
      }
    }
  };

  const loadAnalysisHistory = async () => {
    console.log("Loading analysis history...");
    try {
      const response = await apiCall("/api/analysis/history", {}, false);
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data);
      } else if (response.status === 401 || response.status === 403) {
        console.error(
          "Authentication failed on analysis history. May need to re-login."
        );
      } else {
        console.error(
          "Failed to load history:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to load analysis history:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        console.error("Auth error caught in analysis history load");
      }
    }
  };

  const loadDashboardStats = async () => {
    console.log("Loading dashboard stats...");
    setLoadingStats(true);
    try {
      const response = await fetchDashboardStats();
      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard stats data:", data);
        setDashboardStats(data);
      } else {
        console.error("Failed to load dashboard stats:", response.status);
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAnalyticsData = async (timeRange: string = "30days") => {
    console.log("Loading analytics data for range:", timeRange);
    setLoadingAnalytics(true);
    try {
      const response = await fetchFullAnalytics(timeRange);
      if (response.ok) {
        const data = await response.json();
        console.log("Analytics data:", data);
        setAnalyticsData(data);
        // Also update dashboard stats from analytics
        if (data.dashboardStats) {
          setDashboardStats(data.dashboardStats);
        }
      } else {
        console.error("Failed to load analytics data:", response.status);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const uploadResumeToProfile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadFile("/api/resume/upload", formData, false);
      if (response.ok) {
        await loadProfileResumes(); // Refresh the list
        return true;
      } else {
        console.error("Upload failed:", response.status, response.statusText);
        if (response.status === 401 || response.status === 403) {
          alert("Authentication error. Please try logging in again.");
        } else {
          alert("Upload failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        alert("Authentication error. Please try logging in again.");
      } else {
        alert("Upload failed. Please check your connection and try again.");
      }
    }
    return false;
  };

  const runAnalysis = async () => {
    if ((!useExistingResume && !uploadedFile) || !jobDescription.trim()) return;
    if (useExistingResume && !selectedResumeId) return;

    setIsAnalyzing(true);

    try {
      let resumeId = selectedResumeId;

      // If using a new file, upload it first for analysis
      if (!useExistingResume && uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const uploadResponse = await uploadFile("/api/resume/upload", formData);

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          resumeId = uploadData.id;
          // Refresh profile resumes if this was a new upload
          await loadProfileResumes();
        }
      }

      // Upload job description
      const jdResponse = await apiCall(
        "/api/jd/upload-text",
        {
          method: "POST",
          body: JSON.stringify({ text: jobDescription }),
        },
        false
      );

      let jdId;
      if (jdResponse.ok) {
        const jdData = await jdResponse.json();
        jdId = jdData.id;
      }

      // Run enhanced analysis
      const enhancedResponse = await apiCall(
        "/api/analysis/analyze-enhanced",
        {
          method: "POST",
          body: JSON.stringify({ resumeId, jdId }),
        },
        false
      );

      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        console.log("Enhanced analysis response:", enhancedData);

        // Check if response is array or single object
        const analysisData = Array.isArray(enhancedData)
          ? enhancedData[0]
          : enhancedData;
        console.log("Setting analysis results:", analysisData);

        setAnalysisResults(analysisData);
        await loadAnalysisHistory(); // Refresh history

        // Refresh analytics and dashboard stats after new analysis
        loadDashboardStats();
        loadAnalyticsData();

        // Auto-switch to show results (since they're in the same analyze tab)
        console.log("Analysis completed successfully, results set");
      } else {
        console.error(
          "Analysis failed:",
          enhancedResponse.status,
          enhancedResponse.statusText
        );
        if (
          enhancedResponse.status === 401 ||
          enhancedResponse.status === 403
        ) {
          alert("Authentication error. Please try logging in again.");
        } else {
          alert("Analysis failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        alert("Authentication error. Please try logging in again.");
      } else {
        alert("Analysis failed. Please check your connection and try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-teal-600 bg-teal-100";
      case "fair":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const deleteResumeFromProfile = async (resumeId: number): Promise<void> => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resume? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log("Deleting resume with ID:", resumeId);
      const response = await apiCall(
        `/api/resume/${resumeId}`,
        {
          method: "DELETE",
        },
        false
      );

      if (response.ok) {
        // Refresh the resume list
        await loadProfileResumes();
        console.log("Resume deleted successfully");
        alert("Resume deleted successfully!");
      } else {
        const errorText = await response.text();
        console.error("Failed to delete resume:", response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          alert("Authentication error. Please try logging in again.");
        } else {
          alert(`Failed to delete resume: ${errorText || "Please try again."}`);
        }
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert(
        "Error deleting resume. Please check your connection and try again."
      );
    }
  };

  const saveUserProfile = async (profile: UserProfile): Promise<boolean> => {
    try {
      console.log("Saving user profile:", profile);
      const response = await apiCall(
        "/api/user/profile",
        {
          method: "PUT",
          body: JSON.stringify(profile),
        },
        false
      );

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log(
          "Profile saved successfully, updated profile:",
          updatedProfile
        );
        setUserProfile(updatedProfile);
        return true;
      } else {
        console.error("Failed to save profile:", response.status);
        const errorText = await response.text();
        console.error("Save profile error:", errorText);
        return false;
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Analysis Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && <AnalysisLoadingAnimation />}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FiTarget className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-800">ATSight</h1>
                <p className="text-sm text-dark-600">
                  Professional Resume Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-dark-600 hover:text-dark-800 hover:bg-gray-100 rounded-lg transition-colors">
                <FiBell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button className="p-2 text-dark-600 hover:text-dark-800 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSettings className="w-5 h-5" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 text-dark-600 hover:text-dark-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ProfilePicture
                    src={userProfile.profilePicture}
                    size="sm"
                    alt={`${userProfile.firstName} ${userProfile.lastName}`}
                  />
                  <span className="hidden sm:block font-medium">
                    {userProfile.firstName || "Profile"}
                  </span>
                </button>

                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowUserProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-left text-dark-700 hover:bg-gray-50"
                    >
                      <FiUser className="w-4 h-4 mr-3" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-left text-dark-700 hover:bg-gray-50"
                    >
                      <FiFileText className="w-4 h-4 mr-3" />
                      Manage Resumes
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-left text-dark-700 hover:bg-gray-50">
                      <FiSettings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div
          className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-dark-600 hover:text-teal-600 hover:bg-teal-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab - New Main Dashboard */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Dashboard Stats */}
              <DashboardStats stats={dashboardStats} loading={loadingStats} />

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                  <QuickActions
                    onNewAnalysis={() => setActiveTab("analyze")}
                    onViewHistory={() => setActiveTab("history")}
                    onManageResumes={() => setShowProfileModal(true)}
                    onViewTrends={() => setActiveTab("analytics")}
                    hasResumes={profileResumes.length > 0}
                  />
                </div>

                {/* Profile Section */}
                <div className="lg:col-span-2">
                  <ProfileSection
                    user={{
                      email: userProfile.email,
                      role: userProfile.role,
                      firstName: userProfile.firstName,
                      lastName: userProfile.lastName,
                      profilePicture: userProfile.profilePicture,
                      jobTitle: userProfile.jobTitle,
                      location: userProfile.location,
                    }}
                    resumes={profileResumes}
                    onUploadResume={uploadResumeToProfile}
                    onDeleteResume={deleteResumeFromProfile}
                  />
                </div>
              </div>

              {/* Recent Analysis Results */}
              {analysisResults && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-dark-800">
                      Latest Analysis Results
                    </h2>
                  </div>
                  <div className="p-6">
                    <AnalysisResults
                      analysis={analysisResults}
                      onNewAnalysis={() => setActiveTab("analyze")}
                    />
                  </div>
                </div>
              )}

              {/* Analytics Preview */}
              {analysisHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-dark-800">
                        Analytics Overview
                      </h2>
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className="text-teal-600 hover:text-teal-700 font-medium flex items-center"
                      >
                        View Details <FiChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <AnalyticsCharts
                      analyticsData={analyticsData}
                      loading={loadingAnalytics}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Analyze Tab */}
          {activeTab === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Resume Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-dark-800 mb-6">
                  Select Resume
                </h2>

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setUseExistingResume(true)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        useExistingResume
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <FiFolder className="w-5 h-5 mx-auto mb-2" />
                      <div className="text-sm font-medium">
                        Use Saved Resume
                      </div>
                    </button>
                    <button
                      onClick={() => setUseExistingResume(false)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        !useExistingResume
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <FiUpload className="w-5 h-5 mx-auto mb-2" />
                      <div className="text-sm font-medium">Upload New</div>
                    </button>
                  </div>

                  {useExistingResume ? (
                    <div className="space-y-2">
                      {profileResumes.map((resume) => (
                        <div
                          key={resume.id}
                          onClick={() => setSelectedResumeId(resume.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedResumeId === resume.id
                              ? "border-teal-500 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <FiFileText className="w-4 h-4 text-teal-600" />
                            <div>
                              <div className="font-medium text-dark-800">
                                {resume.fileName}
                              </div>
                              <div className="text-sm text-dark-600">
                                {new Date(
                                  resume.uploadDate
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {profileResumes.length === 0 && (
                        <div className="text-center py-8">
                          <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-dark-600">No saved resumes.</p>
                          <button
                            onClick={() => setShowProfileModal(true)}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Upload one now →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                        dragActive
                          ? "border-teal-400 bg-teal-50"
                          : "border-gray-300 hover:border-teal-300"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <FiUpload className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                      <p className="text-dark-600 mb-2">
                        Drop resume here or click to upload
                      </p>
                      <input
                        type="file"
                        id="new-resume"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileInput}
                      />
                      <label
                        htmlFor="new-resume"
                        className="inline-block px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                      {uploadedFile && (
                        <p className="text-sm text-dark-600 mt-2">
                          Selected: {uploadedFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-dark-800 mb-6">
                  Job Description
                </h2>

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />

                <button
                  onClick={runAnalysis}
                  disabled={
                    (!useExistingResume && !uploadedFile) ||
                    !jobDescription.trim() ||
                    (useExistingResume && !selectedResumeId)
                  }
                  className="w-full mt-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FiPlay className="w-5 h-5 mr-2" />
                  Run Analysis
                </button>
              </div>
            </motion.div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {analysisResults ? (
                <motion.div
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-dark-800">
                      Analysis Results
                    </h2>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchLevelColor(
                        analysisResults.matchLevel
                      )}`}
                    >
                      {analysisResults.matchLevel} Match
                    </div>
                  </div>

                  <AnalysisResults
                    analysis={analysisResults}
                    onNewAnalysis={() => {
                      setAnalysisResults(null);
                      setJobDescription("");
                      setUploadedFile(null);
                      setActiveTab("analyze");
                    }}
                  />
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-16 border border-gray-100 text-center">
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <FiBarChart className="w-12 h-12 text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    No Analysis Results
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Run an analysis to see detailed results and insights about
                    your resume compatibility with job descriptions.
                  </p>
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Start Analysis
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* History Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        Analysis History
                      </h2>
                      <p className="text-gray-300 text-lg">
                        Track your resume analysis journey and improvements
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <span className="text-sm font-medium">
                          {analysisHistory.length} Total Analyses
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
              </div>

              {/* History Content */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                {analysisHistory.length > 0 ? (
                  <div className="p-6">
                    <div className="grid gap-4">
                      {analysisHistory.map((analysis, index) => (
                        <motion.div
                          key={analysis.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-xl p-6 hover:border-teal-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-gray-50 to-white"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                  <FiFileText className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg">
                                    {analysis.resumeFileName ||
                                      "Resume Analysis"}
                                  </h3>
                                  <p className="text-gray-600 text-sm">
                                    {analysis.jobTitle ||
                                      "Job Description Analysis"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div
                                className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getMatchLevelColor(
                                  analysis.matchLevel
                                )}`}
                              >
                                {analysis.matchPercentage}% Match
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  analysis.matchLevel === "Excellent"
                                    ? "bg-green-100 text-green-700"
                                    : analysis.matchLevel === "Good"
                                    ? "bg-blue-100 text-blue-700"
                                    : analysis.matchLevel === "Fair"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {analysis.matchLevel}
                              </div>
                            </div>
                          </div>

                          {/* Skills Summary */}
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-700">
                                  Matched Skills
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  {analysis.matchedSkillsCount}
                                </span>
                              </div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-red-700">
                                  Missing Skills
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  {analysis.missingSkillsCount}
                                </span>
                              </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-700">
                                  Total Required
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                  {analysis.totalRequiredSkills}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Skills Preview */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Top Skills:
                              </span>
                              {analysis.matchedSkills
                                ?.slice(0, 5)
                                .map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {analysis.matchedSkills?.length > 5 && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{analysis.matchedSkills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <FiClock className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    analysis.analyzedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FiClock className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    analysis.analyzedAt
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FiClock className="w-4 h-4" />
                                <span>
                                  {analysis.analysisDuration || "N/A"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setAnalysisResults(analysis);
                                setActiveTab("results");
                              }}
                              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center space-x-2 shadow-sm"
                            >
                              <FiEye className="w-4 h-4" />
                              <span>View Full Details</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <FiArchive className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No Analysis History Yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Your analysis history will appear here after you run your
                      first analysis. Start by uploading a resume and job
                      description!
                    </p>
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium shadow-sm"
                    >
                      Start Your First Analysis
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analytics Header with Gradient Background */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        Analytics Dashboard
                      </h2>
                      <p className="text-teal-100 text-lg">
                        Deep insights into your resume performance and market
                        trends
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          loadDashboardStats();
                          loadAnalyticsData();
                        }}
                        className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all flex items-center space-x-2 border border-white/20"
                        disabled={loadingAnalytics || loadingStats}
                      >
                        <span>Refresh</span>
                        {(loadingAnalytics || loadingStats) && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </button>
                      <select
                        className="px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-sm text-white backdrop-blur-sm focus:bg-white/30 focus:outline-none"
                        onChange={(e) => loadAnalyticsData(e.target.value)}
                        defaultValue="30days"
                      >
                        <option value="7days" className="text-gray-800">
                          Last 7 days
                        </option>
                        <option value="30days" className="text-gray-800">
                          Last 30 days
                        </option>
                        <option value="90days" className="text-gray-800">
                          Last 3 months
                        </option>
                        <option value="180days" className="text-gray-800">
                          Last 6 months
                        </option>
                        <option value="365days" className="text-gray-800">
                          Last year
                        </option>
                        <option value="all" className="text-gray-800">
                          All time
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
              </div>

              {/* Charts and Analytics */}
              {analysisHistory.length > 0 ? (
                <>
                  <AnalyticsCharts
                    analyticsData={analyticsData}
                    loading={loadingAnalytics}
                  />

                  {/* Enhanced Analytics Insights Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Success Rate Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                          <FiTrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600">
                            {analyticsData?.dashboardStats?.averageScore
                              ? Math.round(
                                  analyticsData.dashboardStats.averageScore
                                )
                              : Math.round(
                                  analysisHistory.reduce(
                                    (sum, a) => sum + a.matchPercentage,
                                    0
                                  ) / analysisHistory.length
                                )}
                            %
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            {analyticsData?.monthlyTrends &&
                            Object.keys(analyticsData.monthlyTrends).length > 1
                              ? "Trending up"
                              : "+5% growth"}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-700 mb-1">
                        Success Rate
                      </h3>
                      <p className="text-sm text-gray-600">
                        Average match score
                      </p>
                    </motion.div>

                    {/* Top Industry Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                          <FiTarget className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600 truncate">
                            {analyticsData?.industryInsights?.[0]?.industry ||
                              "Technology"}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {analyticsData?.industryInsights?.[0]?.analysisCount
                              ? `${analyticsData.industryInsights[0].analysisCount} analyses`
                              : "Most frequent"}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-700 mb-1">
                        Top Industry
                      </h3>
                      <p className="text-sm text-gray-600">
                        Most analyzed sector
                      </p>
                    </motion.div>

                    {/* Top Skill Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                          <FiBarChart className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-purple-600 truncate">
                            {analyticsData?.topSkills?.[0]?.skill ||
                              "JavaScript"}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            {analyticsData?.topSkills?.[0]?.frequency
                              ? `${analyticsData.topSkills[0].frequency}x mentioned`
                              : "Most requested"}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-700 mb-1">
                        Top Skill
                      </h3>
                      <p className="text-sm text-gray-600">
                        Most frequent skill
                      </p>
                    </motion.div>

                    {/* Total Analyses Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                          <FiFileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-orange-600">
                            {analyticsData?.dashboardStats?.totalAnalyses ||
                              analysisHistory.length}
                          </div>
                          <div className="text-xs text-orange-600 font-medium">
                            Total completed
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-700 mb-1">Analyses</h3>
                      <p className="text-sm text-gray-600">Total completed</p>
                    </motion.div>
                  </div>

                  {/* Industry Insights Section */}
                  {analyticsData?.industryInsights &&
                    analyticsData.industryInsights.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                      >
                        <div className="flex items-center mb-6">
                          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                            <FiTarget className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              Industry Breakdown
                            </h3>
                            <p className="text-gray-600">
                              Performance across different sectors
                            </p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analyticsData.industryInsights
                            .slice(0, 6)
                            .map((industry) => (
                              <div
                                key={industry.industry}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-800">
                                    {industry.industry}
                                  </h4>
                                  <span className="text-sm font-medium text-indigo-600">
                                    {Math.round(industry.averageScore)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>{industry.analysisCount} analyses</span>
                                  <div className="flex -space-x-1">
                                    {industry.commonSkills
                                      ?.slice(0, 3)
                                      .map((skill, skillIndex) => (
                                        <span
                                          key={skillIndex}
                                          className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full border-2 border-white"
                                          title={skill}
                                        >
                                          {skill.length > 8
                                            ? skill.substring(0, 8) + "..."
                                            : skill}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-16 border border-gray-200 text-center"
                >
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <FiBarChart className="w-12 h-12 text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Start Your Analytics Journey
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Run your first analysis to unlock powerful insights and
                    trends about your resume performance across different
                    industries and job roles.
                  </p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <FiTrendingUp className="w-4 h-4" />
                      <span>Track performance trends over time</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <FiTarget className="w-4 h-4" />
                      <span>Discover your most valuable skills</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <FiFileText className="w-4 h-4" />
                      <span>Analyze industry-specific performance</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("analyze")}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Run Your First Analysis
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        resumes={profileResumes}
        onUploadResume={uploadResumeToProfile}
        onDeleteResume={deleteResumeFromProfile}
        onSelectResume={(resumeId: number) => {
          setSelectedResumeId(resumeId);
          setActiveTab("analyze");
          setShowProfileModal(false);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        user={userProfile}
        onSaveProfile={saveUserProfile}
      />
    </div>
  );
}
