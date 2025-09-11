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
  FiEye,
  FiSearch,
  FiHome,
  FiHeart,
  FiEdit3,
  FiDownload,
  FiUsers,
  FiGrid,
  FiList,
  FiTrash2,
  FiSave,
  FiCamera,
  FiCalendar,
  FiMessageSquare,
  FiCheckCircle,
  FiBriefcase,
  FiTrendingUp,
  FiAward,
  FiStar,
  FiCode,
  FiActivity,
} from "react-icons/fi";
import { apiCall, isAuthenticated, uploadFile } from "../utils/api";
import CustomLoader from "../components/CustomLoader";

// Types for recruiter dashboard
interface LeaderboardEntry {
  id: number;
  candidateName: string;
  rankPosition: number; // 1, 2, 3, etc.
  matchScore: number | null;
  skills: string;
  experience: string;
  projects: string;
  hackathons: string;
  notes: string;
  isFavorite: boolean;
  createdAt: string;
  resume: {
    id: number;
    filename: string;
    parsedText: string;
  };
}

interface CandidateReport {
  candidateName: string;
  rankPosition: number;
  overallScore: number;
  resumeFileName: string;

  // Scores
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectsScore: number;

  // JD Match
  jdMatchPercentage?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  fitAssessment?: string;

  // Skills
  allSkills: string[];
  topSkillCategory: string;

  // Experience
  experienceLevel: string;
  totalYearsExperience?: number;
  experienceHighlights: string[];

  // Projects & Education
  projects: string[];
  projectCount: number;
  education: string[];
  certifications: string[];
  hackathons: string[];

  // Insights
  candidateStrength: string;
  candidateWeakness: string;
  hiringRecommendation: string;

  // Recruiter
  notes: string;
  isFavorite: boolean;
}

interface Leaderboard {
  id: number;
  createdAt: string;
  jobDescription: {
    id: number;
    title: string;
    text: string;
  } | null;
  entries: LeaderboardEntry[];
}

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

const RecruiterDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] =
    useState<Leaderboard | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<LeaderboardEntry | null>(null);
  const [candidateReport, setCandidateReport] =
    useState<CandidateReport | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [candidateReportLoading, setCandidateReportLoading] = useState(false);

  // Profile-related state variables
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: "",
    firstName: "John", // Initialize with default values
    lastName: "Doe",
    company: "Tech Corp",
    jobTitle: "Senior Recruiter",
    phone: "+1-555-123-4567",
    linkedin: "https://linkedin.com/in/johndoe",
    bio: "Experienced technical recruiter with 5+ years in talent acquisition, specializing in software engineering roles.",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        // Try to authenticate first
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, attempting authentication...");

          // Check if we have saved email preference
          let userEmail = localStorage.getItem("preferredEmail");

          // If no preferred email, prompt user
          if (!userEmail) {
            userEmail = prompt(
              "Please enter your email address:",
              "recruiter@company.com"
            );
            if (!userEmail) {
              userEmail = "test.recruiter@example.com"; // fallback
            } else {
              // Save preference for future use
              localStorage.setItem("preferredEmail", userEmail);
            }
          }

          try {
            const loginResponse = await fetch(
              "http://localhost:8080/api/auth/test-login",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: userEmail,
                  password: "password",
                }),
              }
            );

            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              console.log("Authentication successful for:", userEmail);
              localStorage.setItem("token", loginData.token);
              localStorage.setItem("userRole", loginData.user.role);
              localStorage.setItem("userEmail", loginData.user.email);

              setUser({
                id: loginData.user.id,
                email: loginData.user.email,
                role: loginData.user.role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                active: true,
              });

              // Update profile data with user email
              setProfileData((prev) => ({
                ...prev,
                email: loginData.user.email,
              }));
            } else {
              console.error("Authentication failed for:", userEmail);
              // Clear the saved preference if login fails
              localStorage.removeItem("preferredEmail");
              throw new Error(
                "Authentication failed - please check your email"
              );
            }
          } catch (loginError) {
            console.error("Failed to authenticate:", loginError);
            throw new Error("Authentication required");
          }
        } else {
          // Use existing token
          const email =
            localStorage.getItem("userEmail") || "test.recruiter@example.com";
          setUser({
            id: 1,
            email: email,
            role: "RECRUITER",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            active: true,
          });

          // Update profile data with user email
          setProfileData((prev) => ({
            ...prev,
            email: email,
          }));
        }

        // Ensure test data exists
        try {
          console.log("Ensuring test data exists...");
          const testResponse = await fetch(
            "http://localhost:8080/api/test-data/create-test-leaderboard"
          );
          if (testResponse.ok) {
            const testResult = await testResponse.text();
            console.log("Test data ensured:", testResult);
          }
        } catch (testError) {
          console.warn("Failed to create test data:", testError);
        }

        // Now try to load leaderboards with authentication
        try {
          console.log("Loading leaderboards...");
          const leaderboardsResponse = await apiCall(
            "/api/recruiter/leaderboards",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (leaderboardsResponse.ok) {
            const leaderboardsData = await leaderboardsResponse.json();
            console.log(
              "Leaderboards loaded successfully:",
              leaderboardsData.length,
              "leaderboards"
            );
            setLeaderboards(leaderboardsData);

            // Auto-select the most recent leaderboard if available
            if (leaderboardsData.length > 0) {
              setSelectedLeaderboard(leaderboardsData[0]);
              console.log(
                "Auto-selected most recent leaderboard:",
                leaderboardsData[0].id
              );
            }
          } else {
            console.log(
              "Failed to load leaderboards, status:",
              leaderboardsResponse.status
            );
            const errorText = await leaderboardsResponse.text();
            console.log("Error response:", errorText);
            setLeaderboards([]);
          }
        } catch (leaderboardError) {
          console.error("Error loading leaderboards:", leaderboardError);
          setLeaderboards([]);
        }

        // Load profile data
        await loadProfileData();
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        setLeaderboards([]);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token available for profile loading");
        return;
      }

      const response = await fetch("http://localhost:8080/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        console.log("Profile data loaded:", profileData);

        // Update the profile state with loaded data
        setProfileData({
          email: profileData.email || user?.email || "",
          firstName: profileData.firstName || "John",
          lastName: profileData.lastName || "Doe",
          company: profileData.company || "Tech Corp",
          jobTitle: profileData.jobTitle || "Senior Recruiter",
          phone: profileData.phone || "+1-555-123-4567",
          linkedin: profileData.linkedin || "https://linkedin.com/in/johndoe",
          bio:
            profileData.bio ||
            "Experienced technical recruiter with 5+ years in talent acquisition, specializing in software engineering roles.",
        });

        // If there's a profile picture, set it
        if (profileData.profilePicture) {
          setPreviewUrl(profileData.profilePicture);
        }
      } else {
        console.log("Failed to load profile data, using defaults");
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const handleBulkUpload = async (
    files: FileList,
    jdFile?: File,
    jdText?: string,
    jdTitle?: string
  ) => {
    setUploadingFiles(true);
    try {
      console.log(
        "Starting bulk upload with files:",
        Array.from(files).map((f) => f.name)
      );

      // Check authentication first
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // Validate that JD is provided (either file or text)
      const hasJdFile = jdFile && jdFile.size > 0;
      const hasJdText = jdText && jdText.trim().length > 0;

      if (!hasJdFile && !hasJdText) {
        throw new Error(
          "Job description is required. Please provide either a JD file or JD text."
        );
      }

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("resumes", files[i]);
        console.log(
          `Added file ${i + 1}: ${files[i].name} (${files[i].size} bytes)`
        );
      }

      if (hasJdFile) {
        formData.append("jd", jdFile);
        console.log(`Added JD file: ${jdFile.name} (${jdFile.size} bytes)`);
      }

      if (hasJdText) {
        formData.append("jdText", jdText);
        console.log(`Added JD text: ${jdText.substring(0, 100)}...`);
      }

      if (jdTitle && jdTitle.trim().length > 0) {
        formData.append("jdTitle", jdTitle);
        console.log(`Added JD title: ${jdTitle}`);
      }

      console.log("Calling uploadFile to /api/recruiter/bulk-upload...");

      // Add timeout to prevent hanging (increased to 5 minutes for multiple resume processing)
      const timeoutId = setTimeout(() => {
        throw new Error("Upload request timed out after 5 minutes");
      }, 300000);

      const response = await uploadFile("/api/recruiter/bulk-upload", formData);
      clearTimeout(timeoutId);

      console.log("Upload response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Upload failed with status:",
          response.status,
          "Error:",
          errorText
        );
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      console.log("Parsing response JSON...");
      const leaderboardData = await response.json();
      console.log("Leaderboard data received:", leaderboardData);

      setLeaderboards([leaderboardData, ...leaderboards]);
      setSelectedLeaderboard(leaderboardData);
      setActiveTab("leaderboard");

      console.log("Upload completed successfully!");
    } catch (error) {
      console.error("Error uploading files:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingFiles(false);
      console.log("Upload process finished, uploadingFiles set to false");
    }
  };

  const updateNotes = async (entryId: number, notes: string) => {
    console.log("🔄 Starting updateNotes function...");

    try {
      console.log("=== FRONTEND UPDATE NOTES DEBUG ===");
      console.log("Entry ID:", entryId);
      console.log("Notes to save:", notes);
      console.log("Notes length:", notes.length);

      // Get token manually to avoid content-type conflicts
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      const headers: Record<string, string> = {
        "Content-Type": "text/plain",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("Authorization header added");
      }

      console.log("Request headers:", headers);

      const url = `http://localhost:8080/api/recruiter/leaderboard/entry/${entryId}/notes`;
      console.log("Making request to:", url);

      // Make direct fetch call to avoid apiCall header conflicts
      let response;
      try {
        console.log("🚀 Sending fetch request...");
        response = await fetch(url, {
          method: "PATCH",
          headers: headers,
          body: notes,
        });
        console.log("✅ Fetch request completed");
      } catch (networkError) {
        console.error("❌ Network error during fetch:", networkError);
        // DON'T show alert for network errors if notes actually save
        return;
      }

      console.log("Response status:", response.status);
      console.log("Response OK:", response.ok);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Check if response is successful
      if (!response.ok) {
        let errorText = "Unknown error";
        try {
          errorText = await response.text();
        } catch (readError) {
          console.error("Could not read error response:", readError);
        }
        console.error("❌ Server error response:", errorText);
        alert(`Server error: ${response.status} - ${errorText}`);
        return;
      }

      // Try to parse the response
      try {
        const responseText = await response.text();
        console.log("Raw response text:", responseText);

        if (responseText) {
          const responseData = JSON.parse(responseText);
          console.log("✅ Parsed response:", responseData);

          // Check if the response indicates success
          if (responseData.success) {
            console.log("✅ Backend confirmed notes were saved successfully");
          }
        } else {
          console.log("⚠️ Empty response body (but status was OK)");
        }
      } catch (parseError) {
        console.error(
          "⚠️ Error parsing response (but treating as success):",
          parseError
        );
      }

      console.log("✅ Notes API call successful!");

      // Update frontend state
      if (selectedLeaderboard) {
        const updatedEntries = selectedLeaderboard.entries.map((entry) =>
          entry.id === entryId ? { ...entry, notes } : entry
        );
        setSelectedLeaderboard({
          ...selectedLeaderboard,
          entries: updatedEntries,
        });
        console.log("✅ Updated leaderboard state");
      }

      if (selectedCandidate && selectedCandidate.id === entryId) {
        setSelectedCandidate({
          ...selectedCandidate,
          notes,
        });
        console.log("✅ Updated selected candidate state");
      }

      if (
        candidateReport &&
        selectedCandidate &&
        selectedCandidate.id === entryId
      ) {
        setCandidateReport({
          ...candidateReport,
          notes,
        });
        console.log("✅ Updated candidate report state");
      }

      console.log("🎉 Notes update completed successfully!");
    } catch (error) {
      console.error("❌ Unexpected error in updateNotes function:", error);
      console.error("Error details:", {
        type: typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Only show alert for unexpected errors
      alert(
        "An unexpected error occurred while updating notes. Please try again."
      );
    }
  };

  const generateInterviewQuestions = (
    candidateReport: CandidateReport,
    selectedCandidate: LeaderboardEntry
  ) => {
    const questions = [];
    const validationAreas = [];

    // Extract candidate's top skills
    const candidateSkills = candidateReport.allSkills || [];
    const topSkills = candidateSkills.slice(0, 3);
    const matchedSkills = candidateReport.matchedSkills || [];

    // Extract missing/required skills
    const missingSkills = candidateReport.missingSkills || [];

    // Generate skill-specific questions based on matched skills
    if (matchedSkills.length > 0) {
      questions.push(
        `• Describe a complex project where you used ${matchedSkills
          .slice(0, 2)
          .join(" and ")}`
      );
      questions.push(
        `• How do you stay current with ${matchedSkills[0]} best practices and new developments?`
      );
    } else if (topSkills.length > 0) {
      questions.push(
        `• Describe your experience with ${topSkills.slice(0, 2).join(" and ")}`
      );
    }

    // Generate questions based on missing skills
    if (missingSkills.length > 0) {
      questions.push(
        `• Experience with ${missingSkills
          .slice(0, 2)
          .join(" or ")}: any exposure or learning plans?`
      );
      validationAreas.push(
        `Willingness to learn ${missingSkills[0]} and adaptability to new technologies`
      );
    }

    // Generate questions based on experience level
    const experienceScore = candidateReport.experienceScore || 0;
    const experienceLevel = candidateReport.experienceLevel || "";

    if (
      experienceLevel.toLowerCase().includes("senior") ||
      experienceScore > 0.8
    ) {
      questions.push(
        "• Describe your leadership style and team mentoring experience"
      );
      questions.push(
        "• How do you approach architectural decisions and technical debt?"
      );
      validationAreas.push(
        "Strategic thinking and senior-level decision making"
      );
    } else if (
      experienceLevel.toLowerCase().includes("mid") ||
      experienceScore > 0.5
    ) {
      questions.push(
        "• Walk through your most challenging technical problem and solution"
      );
      questions.push(
        "• How do you handle code reviews and collaborate with seniors?"
      );
      validationAreas.push("Growth potential and problem-solving depth");
    } else {
      questions.push("• Describe your learning approach for new technologies");
      questions.push("• How do you handle feedback and mentorship?");
      validationAreas.push("Learning agility and foundational knowledge");
    }

    // Generate questions based on projects
    if (candidateReport.projects && candidateReport.projects.length > 0) {
      const projectTypes = candidateReport.projects.slice(0, 2);
      questions.push(
        `• Tell me about your role in: ${projectTypes.join(" or ")}`
      );
    }

    // Generate questions based on hackathons/competitions
    if (candidateReport.hackathons && candidateReport.hackathons.length > 0) {
      questions.push(
        "• Describe your experience in hackathons and competitive programming"
      );
      validationAreas.push("Innovation mindset and rapid prototyping skills");
    }

    // Generate questions based on overall match score
    const matchScore = selectedCandidate.matchScore || 0;
    if (matchScore > 0.8) {
      questions.push(
        "• Where do you see this role fitting into your career goals?"
      );
      validationAreas.push("Cultural fit and long-term commitment");
    } else if (matchScore < 0.6) {
      questions.push(
        "• What excites you most about this role and our tech stack?"
      );
      validationAreas.push(
        "Genuine interest and motivation to bridge skill gaps"
      );
    }

    // Add behavioral questions based on weaknesses
    if (candidateReport.candidateWeakness) {
      questions.push(
        "• Describe a time you overcame a significant technical challenge"
      );
      validationAreas.push(candidateReport.candidateWeakness);
    }

    // Always include some core behavioral questions
    if (questions.length < 4) {
      questions.push(
        "• Describe a time you had to learn something completely new under pressure"
      );
    }

    return {
      questions: questions.slice(0, 5), // Limit to 5 key questions
      validationAreas: validationAreas.slice(0, 2), // Limit to 2 key areas
    };
  };

  const toggleFavorite = async (entryId: number) => {
    try {
      await apiCall(`/api/recruiter/leaderboard/entry/${entryId}/favorite`, {
        method: "PATCH",
      });

      // Update leaderboard entries
      if (selectedLeaderboard) {
        const updatedEntries = selectedLeaderboard.entries.map((entry) =>
          entry.id === entryId
            ? { ...entry, isFavorite: !entry.isFavorite }
            : entry
        );
        setSelectedLeaderboard({
          ...selectedLeaderboard,
          entries: updatedEntries,
        });
      }

      // Update selected candidate if it's the same one
      if (selectedCandidate && selectedCandidate.id === entryId) {
        setSelectedCandidate({
          ...selectedCandidate,
          isFavorite: !selectedCandidate.isFavorite,
        });
      }

      // Update candidate report if it exists
      if (
        candidateReport &&
        selectedCandidate &&
        selectedCandidate.id === entryId
      ) {
        setCandidateReport({
          ...candidateReport,
          isFavorite: !candidateReport.isFavorite,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Show user-friendly error message
      alert("Failed to update favorite status. Please try again.");
    }
  };

  const downloadCandidateReport = async (
    entryId: number,
    candidateName: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/recruiter/leaderboard/entry/${entryId}/report/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidateName}_report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  const downloadCandidateResume = async (
    entryId: number,
    candidateName: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/recruiter/leaderboard/entry/${entryId}/download-resume`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download resume");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from response headers if available
      const disposition = response.headers.get("content-disposition");
      let filename = `${candidateName}_resume.pdf`;
      if (disposition && disposition.includes("filename=")) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading resume:", error);
    }
  };

  const handleCandidateClick = async (candidate: LeaderboardEntry) => {
    try {
      setSelectedCandidate(candidate);
      setActiveTab("candidateDetail");
      setCandidateReport(null); // Reset report while loading
      setCandidateReportLoading(true); // Show loading state

      console.log(
        `Loading report for candidate: ${candidate.candidateName} (ID: ${candidate.id})`
      );

      // Use shorter timeout for better user experience (15 seconds instead of 30)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Use optimized API endpoint with proper error handling
        const response = await fetch(
          `http://localhost:8080/api/recruiter/leaderboard/entry/${candidate.id}/report`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const report = await response.json();
          setCandidateReport(report);
          console.log("Candidate report loaded successfully");
        } else if (response.status === 401) {
          console.error("Authentication failed - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        } else {
          console.error(
            "Failed to fetch candidate report:",
            response.status,
            response.statusText
          );
          // Show user-friendly error message without blocking the UI
          console.warn(
            `Failed to load detailed report (${response.status}). Showing basic candidate information instead.`
          );
          setCandidateReport(null);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          console.error("Request timed out after 15 seconds");
          console.warn(
            "The candidate report is taking too long to load. Showing basic information instead."
          );
        } else {
          console.error("Network error fetching candidate report:", fetchError);
          console.warn(
            "Network error loading candidate report. Showing basic information instead."
          );
        }

        // Don't reset selectedCandidate, show basic info instead
        setCandidateReport(null);
      }
    } catch (error) {
      console.error("Error in handleCandidateClick:", error);
      // Show basic candidate info even if report fails
      setSelectedCandidate(candidate);
      setCandidateReport(null);
      console.warn(
        "Unable to load candidate details. Showing basic information."
      );
    } finally {
      setCandidateReportLoading(false); // Hide loading state
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const response = await fetch(
        "http://localhost:8080/api/recruiter/health"
      );
      console.log(
        "Health check response:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const text = await response.text();
        alert(`Backend is reachable: ${text}`);
      } else {
        alert(
          `Backend responded with error: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Backend connection test failed:", error);
      alert(
        `Backend connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const downloadLeaderboardCSV = async (
    leaderboardId: number,
    topN: number = 10
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/recruiter/leaderboard/${leaderboardId}/export-csv?topN=${topN}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leaderboard_${leaderboardId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  const deleteLeaderboard = async (leaderboardId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this leaderboard? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log("Attempting to delete leaderboard ID:", leaderboardId);

      const response = await fetch(
        `http://localhost:8080/api/recruiter/leaderboard/${leaderboardId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Delete response status:", response.status);
      console.log("Delete response headers:", response.headers);

      if (response.ok) {
        const responseText = await response.text();
        console.log("Delete successful:", responseText);

        // Remove from local state
        setLeaderboards(leaderboards.filter((lb) => lb.id !== leaderboardId));

        // If the deleted leaderboard was selected, clear selection
        if (selectedLeaderboard?.id === leaderboardId) {
          setSelectedLeaderboard(null);
          setActiveTab("leaderboards");
        }

        alert("Leaderboard deleted successfully");
      } else {
        const errorText = await response.text();
        console.error("Delete error response:", errorText);
        console.error("Response status:", response.status);
        console.error("Response statusText:", response.statusText);

        // Try to parse error details
        let errorMessage = `Failed to delete leaderboard: ${response.status}`;
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage += ` - ${errorData.message || errorText}`;
          } catch {
            errorMessage += ` - ${errorText}`;
          }
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error deleting leaderboard:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        alert(
          "Network error: Could not connect to server. Please check if the backend is running."
        );
      } else {
        alert(`Failed to delete leaderboard: ${error.message || error}`);
      }
    }
  };

  const filteredEntries =
    selectedLeaderboard?.entries
      .filter((entry) => {
        const matchesSearch =
          entry.candidateName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          entry.skills.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFavorites = !filterFavorites || entry.isFavorite;
        return matchesSearch && matchesFavorites;
      })
      .sort((a, b) => {
        if (a.matchScore === null && b.matchScore === null) return 0;
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        return b.matchScore - a.matchScore;
      }) || [];

  if (loading) {
    return <CustomLoader />;
  }

  // Main render method for tab content
  const renderMainContent = () => {
    switch (activeTab) {
      case "home":
        return renderHome();
      case "upload":
        return (
          <div className="p-8">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Bulk Resume Upload</h1>
                <p className="text-teal-100 mb-4">
                  Upload multiple resumes and compare them against job
                  requirements
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <BulkUploadComponent
                onUpload={handleBulkUpload}
                uploading={uploadingFiles}
              />
            </div>
          </div>
        );
      case "leaderboards":
        return renderLeaderboards();
      case "leaderboard":
        return renderLeaderboard();
      case "candidateDetail":
        return renderCandidateDetail();
      case "reports":
        const renderReports = () => {
          // Ensure leaderboards is an array
          const safeLeaderboards = leaderboards || [];

          // Show empty state if no data
          if (safeLeaderboards.length === 0) {
            return (
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <FiBarChart className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Data Available
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Upload some resumes and create leaderboards to see analytics
                    here.
                  </p>
                  <button
                    onClick={() => setActiveTab("home")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            );
          }

          // Calculate analytics from available data
          const totalCandidates = safeLeaderboards.reduce(
            (sum, lb) => sum + (lb.entries?.length || 0),
            0
          );
          const totalPositions = safeLeaderboards.length;

          // Calculate average scores across all candidates
          const allCandidates = safeLeaderboards.flatMap(
            (lb) => lb.entries || []
          );
          const avgMatchScore =
            allCandidates.length > 0
              ? (allCandidates.reduce(
                  (sum, c) => sum + (c.matchScore || 0),
                  0
                ) /
                  allCandidates.length) *
                100
              : 0;

          // Find top performers based on matchScore
          const topCandidates = allCandidates
            .filter((c) => c.matchScore !== null)
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
            .slice(0, 5);

          // Skills analysis from skills field
          const skillFrequency: { [key: string]: number } = {};
          allCandidates.forEach((candidate) => {
            if (candidate.skills) {
              // Split skills by common delimiters
              const skillsArray = candidate.skills
                .split(/[,;|]/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              skillsArray.forEach((skill) => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                  skillFrequency[trimmedSkill] =
                    (skillFrequency[trimmedSkill] || 0) + 1;
                }
              });
            }
          });

          const topSkills = Object.entries(skillFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8);

          // Experience analysis from experience field
          const experienceData: { [key: string]: number } = {};
          allCandidates.forEach((candidate) => {
            if (candidate.experience) {
              // Try to extract experience level info
              const expText = candidate.experience.toLowerCase();
              let level = "Unknown";

              if (
                expText.includes("senior") ||
                expText.includes("lead") ||
                expText.includes("principal")
              ) {
                level = "Senior Level";
              } else if (
                expText.includes("mid") ||
                expText.includes("intermediate") ||
                /\d+.*year/.test(expText)
              ) {
                level = "Mid Level";
              } else if (
                expText.includes("junior") ||
                expText.includes("entry") ||
                expText.includes("intern")
              ) {
                level = "Junior Level";
              } else if (expText.trim()) {
                level = "Professional";
              }

              experienceData[level] = (experienceData[level] || 0) + 1;
            } else {
              experienceData["Unknown"] = (experienceData["Unknown"] || 0) + 1;
            }
          });

          return (
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Recruitment Analytics
                  </h1>
                  <p className="text-gray-600">
                    Insights from your candidate pipeline
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Updated: {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Total Candidates
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {totalCandidates}
                      </p>
                    </div>
                    <FiUsers className="text-2xl text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        Open Positions
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {totalPositions}
                      </p>
                    </div>
                    <FiBriefcase className="text-2xl text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">
                        Avg Match Score
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {avgMatchScore.toFixed(1)}%
                      </p>
                    </div>
                    <FiTrendingUp className="text-2xl text-purple-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">
                        Top Performers
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {topCandidates.length}
                      </p>
                    </div>
                    <FiAward className="text-2xl text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Charts and Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiStar className="mr-2 text-yellow-500" />
                    Top Performers
                  </h2>
                  <div className="space-y-3">
                    {topCandidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {candidate.candidateName}
                            </p>
                            <p className="text-sm text-gray-600">
                              #{candidate.rankPosition}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {((candidate.matchScore || 0) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">Match Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Distribution */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiCode className="mr-2 text-blue-500" />
                    Most In-Demand Skills
                  </h2>
                  <div className="space-y-3">
                    {topSkills.length > 0 ? (
                      topSkills.map(([skill, count]) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {skill}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (count /
                                      Math.max(
                                        ...topSkills.map(([, c]) => c),
                                        1
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-6">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          No skills data available yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience Level Distribution */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiBarChart className="mr-2 text-green-500" />
                    Experience Distribution
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(experienceData).map(([level, count]) => {
                      const countNum = count as number;
                      return (
                        <div
                          key={level}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {level}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    totalCandidates > 0
                                      ? (countNum / totalCandidates) * 100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                              {countNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiActivity className="mr-2 text-purple-500" />
                    Pipeline Insights
                  </h2>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-blue-800">
                        Quality Pipeline
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {
                          allCandidates.filter((c) => (c.matchScore || 0) > 0.7)
                            .length
                        }{" "}
                        high-scoring candidates (70%+ match)
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-sm font-medium text-yellow-800">
                        Skills Analysis
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {topSkills.length > 0
                          ? `${topSkills[0][0]} is the most common skill`
                          : "No skills data available"}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm font-medium text-green-800">
                        Hiring Recommendation
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {topCandidates.length > 0
                          ? `${topCandidates[0]?.candidateName} shows highest potential`
                          : "No candidates evaluated yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        };

        return renderReports();
      case "profile":
        return renderProfile();
      default:
        return renderHome();
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <FiUsers className="text-white text-sm" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Recruiter Hub</h1>
            <p className="text-sm text-gray-500">Find top talent</p>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { id: "home", label: "Dashboard", icon: FiHome },
            { id: "upload", label: "Bulk Upload", icon: FiUpload },
            { id: "leaderboards", label: "Leaderboards", icon: FiBarChart },
            {
              id: "leaderboard",
              label: "Active Board",
              icon: FiTarget,
              disabled: !selectedLeaderboard,
            },
            { id: "reports", label: "Reports", icon: FiFileText },
            { id: "profile", label: "Profile", icon: FiUser },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border border-teal-200"
                  : item.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="text-lg" />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-2 h-2 bg-teal-500 rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
              <FiUser className="text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Recruiter</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full mt-4 flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <FiLogOut className="text-lg" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Recruiter!</h1>
          <p className="text-teal-100 mb-6">
            Discover and rank the best candidates for your open positions
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("upload")}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all font-medium"
            >
              Upload Resumes
            </button>
            <button
              onClick={() => setActiveTab("leaderboards")}
              className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-all font-medium"
            >
              View Leaderboards
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">
                Total Leaderboards
              </p>
              <p className="text-3xl font-bold text-green-900">
                {leaderboards.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBarChart className="text-green-600 text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">
                Total Candidates
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {leaderboards.reduce(
                  (acc, lb) => acc + (lb.entries?.length || 0),
                  0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Favorites</p>
              <p className="text-3xl font-bold text-purple-900">
                {leaderboards.reduce(
                  (acc, lb) =>
                    acc + (lb.entries?.filter((e) => e.isFavorite).length || 0),
                  0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiHeart className="text-purple-600 text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Leaderboards */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Leaderboards
          </h2>
          <button
            onClick={() => setActiveTab("leaderboards")}
            className="text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <FiChevronRight />
          </button>
        </div>

        {leaderboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBarChart className="text-gray-400 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leaderboards yet
            </h3>
            <p className="text-gray-500 mb-6">
              Upload your first batch of resumes to get started
            </p>
            <button
              onClick={() => setActiveTab("upload")}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium"
            >
              Upload Resumes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboards.slice(0, 3).map((leaderboard) => (
              <motion.div
                key={leaderboard.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedLeaderboard(leaderboard);
                  setActiveTab("leaderboard");
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {leaderboard.jobDescription?.title ||
                        `Leaderboard #${leaderboard.id}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {leaderboard.entries?.length || 0} candidates •{" "}
                      {new Date(leaderboard.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="p-8">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Bulk Resume Upload</h1>
          <p className="text-teal-100">
            Upload multiple resumes and optionally provide a job description for
            scoring
          </p>
        </div>
      </div>

      {/* Debug Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Debug Tools
        </h3>
        <button
          onClick={testBackendConnection}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
        >
          Test Backend Connection
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <BulkUploadComponent
          onUpload={handleBulkUpload}
          uploading={uploadingFiles}
        />
      </div>
    </div>
  );

  const renderLeaderboards = () => (
    <div className="p-8">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">All Leaderboards</h1>
          <p className="text-teal-100">
            Manage and view all your candidate rankings
          </p>
        </div>
      </div>

      {leaderboards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBarChart className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No leaderboards found
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first leaderboard by uploading resumes
          </p>
          <button
            onClick={() => setActiveTab("upload")}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium"
          >
            Upload Resumes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboards.map((leaderboard) => (
            <motion.div
              key={leaderboard.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-teal-300"
              onClick={() => {
                setSelectedLeaderboard(leaderboard);
                setActiveTab("leaderboard");
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <FiBarChart className="text-white text-xl" />
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                  {leaderboard.entries?.length || 0} candidates
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">
                {leaderboard.jobDescription?.title ||
                  `Leaderboard #${leaderboard.id}`}
              </h3>

              <p className="text-gray-600 text-sm mb-4">
                Created on{" "}
                {new Date(leaderboard.createdAt).toLocaleDateString()}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <FiHeart className="text-red-500 text-sm" />
                    <span className="text-sm text-gray-600">
                      {leaderboard.entries?.filter((e) => e.isFavorite)
                        .length || 0}
                    </span>
                  </div>
                  {leaderboard.jobDescription && (
                    <div className="flex items-center space-x-1">
                      <FiTarget className="text-teal-500 text-sm" />
                      <span className="text-sm text-gray-600">JD Match</span>
                    </div>
                  )}
                </div>
                <FiChevronRight className="text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => {
    if (!selectedLeaderboard) {
      return (
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTarget className="text-gray-400 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leaderboard selected
            </h3>
            <p className="text-gray-500 mb-6">
              Select a leaderboard from the list to view candidates
            </p>
            <button
              onClick={() => setActiveTab("leaderboards")}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all font-medium"
            >
              View Leaderboards
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {selectedLeaderboard.jobDescription?.title ||
                    `Leaderboard #${selectedLeaderboard.id}`}
                </h1>
                <p className="text-teal-100">
                  {filteredEntries.length} candidates • Created{" "}
                  {new Date(selectedLeaderboard.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadLeaderboardCSV(selectedLeaderboard.id)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all font-medium flex items-center space-x-2"
                >
                  <FiDownload className="text-sm" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => deleteLeaderboard(selectedLeaderboard.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center space-x-2"
                >
                  <FiTrash2 className="text-sm" />
                  <span>Delete Leaderboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  filterFavorites
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FiHeart className={filterFavorites ? "fill-current" : ""} />
                <span>Favorites</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Candidates */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers className="text-gray-400 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No candidates found
            </h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div>
            {/* Modern Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      🏆 Candidate Rankings
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Ranked by overall match score
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {filteredEntries.length} candidates
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Match Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Top Skills
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-all cursor-pointer group"
                        onClick={() => handleCandidateClick(entry)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.rankPosition && entry.rankPosition <= 3 ? (
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                    entry.rankPosition === 1
                                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                      : entry.rankPosition === 2
                                      ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                      : "bg-gradient-to-br from-orange-400 to-orange-600"
                                  }`}
                                >
                                  {entry.rankPosition}
                                </div>
                                {entry.rankPosition === 1 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs">👑</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-600 font-semibold text-lg">
                                  {entry.rankPosition || "—"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                entry.rankPosition && entry.rankPosition <= 3
                                  ? "bg-gradient-to-br from-teal-500 to-cyan-600"
                                  : "bg-gradient-to-br from-gray-400 to-gray-600"
                              }`}
                            >
                              {entry.candidateName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                                  {entry.candidateName}
                                </h3>
                                {entry.isFavorite && (
                                  <FiHeart className="text-red-500 fill-current w-4 h-4" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                Applied{" "}
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.matchScore !== null ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all ${
                                      entry.matchScore >= 0.8
                                        ? "bg-gradient-to-r from-green-400 to-green-600"
                                        : entry.matchScore >= 0.6
                                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                        : "bg-gradient-to-r from-red-400 to-red-600"
                                    }`}
                                    style={{
                                      width: `${entry.matchScore * 100}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-lg font-bold text-gray-900 min-w-[50px]">
                                  {Math.round(entry.matchScore * 100)}%
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    entry.matchScore >= 0.8
                                      ? "bg-green-100 text-green-800"
                                      : entry.matchScore >= 0.6
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {entry.matchScore >= 0.8
                                    ? "Excellent"
                                    : entry.matchScore >= 0.6
                                    ? "Good"
                                    : "Needs Work"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">
                              No JD Match
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {entry.experience || "Not specified"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {entry.skills
                                .split(", ")
                                .slice(0, 3)
                                .map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium"
                                  >
                                    {skill.trim()}
                                  </span>
                                ))}
                              {entry.skills.split(", ").length > 3 && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                  +{entry.skills.split(", ").length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(entry.id);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                entry.isFavorite
                                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                            >
                              <FiHeart
                                className={
                                  entry.isFavorite ? "fill-current" : ""
                                }
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCandidateReport(
                                  entry.id,
                                  entry.candidateName
                                );
                              }}
                              className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                              title="Download Report"
                            >
                              <FiDownload />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCandidateResume(
                                  entry.id,
                                  entry.candidateName
                                );
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Download Resume"
                            >
                              <FiFileText />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>
                      <strong className="text-gray-900">
                        {filteredEntries.length}
                      </strong>{" "}
                      candidates total
                    </span>
                    <span>
                      <strong className="text-red-600">
                        {filteredEntries.filter((e) => e.isFavorite).length}
                      </strong>{" "}
                      favorites
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">Rankings updated</span>
                    <span className="text-xs font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Cards for Mobile/Detailed View */}
            {filteredEntries.length > 0 && (
              <div className="lg:hidden">
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <CandidateCard
                      key={entry.id}
                      entry={entry}
                      onToggleFavorite={toggleFavorite}
                      onUpdateNotes={updateNotes}
                      onDownloadReport={downloadCandidateReport}
                      onDownloadResume={downloadCandidateResume}
                      onCandidateClick={handleCandidateClick}
                      editingNotes={editingNotes}
                      setEditingNotes={setEditingNotes}
                      tempNotes={tempNotes}
                      setTempNotes={setTempNotes}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCandidateClick(entry)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.rankPosition && entry.rankPosition <= 3 ? (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                entry.rankPosition === 1
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                  : entry.rankPosition === 2
                                  ? "bg-gradient-to-r from-gray-300 to-gray-500"
                                  : "bg-gradient-to-r from-orange-400 to-orange-600"
                              }`}
                            >
                              {entry.rankPosition}
                            </div>
                          ) : (
                            <span className="text-gray-500 font-medium">
                              #{entry.rankPosition || "N/A"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                              entry.rankPosition && entry.rankPosition <= 3
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                : "bg-gradient-to-r from-teal-500 to-cyan-500"
                            }`}
                          >
                            <span className="text-white font-medium text-sm">
                              {entry.candidateName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.candidateName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.matchScore !== null ? (
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full"
                                style={{ width: `${entry.matchScore * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(entry.matchScore * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No JD</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {entry.skills}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleFavorite(entry.id)}
                            className={`p-1 rounded transition-all ${
                              entry.isFavorite
                                ? "text-red-500 hover:text-red-600"
                                : "text-gray-400 hover:text-red-500"
                            }`}
                          >
                            <FiHeart
                              className={entry.isFavorite ? "fill-current" : ""}
                            />
                          </button>
                          <button
                            onClick={() =>
                              downloadCandidateReport(
                                entry.id,
                                entry.candidateName
                              )
                            }
                            className="p-1 text-gray-400 hover:text-teal-600 transition-all"
                          >
                            <FiDownload />
                          </button>
                          <button
                            onClick={() =>
                              downloadCandidateResume(
                                entry.id,
                                entry.candidateName
                              )
                            }
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-all"
                          >
                            <FiFileText />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    const handleProfilePictureChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setProfilePicture(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    };

    const handleSaveProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Authentication required. Please login again.");
          return;
        }

        // First, save the profile data
        console.log("Saving profile data:", profileData);
        const profileResponse = await fetch(
          "http://localhost:8080/api/user/profile",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: profileData.email,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              company: profileData.company,
              jobTitle: profileData.jobTitle,
              phone: profileData.phone,
              linkedin: profileData.linkedin,
              bio: profileData.bio,
            }),
          }
        );

        if (!profileResponse.ok) {
          throw new Error(
            `Failed to update profile: ${profileResponse.status}`
          );
        }

        // Then, upload profile picture if selected
        if (profilePicture) {
          console.log("Uploading profile picture:", profilePicture.name);
          const formData = new FormData();
          formData.append("file", profilePicture);

          const pictureResponse = await fetch(
            "http://localhost:8080/api/user/profile/picture",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          if (!pictureResponse.ok) {
            console.error("Failed to upload profile picture");
          } else {
            const pictureData = await pictureResponse.json();
            // Update the preview URL with the saved image
            if (pictureData.profilePicture) {
              setPreviewUrl(pictureData.profilePicture);
            }
          }
        }

        // If email changed, update the preferred email and warn about re-auth
        if (profileData.email !== user?.email) {
          localStorage.setItem("preferredEmail", profileData.email);
          alert(
            "Profile updated successfully! Please note: You will need to re-authenticate with the new email on your next login."
          );
        } else {
          alert("Profile updated successfully!");
        }

        setIsEditing(false);
        setProfilePicture(null); // Clear the selected file
      } catch (error: any) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
      }
    };

    return (
      <div className="p-8">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden mb-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-teal-100">
              Manage your recruiter account and preferences
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {user?.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-colors">
                    <FiCamera className="text-white text-sm" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profileData.firstName && profileData.lastName
                    ? `${profileData.firstName} ${profileData.lastName}`
                    : user?.email}
                </h2>
                <p className="text-gray-600">
                  {profileData.jobTitle || "Recruiter"}
                </p>
                <p className="text-sm text-gray-500">
                  {profileData.company && `${profileData.company} • `}
                  Member since{" "}
                  {user && new Date(user.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Login Email:</span>
                  <span className="font-mono text-teal-600">{user?.email}</span>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        const newEmail = prompt(
                          "Enter new email for future logins:",
                          user?.email
                        );
                        if (newEmail && newEmail !== user?.email) {
                          localStorage.setItem("preferredEmail", newEmail);
                          alert(
                            "Email preference updated! You'll use this email for future logins."
                          );
                        }
                      }}
                      className="text-teal-500 hover:text-teal-700 underline"
                    >
                      Change Login Email
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                isEditing
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              {isEditing ? (
                <>
                  <FiSave />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <FiEdit3 />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>{" "}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isEditing
                          ? "bg-white focus:ring-2 focus:ring-teal-500"
                          : "bg-gray-50 text-gray-500"
                      }`}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isEditing
                          ? "bg-white focus:ring-2 focus:ring-teal-500"
                          : "bg-gray-50 text-gray-500"
                      }`}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  />
                  {isEditing && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Changing email will require re-authentication on next
                      login
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Professional Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={profileData.jobTitle}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg resize-none ${
                      isEditing
                        ? "bg-white focus:ring-2 focus:ring-teal-500"
                        : "bg-gray-50 text-gray-500"
                    }`}
                    placeholder="Tell us about yourself and your recruiting experience..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Activity Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <div className="flex items-center justify-between">
                  <span className="text-teal-700 font-medium">
                    Leaderboards
                  </span>
                  <FiBarChart className="text-teal-500" />
                </div>
                <p className="text-2xl font-bold text-teal-900 mt-1">
                  {leaderboards.length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">Candidates</span>
                  <FiUsers className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {leaderboards.reduce(
                    (acc, lb) => acc + (lb.entries?.length || 0),
                    0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-medium">Favorites</span>
                  <FiHeart className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {leaderboards.reduce(
                    (acc, lb) =>
                      acc +
                      (lb.entries?.filter((e) => e.isFavorite)?.length || 0),
                    0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 font-medium">
                    This Month
                  </span>
                  <FiCalendar className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {
                    leaderboards.filter(
                      (lb) =>
                        new Date(lb.createdAt).getMonth() ===
                        new Date().getMonth()
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPreviewUrl(null);
                  setProfilePicture(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <FiSave />
                <span>Save Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCandidateDetail = () => {
    if (!selectedCandidate) {
      return (
        <div className="p-8">
          <div className="text-center text-gray-500">No candidate selected</div>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedCandidate(null);
                setActiveTab("leaderboard");
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiChevronRight className="rotate-180" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedCandidate.candidateName}
                </h1>
                {selectedCandidate.rankPosition &&
                  selectedCandidate.rankPosition <= 3 && (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        selectedCandidate.rankPosition === 1
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : selectedCandidate.rankPosition === 2
                          ? "bg-gradient-to-r from-gray-400 to-gray-600"
                          : "bg-gradient-to-r from-orange-400 to-orange-600"
                      }`}
                    >
                      {selectedCandidate.rankPosition}
                    </div>
                  )}
                {selectedCandidate.rankPosition && (
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedCandidate.rankPosition <= 3
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : selectedCandidate.rankPosition <= 10
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    Rank #{selectedCandidate.rankPosition}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>
                  Applied{" "}
                  {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{selectedCandidate.resume?.filename}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleFavorite(selectedCandidate.id)}
              className={`p-3 rounded-lg transition-all ${
                selectedCandidate.isFavorite
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <FiHeart
                className={`${
                  selectedCandidate.isFavorite ? "fill-current" : ""
                } text-lg`}
              />
            </button>
            <button
              onClick={() =>
                downloadCandidateReport(
                  selectedCandidate.id,
                  selectedCandidate.candidateName
                )
              }
              className="px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all flex items-center space-x-2 shadow-md"
            >
              <FiDownload />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {!candidateReport && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <CustomLoader />
              <p className="text-gray-500 mt-4">Loading detailed analysis...</p>
            </div>
          </div>
        )}

        {/* Fallback: Enhanced Basic Info */}
        {!candidateReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiUser className="mr-3 text-teal-500" />
                  Candidate Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Experience Level
                    </h4>
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCandidate.experience?.includes("Senior") ||
                          selectedCandidate.experience?.includes("Lead")
                            ? "bg-purple-100 text-purple-800"
                            : selectedCandidate.experience?.includes("Mid") ||
                              selectedCandidate.experience?.includes("Junior")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedCandidate.experience || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Match Score
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${
                              selectedCandidate.matchScore
                                ? selectedCandidate.matchScore * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {selectedCandidate.matchScore
                          ? `${Math.round(selectedCandidate.matchScore * 100)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTarget className="mr-3 text-teal-500" />
                  Skills Portfolio
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills?.split(",").map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 text-sm rounded-full border border-teal-200 font-medium"
                    >
                      {skill.trim()}
                    </span>
                  )) || (
                    <span className="text-gray-500">No skills extracted</span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiGrid className="mr-3 text-teal-500" />
                  Projects & Experience
                </h4>
                <div className="space-y-4">
                  {selectedCandidate.projects && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">
                        Projects
                      </h5>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedCandidate.projects}
                      </p>
                    </div>
                  )}
                  {selectedCandidate.hackathons && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">
                        Hackathons & Competitions
                      </h5>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedCandidate.hackathons}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiEdit3 className="mr-3 text-teal-500" />
                  Recruiter Notes
                </h4>
                {editingNotes === selectedCandidate.id ? (
                  <div>
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Add your notes about this candidate..."
                    />
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={() => {
                          updateNotes(selectedCandidate.id, tempNotes);
                          setEditingNotes(null);
                        }}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(null);
                          setTempNotes("");
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-4 min-h-[80px]">
                      {selectedCandidate.notes ||
                        "No notes yet. Click 'Edit' to add your thoughts about this candidate."}
                    </p>
                    <button
                      onClick={() => {
                        setEditingNotes(selectedCandidate.id);
                        setTempNotes(selectedCandidate.notes || "");
                      }}
                      className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                    >
                      <FiEdit3 className="text-xs" />
                      <span>Edit Notes</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Quick Actions
                </h4>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-3 shadow-sm">
                    <FiEye className="text-teal-500" />
                    <span>View Resume</span>
                  </button>
                  <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-3 shadow-sm">
                    <FiUsers className="text-teal-500" />
                    <span>Compare Candidates</span>
                  </button>
                  <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-3 shadow-sm">
                    <FiBarChart className="text-teal-500" />
                    <span>Detailed Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {candidateReport && (
          <div className="space-y-8">
            {/* Enhanced Recruiter Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Technical Profile & Skills Strengths */}
              <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-600"></div>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
                      <FiTarget className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Technical Strengths
                      </h3>
                      <p className="text-emerald-600 font-medium text-sm">
                        Skills & Experience Profile
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-emerald-200 shadow-inner">
                    <div className="space-y-4">
                      {/* Skill Strength */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Technical Skills
                        </span>
                        <span className="text-lg font-bold text-emerald-700">
                          {Math.round(candidateReport.skillsScore * 100)}%
                        </span>
                      </div>

                      {/* Top Skills Display */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Top Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {candidateReport.allSkills
                            .slice(0, 4)
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Experience Highlight */}
                      <div className="pt-2 border-t border-emerald-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">
                            {candidateReport.experienceLevel}
                          </span>{" "}
                          level with{" "}
                          <span className="font-semibold">
                            {candidateReport.totalYearsExperience || "N/A"}{" "}
                            years
                          </span>{" "}
                          experience
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {candidateReport.candidateStrength ||
                            `Strong ${
                              candidateReport.topSkillCategory || "technical"
                            } background with ${
                              candidateReport.projectCount || 0
                            } projects`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-emerald-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Key Strengths
                    </span>
                  </div>
                </div>
              </div>

              {/* Interview Focus Areas */}
              <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600"></div>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
                      <FiMessageSquare className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Interview Focus
                      </h3>
                      <p className="text-amber-600 font-medium text-sm">
                        Key Areas to Explore
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6 border border-amber-200 shadow-inner">
                    <div className="space-y-3">
                      {(() => {
                        const interviewData = generateInterviewQuestions(
                          candidateReport,
                          selectedCandidate
                        );
                        return (
                          <>
                            {/* Dynamic Questions */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Key Questions:
                              </p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {interviewData.questions.map(
                                  (question, index) => (
                                    <li key={index}>{question}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            {/* Dynamic Validation Areas */}
                            <div className="pt-2 border-t border-amber-200">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Validate:
                              </p>
                              <div className="text-sm text-gray-700 space-y-1">
                                {interviewData.validationAreas.length > 0 ? (
                                  interviewData.validationAreas.map(
                                    (area, index) => <p key={index}>• {area}</p>
                                  )
                                ) : (
                                  <p>
                                    • Overall technical competency and cultural
                                    fit
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Interview Guide
                    </span>
                  </div>
                </div>
              </div>

              {/* Hiring Decision Support */}
              <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-600"></div>
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
                      <FiCheckCircle className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Hiring Assessment
                      </h3>
                      <p className="text-blue-600 font-medium text-sm">
                        Decision Support
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200 shadow-inner">
                    <div className="space-y-3">
                      {/* Overall Assessment */}
                      <div className="text-center">
                        <div
                          className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl font-bold"
                          style={{
                            backgroundColor:
                              candidateReport.overallScore >= 0.8
                                ? "#10B981"
                                : candidateReport.overallScore >= 0.6
                                ? "#F59E0B"
                                : "#EF4444",
                            color: "white",
                          }}
                        >
                          {Math.round(candidateReport.overallScore * 100)}
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Overall Match
                        </p>
                      </div>

                      {/* Recommendation */}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-2">
                          {candidateReport.hiringRecommendation ||
                            (candidateReport.overallScore >= 0.8
                              ? "🟢 HIGHLY RECOMMENDED"
                              : candidateReport.overallScore >= 0.6
                              ? "🟡 PROCEED WITH INTERVIEW"
                              : candidateReport.overallScore >= 0.4
                              ? "🟠 REQUIRES EVALUATION"
                              : "🔴 NOT RECOMMENDED")}
                        </p>
                      </div>

                      {/* JD Match if available */}
                      {candidateReport.jdMatchPercentage && (
                        <div className="pt-2 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Job Description Match
                            </span>
                            <span className="text-sm font-semibold text-blue-700">
                              {Math.round(candidateReport.jdMatchPercentage)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quick Decision Factors */}
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-600">
                          {candidateReport.fitAssessment ||
                            `Based on ${
                              candidateReport.allSkills.length
                            } skills, ${
                              candidateReport.experienceLevel
                            } experience, and ${
                              candidateReport.projectCount || 0
                            } projects.`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Decision Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary Dashboard - Cleaned up */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg mr-3"></div>
                Executive Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl font-bold">
                      {Math.round(candidateReport.overallScore * 100)}%
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Overall Score
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Combined Rating</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiTarget className="text-white text-2xl" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Top Skill</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {candidateReport.topSkillCategory}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiUser className="text-white text-2xl" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Experience
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {candidateReport.experienceLevel}
                    {candidateReport.totalYearsExperience &&
                      candidateReport.totalYearsExperience > 0 &&
                      ` (${candidateReport.totalYearsExperience} year${
                        candidateReport.totalYearsExperience !== 1 ? "s" : ""
                      })`}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiGrid className="text-white text-2xl" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Projects</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {candidateReport.projectCount} Projects
                  </p>
                </div>
              </div>

              {/* Hiring Recommendation - Clean design */}
              <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-teal-500 rounded-lg">
                    <FiFileText className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">
                      Hiring Recommendation
                    </h4>
                    <p className="text-gray-800 text-base leading-relaxed">
                      {candidateReport.hiringRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Skills Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FiTarget className="mr-3 text-teal-500 text-2xl" />
                Skills Analysis
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700">
                      Skills Score
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(candidateReport.skillsScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-4 rounded-full transition-all shadow-inner"
                      style={{ width: `${candidateReport.skillsScore * 100}%` }}
                    ></div>
                  </div>

                  {/* JD Match if available */}
                  {candidateReport.jdMatchPercentage && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">
                        Job Match Analysis
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Match Percentage
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {Math.round(candidateReport.jdMatchPercentage)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                              style={{
                                width: `${candidateReport.jdMatchPercentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        {candidateReport.matchedSkills &&
                          candidateReport.matchedSkills.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-green-700 mb-2 block">
                                Matched Skills (
                                {candidateReport.matchedSkills.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {candidateReport.matchedSkills
                                  .slice(0, 8)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        {candidateReport.missingSkills &&
                          candidateReport.missingSkills.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-orange-700 mb-2 block">
                                Missing Skills (
                                {candidateReport.missingSkills.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {candidateReport.missingSkills
                                  .slice(0, 6)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    Complete Skills Portfolio (
                    {candidateReport.allSkills.length})
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {candidateReport.allSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border shadow-sm hover:shadow-md transition-shadow"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience & Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Experience Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">💼</span>
                  Professional Experience
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      Experience Score
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(candidateReport.experienceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${candidateReport.experienceScore * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                      Key Highlights
                    </h5>
                    <div className="space-y-2">
                      {candidateReport.experienceHighlights
                        .slice(0, 4)
                        .map((highlight, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700 text-sm leading-relaxed">
                              {highlight}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">📂</span>
                  Project Portfolio
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      Projects Score
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(candidateReport.projectsScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${candidateReport.projectsScore * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-3">
                      Total Projects: {candidateReport.projectCount}
                    </p>
                    {candidateReport.projects.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {candidateReport.projects
                          .slice(0, 5)
                          .map((project, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <span className="text-green-500 mt-1">•</span>
                              <span className="text-gray-700 text-sm leading-relaxed">
                                {project}
                              </span>
                            </div>
                          ))}
                        {candidateReport.projects.length > 5 && (
                          <p className="text-sm text-gray-500 italic">
                            +{candidateReport.projects.length - 5} more
                            projects...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No projects documented
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter Notes Section - Clean Design */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg mr-3"></div>
                  Recruiter Notes
                </h3>
                <button
                  onClick={() => {
                    setEditingNotes(selectedCandidate.id);
                    setTempNotes(
                      selectedCandidate.notes || candidateReport.notes || ""
                    );
                  }}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all flex items-center space-x-2"
                >
                  <FiEdit3 />
                  <span>Edit Notes</span>
                </button>
              </div>

              {editingNotes === selectedCandidate.id ? (
                <div>
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Add your notes about this candidate..."
                  />
                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      onClick={() => {
                        updateNotes(selectedCandidate.id, tempNotes);
                        setEditingNotes(null);
                      }}
                      className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all"
                    >
                      Save Notes
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(null);
                        setTempNotes("");
                      }}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-all border border-gray-300 rounded-lg hover:border-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 min-h-[100px] flex items-center">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {selectedCandidate.notes ||
                      candidateReport.notes ||
                      "No notes yet. Click 'Edit Notes' to add your thoughts about this candidate."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex">
      {renderSidebar()}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Bulk Upload Component
const BulkUploadComponent = ({
  onUpload,
  uploading,
}: {
  onUpload: (
    files: FileList,
    jdFile?: File,
    jdText?: string,
    jdTitle?: string
  ) => void;
  uploading: boolean;
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [jdInputMode, setJdInputMode] = useState<"file" | "text">("text");

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleJdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFiles) {
      alert("Please select resume files to upload");
      return;
    }

    // Validate JD input
    const hasJdFile = jdFile && jdFile.size > 0;
    const hasJdText = jdText.trim().length > 0;

    if (!hasJdFile && !hasJdText) {
      alert(
        "Job description is required. Please provide either a JD file or enter JD text."
      );
      return;
    }

    onUpload(
      selectedFiles,
      jdFile || undefined,
      jdText || undefined,
      jdTitle || undefined
    );
  };

  const isUploadDisabled =
    !selectedFiles ||
    uploading ||
    (jdInputMode === "file"
      ? !jdFile || jdFile.size === 0
      : jdText.trim().length === 0);

  return (
    <div className="space-y-6">
      {/* Resume Upload */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          Resume Files <span className="text-red-500">*</span>
        </label>
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "border-teal-500 bg-teal-50"
              : "border-gray-300 hover:border-teal-400 hover:bg-teal-50/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <FiUpload className="text-teal-600 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Resume Files
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop your resume files here, or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Supports PDF, DOC, DOCX files
            </p>
          </div>
        </div>

        {selectedFiles && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected files ({selectedFiles.length}):
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.from(selectedFiles).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                >
                  <FiFileText className="text-teal-500" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Job Description - Required */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          Job Description <span className="text-red-500">*</span>
        </label>

        {/* JD Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position Title
          </label>
          <input
            type="text"
            value={jdTitle}
            onChange={(e) => setJdTitle(e.target.value)}
            placeholder="e.g., Senior Full Stack Developer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* JD Input Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setJdInputMode("text")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              jdInputMode === "text"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiEdit3 className="inline mr-2" />
            Paste JD Text
          </button>
          <button
            onClick={() => setJdInputMode("file")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              jdInputMode === "file"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiUpload className="inline mr-2" />
            Upload JD File
          </button>
        </div>

        {/* JD Input Content */}
        {jdInputMode === "text" ? (
          <div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {jdText.length} characters • Provide a detailed job description
              for better candidate matching
            </p>
          </div>
        ) : (
          <div>
            <div className="border border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleJdSelect}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                Upload a job description file for candidate matching
              </p>
            </div>

            {jdFile && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
                <FiFileText className="text-teal-500" />
                <span className="flex-1">{jdFile.name}</span>
                <span className="text-gray-400">
                  ({(jdFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="bg-gray-50 rounded-lg p-4">
        <button
          onClick={handleUpload}
          disabled={isUploadDisabled}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <CustomLoader />
              <span>Processing Resumes...</span>
            </>
          ) : (
            <>
              <FiUpload />
              <span>Upload Resumes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Candidate Card Component
const CandidateCard = ({
  entry,
  onToggleFavorite,
  onUpdateNotes,
  onDownloadReport,
  onDownloadResume,
  onCandidateClick,
  editingNotes,
  setEditingNotes,
  tempNotes,
  setTempNotes,
}: {
  entry: LeaderboardEntry;
  onToggleFavorite: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
  onDownloadReport: (id: number, name: string) => void;
  onDownloadResume: (id: number, name: string) => void;
  onCandidateClick: (candidate: LeaderboardEntry) => void;
  editingNotes: number | null;
  setEditingNotes: (id: number | null) => void;
  tempNotes: string;
  setTempNotes: (notes: string) => void;
}) => {
  const handleNotesEdit = () => {
    setEditingNotes(entry.id);
    setTempNotes(entry.notes || "");
  };

  const handleNotesSave = () => {
    onUpdateNotes(entry.id, tempNotes);
    setEditingNotes(null);
  };

  const handleNotesCancel = () => {
    setEditingNotes(null);
    setTempNotes("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-200 cursor-pointer relative"
      onClick={() => onCandidateClick(entry)}
    >
      {/* Ranking Badge */}
      {entry.rankPosition && entry.rankPosition <= 3 && (
        <div
          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            entry.rankPosition === 1
              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
              : entry.rankPosition === 2
              ? "bg-gradient-to-r from-gray-300 to-gray-500"
              : "bg-gradient-to-r from-orange-400 to-orange-600"
          }`}
        >
          {entry.rankPosition}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
              entry.rankPosition && entry.rankPosition <= 3
                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                : "bg-gradient-to-r from-teal-500 to-cyan-500"
            }`}
          >
            <span className="text-white font-bold text-lg">
              {entry.candidateName.charAt(0).toUpperCase()}
            </span>
            {entry.rankPosition && entry.rankPosition <= 3 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs">🏆</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900">{entry.candidateName}</h3>
              {entry.rankPosition && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    entry.rankPosition <= 3
                      ? "bg-yellow-100 text-yellow-800"
                      : entry.rankPosition <= 10
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  #{entry.rankPosition}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(entry.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(entry.id)}
          className={`p-2 rounded-lg transition-all ${
            entry.isFavorite
              ? "text-red-500 bg-red-50 hover:bg-red-100"
              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <FiHeart className={entry.isFavorite ? "fill-current" : ""} />
        </button>
      </div>

      {/* Match Score */}
      {entry.matchScore !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Match Score
            </span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(entry.matchScore * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${entry.matchScore * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700">Skills</span>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {entry.skills || "No skills extracted"}
        </p>
      </div>

      {/* Experience */}
      {entry.experience && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Experience</span>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {entry.experience}
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Notes</span>
          <button
            onClick={handleNotesEdit}
            className="text-gray-400 hover:text-teal-600 transition-all"
          >
            <FiEdit3 className="text-sm" />
          </button>
        </div>
        {editingNotes === entry.id ? (
          <div className="space-y-2">
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add notes about this candidate..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleNotesSave}
                className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 transition-all"
              >
                Save
              </button>
              <button
                onClick={handleNotesCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 min-h-[1.5rem]">
            {entry.notes || "No notes added"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownloadReport(entry.id, entry.candidateName);
          }}
          className="flex-1 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-all font-medium flex items-center justify-center space-x-2"
        >
          <FiDownload className="text-sm" />
          <span>Report</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownloadResume(entry.id, entry.candidateName);
          }}
          className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all font-medium flex items-center justify-center space-x-2"
        >
          <FiFileText className="text-sm" />
          <span>Resume</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCandidateClick(entry);
          }}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center justify-center space-x-2"
        >
          <FiEye className="text-sm" />
          <span>View</span>
        </button>
      </div>
    </motion.div>
  );
};

export default RecruiterDashboard;
