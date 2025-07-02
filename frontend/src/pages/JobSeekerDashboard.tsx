import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiFileText,
  FiBarChart,
  FiClock,
  FiDownload,
  FiCheck,
  FiX,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiLogOut,
  FiSettings,
  FiPlay,
  FiRefreshCw,
  FiEye,
  FiAward,
  FiBookOpen,
  FiZap,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";

// Types based on your API responses
interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  active: boolean;
}

interface Resume {
  id: number;
  fileName: string;
  filePath: string;
  parsedText: string;
  uploadDate: string;
}

interface JobDescription {
  id: number;
  text: string;
  uploadDate: string;
}

interface BasicAnalysis {
  id: number;
  matchScore: number;
  matchedSkills: string;
  missingSkills: string;
  suggestions: string;
  createdAt: string;
}

interface EnhancedAnalysis {
  id: number;
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

type ActiveTab = "upload" | "analyze" | "results" | "history" | "reports";

export default function JobSeekerDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [user, setUser] = useState<User | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(
    null
  );
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [basicAnalysis, setBasicAnalysis] = useState<BasicAnalysis | null>(
    null
  );
  const [enhancedAnalysis, setEnhancedAnalysis] =
    useState<EnhancedAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Mock user data - replace with actual auth
  useEffect(() => {
    setUser({
      id: 1,
      email: "john@example.com",
      role: "JOBSEEKER",
      createdAt: "2025-06-27T10:00:00",
      active: true,
    });
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/api/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResume(data);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleJobDescriptionSubmit = async () => {
    if (!jobDescriptionText.trim()) return;

    try {
      const response = await fetch("http://localhost:8080/api/jd/upload-text", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: jobDescriptionText }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobDescription(data);
      }
    } catch (error) {
      console.error("Job description upload error:", error);
    }
  };

  const runBasicAnalysis = async () => {
    if (!resume || !jobDescription) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/analysis/analyze",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeId: resume.id,
            jdId: jobDescription.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBasicAnalysis(data[0]);
        setActiveTab("results");
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runEnhancedAnalysis = async () => {
    if (!resume || !jobDescription) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/analysis/analyze-enhanced",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeId: resume.id,
            jdId: jobDescription.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEnhancedAnalysis(data[0]);
        setActiveTab("results");
      }
    } catch (error) {
      console.error("Enhanced analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/analysis/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("History data:", data);
      }
    } catch (error) {
      console.error("History fetch error:", error);
    }
  };

  const tabs = [
    { id: "upload", label: "Upload", icon: FiUpload },
    { id: "analyze", label: "Analyze", icon: FiZap },
    { id: "results", label: "Results", icon: FiBarChart },
    { id: "history", label: "History", icon: FiClock },
    { id: "reports", label: "Reports", icon: FiDownload },
  ];

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    if (score >= 0.4) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <motion.header
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"></div>
                <span className="text-xl font-display font-bold text-dark-800">
                  ATSSight
                </span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-dark-700">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FiUser className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FiSettings className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            className="lg:col-span-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-teal-500 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50 hover:text-teal-600"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                <h3 className="font-semibold text-dark-800 mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Analyses</span>
                    <span className="font-medium text-dark-800">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg. Score</span>
                    <span className="font-medium text-teal-600">78%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Improvements</span>
                    <span className="font-medium text-green-600">+15%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {/* Upload Tab */}
              {activeTab === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">
                      Upload Your Resume
                    </h2>

                    {/* File Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                        dragOver
                          ? "border-teal-400 bg-teal-50"
                          : "border-gray-300 hover:border-teal-400 hover:bg-teal-50"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files[0]) handleFileUpload(files[0]);
                      }}
                    >
                      <FiUpload className="w-12 h-12 text-teal-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-dark-800 mb-2">
                        Drop your resume here or click to upload
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Supports PDF and DOCX files up to 2MB
                      </p>
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="btn btn-primary cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>

                    {isUploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Uploading...
                          </span>
                          <span className="text-sm text-gray-500">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {resume && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FiCheck className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">
                                {resume.fileName}
                              </p>
                              <p className="text-sm text-green-600">
                                Uploaded on{" "}
                                {new Date(
                                  resume.uploadDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button className="text-green-600 hover:text-green-700">
                            <FiEye className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Job Description Input */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">
                      Job Description
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste the job description you want to match against
                        </label>
                        <textarea
                          rows={8}
                          value={jobDescriptionText}
                          onChange={(e) =>
                            setJobDescriptionText(e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                          placeholder="Paste the complete job description here..."
                        />
                      </div>

                      <button
                        onClick={handleJobDescriptionSubmit}
                        disabled={!jobDescriptionText.trim()}
                        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Job Description
                      </button>
                    </div>

                    {jobDescription && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <FiCheck className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800">
                              Job description saved
                            </p>
                            <p className="text-sm text-blue-600">
                              Ready for analysis • {jobDescription.text.length}{" "}
                              characters
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {resume && jobDescription && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            Ready for Analysis!
                          </h3>
                          <p className="opacity-90">
                            Your resume and job description are ready to be
                            analyzed
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("analyze")}
                          className="btn bg-white text-teal-600 hover:bg-gray-50"
                        >
                          Start Analysis
                          <FiArrowRight className="ml-2 w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
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
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">
                      Analysis Options
                    </h2>

                    {!resume || !jobDescription ? (
                      <div className="text-center py-8">
                        <FiAlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-dark-800 mb-2">
                          Missing Requirements
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Please upload your resume and job description first
                        </p>
                        <button
                          onClick={() => setActiveTab("upload")}
                          className="btn btn-primary"
                        >
                          Go to Upload
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Basic Analysis */}
                        <div className="border border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FiZap className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-800">
                              Basic Analysis
                            </h3>
                          </div>

                          <ul className="space-y-2 mb-6 text-sm text-gray-600">
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Match score calculation</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Skill matching overview</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Basic suggestions</span>
                            </li>
                          </ul>

                          <button
                            onClick={runBasicAnalysis}
                            disabled={isAnalyzing}
                            className="btn btn-secondary w-full disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <FiPlay className="w-4 h-4 mr-2" />
                                Run Basic Analysis
                              </>
                            )}
                          </button>
                        </div>

                        {/* Enhanced Analysis */}
                        <div className="border-2 border-teal-300 rounded-xl p-6 bg-teal-50 relative">
                          <div className="absolute -top-3 left-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Recommended
                          </div>

                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                              <FiStar className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-dark-800">
                              Enhanced Analysis
                            </h3>
                          </div>

                          <ul className="space-y-2 mb-6 text-sm text-gray-600">
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Detailed skill breakdown by category</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Comprehensive improvement suggestions</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Learning recommendations</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <FiCheck className="w-4 h-4 text-green-500" />
                              <span>Resume optimization tips</span>
                            </li>
                          </ul>

                          <button
                            onClick={runEnhancedAnalysis}
                            disabled={isAnalyzing}
                            className="btn btn-primary w-full disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <FiStar className="w-4 h-4 mr-2" />
                                Run Enhanced Analysis
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
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
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {!basicAnalysis && !enhancedAnalysis ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                      <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-dark-800 mb-2">
                        No Analysis Results
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Run an analysis to see your results here
                      </p>
                      <button
                        onClick={() => setActiveTab("analyze")}
                        className="btn btn-primary"
                      >
                        Start Analysis
                      </button>
                    </div>
                  ) : enhancedAnalysis ? (
                    // Enhanced Analysis Results
                    <div className="space-y-6">
                      {/* Match Score Overview */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <div className="text-center mb-8">
                          <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                              <div className="text-3xl font-bold text-white">
                                {enhancedAnalysis.matchPercentage}%
                              </div>
                            </div>
                            <div
                              className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(
                                enhancedAnalysis.overallMatchScore
                              )}`}
                            >
                              {enhancedAnalysis.matchLevel}
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-dark-800 mb-2">
                            Match Score
                          </h2>
                          <p className="text-gray-600">
                            {enhancedAnalysis.matchedSkillsCount} of{" "}
                            {enhancedAnalysis.totalRequiredSkills} required
                            skills matched
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="text-center p-4 bg-green-50 rounded-xl">
                            <FiCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-800 mb-1">
                              {enhancedAnalysis.matchedSkillsCount}
                            </div>
                            <div className="text-sm text-green-600">
                              Matched Skills
                            </div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-xl">
                            <FiX className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-red-800 mb-1">
                              {enhancedAnalysis.missingSkillsCount}
                            </div>
                            <div className="text-sm text-red-600">
                              Missing Skills
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skill Categories */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-dark-800 mb-6">
                          Skill Breakdown
                        </h3>
                        <div className="space-y-4">
                          {enhancedAnalysis.skillCategories.map(
                            (category, index) => (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-dark-800">
                                    {category.categoryName}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      category.matchScore === 1
                                        ? "bg-green-100 text-green-800"
                                        : category.matchScore > 0
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {category.matchedCount}/
                                    {category.requiredCount}
                                  </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                  <div
                                    className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${category.matchScore * 100}%`,
                                    }}
                                  ></div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {category.skills.map((skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                                    >
                                      ✓ {skill}
                                    </span>
                                  ))}
                                  {category.missingSkills.map(
                                    (skill, skillIndex) => (
                                      <span
                                        key={skillIndex}
                                        className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                                      >
                                        ✗ {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Improvement Suggestions */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-dark-800 mb-6 flex items-center">
                          <FiTarget className="w-5 h-5 text-yellow-500 mr-2" />
                          Improvement Suggestions
                        </h3>
                        <div className="space-y-3">
                          {enhancedAnalysis.improvementSuggestions.map(
                            (suggestion, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg"
                              >
                                <FiTarget className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-800">{suggestion}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Resume Tips */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-dark-800 mb-6 flex items-center">
                          <FiFileText className="w-5 h-5 text-blue-500 mr-2" />
                          Resume Optimization Tips
                        </h3>
                        <div className="grid gap-3">
                          {enhancedAnalysis.resumeTips.map((tip, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                            >
                              <FiTrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-blue-800">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Learning Recommendations */}
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-dark-800 mb-6 flex items-center">
                          <FiBookOpen className="w-5 h-5 text-purple-500 mr-2" />
                          Learning Recommendations
                        </h3>
                        <div className="space-y-3">
                          {enhancedAnalysis.learningRecommendations.map(
                            (recommendation, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg"
                              >
                                <FiAward className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                <p className="text-purple-800">
                                  {recommendation}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    basicAnalysis && (
                      // Basic Analysis Results
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <div className="text-center mb-8">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                            <div className="text-3xl font-bold text-white">
                              {Math.round(basicAnalysis.matchScore * 100)}%
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-dark-800 mb-2">
                            Match Score
                          </h2>
                          <p className="text-gray-600">
                            Basic analysis completed
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold text-dark-800 mb-3">
                              Matched Skills
                            </h3>
                            <p className="text-gray-600">
                              {basicAnalysis.matchedSkills ||
                                "No specific skills matched"}
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-dark-800 mb-3">
                              Missing Skills
                            </h3>
                            <p className="text-gray-600">
                              {basicAnalysis.missingSkills ||
                                "No missing skills identified"}
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-dark-800 mb-3">
                              Suggestions
                            </h3>
                            <p className="text-gray-600">
                              {basicAnalysis.suggestions}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
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
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-dark-800">
                        Analysis History
                      </h2>
                      <button
                        onClick={fetchHistory}
                        className="btn btn-secondary"
                      >
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </button>
                    </div>

                    <div className="text-center py-8">
                      <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-dark-800 mb-2">
                        No History Yet
                      </h3>
                      <p className="text-gray-600">
                        Your analysis history will appear here
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reports Tab */}
              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">
                      Generate Reports
                    </h2>

                    <div className="text-center py-8">
                      <FiDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-dark-800 mb-2">
                        No Reports Available
                      </h3>
                      <p className="text-gray-600">
                        Complete an analysis to generate reports
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
