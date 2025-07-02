import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  jobseekers: number;
  recruiters: number;
  admins: number;
  totalResumes: number;
  totalJobDescriptions: number;
  totalAnalyses: number;
}

interface UserSummary {
  id: number;
  email: string;
  role: string;
  active: boolean;
}

interface UserActivity {
  resumes: {
    id: number;
    fileName: string;
    uploadDate: string;
  }[];
  jobDescriptions: {
    id: number;
    title: string;
    uploadDate: string;
  }[];
  analyses: {
    id: number;
    resumeFileName: string;
    jobTitle: string;
    analyzedAt: string;
    matchScore: number;
  }[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "ADMIN") {
      navigate("/login");
      return;
    }

    fetchAnalytics();
    fetchUsers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError("Failed to fetch analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Network error while fetching analytics");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError("Failed to fetch users data");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Network error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      } else {
        setError("Failed to fetch user activity");
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
      setError("Network error while fetching user activity");
    }
  };

  const toggleUserStatus = async (userId: number, activate: boolean) => {
    try {
      const endpoint = activate ? `activate` : `deactivate`;
      const response = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        fetchUsers(); // Refresh the users list
        setError(null); // Clear any previous errors
      } else {
        setError(`Failed to ${activate ? "activate" : "deactivate"} user`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      setError("Network error while updating user status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  // Prepare chart data
  const userRoleData = analytics
    ? [
        { name: "Job Seekers", value: analytics.jobseekers, color: "#10B981" },
        { name: "Recruiters", value: analytics.recruiters, color: "#3B82F6" },
        { name: "Admins", value: analytics.admins, color: "#F59E0B" },
      ]
    : [];

  const userStatusData = analytics
    ? [
        { name: "Active", value: analytics.activeUsers, color: "#10B981" },
        { name: "Inactive", value: analytics.inactiveUsers, color: "#EF4444" },
      ]
    : [];

  const activityData = analytics
    ? [
        { name: "Users", count: analytics.totalUsers },
        { name: "Resumes", count: analytics.totalResumes },
        { name: "Job Descriptions", count: analytics.totalJobDescriptions },
        { name: "Analyses", count: analytics.totalAnalyses },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Admin Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-slate-300">
                  System Administration & Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-slate-300">System Online</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-3 px-1 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 px-1 font-medium text-sm ${
                activeTab === "users"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              👥 User Management
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 px-1 font-medium text-sm ${
                activeTab === "analytics"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`pb-3 px-1 font-medium text-sm ${
                activeTab === "system"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ System
            </button>
          </div>

          <button
            onClick={() => {
              fetchAnalytics();
              fetchUsers();
              setError(null);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {activeTab === "dashboard" && analytics && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold">{analytics.totalUsers}</p>
                    <p className="text-blue-100 text-xs mt-1">
                      {analytics.activeUsers} active
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Resumes
                    </p>
                    <p className="text-3xl font-bold">
                      {analytics.totalResumes}
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      Total uploaded
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Job Descriptions
                    </p>
                    <p className="text-3xl font-bold">
                      {analytics.totalJobDescriptions}
                    </p>
                    <p className="text-purple-100 text-xs mt-1">
                      Active postings
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Analyses
                    </p>
                    <p className="text-3xl font-bold">
                      {analytics.totalAnalyses}
                    </p>
                    <p className="text-orange-100 text-xs mt-1">Completed</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Role Distribution */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  User Role Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* User Status */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  User Status
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Overview */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6">
                Platform Activity Overview
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={activityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">
                  User Management
                </h3>
                <p className="text-slate-400 text-sm">
                  Manage user accounts and permissions
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-medium text-sm">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.email}
                              </div>
                              <div className="text-sm text-slate-400">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-red-100 text-red-800"
                                : user.role === "RECRUITER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => fetchUserActivity(user.id)}
                            className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-colors"
                          >
                            View Activity
                          </button>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, !user.active)
                            }
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              user.active
                                ? "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20"
                                : "text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20"
                            }`}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedUser && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  User Activity Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Resumes Uploaded</p>
                    <p className="text-white text-2xl font-bold">
                      {selectedUser.resumes.length}
                    </p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Job Descriptions</p>
                    <p className="text-white text-2xl font-bold">
                      {selectedUser.jobDescriptions.length}
                    </p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Analyses Performed</p>
                    <p className="text-white text-2xl font-bold">
                      {selectedUser.analyses.length}
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">
                    Recent Activity
                  </h4>

                  {selectedUser.analyses.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-slate-300 mb-3">
                        Recent Analyses
                      </h5>
                      <div className="space-y-2">
                        {selectedUser.analyses.slice(0, 3).map((analysis) => (
                          <div
                            key={analysis.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <span className="text-white">
                                {analysis.resumeFileName}
                              </span>
                              <span className="text-slate-400">
                                {" "}
                                → {analysis.jobTitle}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  analysis.matchScore >= 70
                                    ? "bg-green-100 text-green-800"
                                    : analysis.matchScore >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {analysis.matchScore}%
                              </span>
                              <span className="text-slate-400">
                                {new Date(
                                  analysis.analyzedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.resumes.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-slate-300 mb-3">
                        Recent Resumes
                      </h5>
                      <div className="space-y-2">
                        {selectedUser.resumes.slice(0, 3).map((resume) => (
                          <div
                            key={resume.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-white">
                              {resume.fileName}
                            </span>
                            <span className="text-slate-400">
                              {new Date(resume.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6">
                Platform Growth Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {analytics.totalUsers}
                  </div>
                  <div className="text-slate-400">Total Users</div>
                  <div className="text-sm text-green-400 mt-1">
                    {Math.round(
                      (analytics.activeUsers / analytics.totalUsers) * 100
                    )}
                    % Active
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {analytics.totalResumes}
                  </div>
                  <div className="text-slate-400">Resumes Processed</div>
                  <div className="text-sm text-blue-400 mt-1">
                    {Math.round(analytics.totalResumes / analytics.totalUsers)}{" "}
                    per user
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {analytics.totalAnalyses}
                  </div>
                  <div className="text-slate-400">Analyses Completed</div>
                  <div className="text-sm text-orange-400 mt-1">
                    {analytics.totalResumes > 0
                      ? Math.round(
                          (analytics.totalAnalyses / analytics.totalResumes) *
                            100
                        )
                      : 0}
                    % conversion
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  User Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Job Seekers</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.jobseekers / analytics.totalUsers) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">
                        {analytics.jobseekers}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Recruiters</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.recruiters / analytics.totalUsers) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">
                        {analytics.recruiters}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Admins</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.admins / analytics.totalUsers) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">
                        {analytics.admins}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  System Health
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Active Users</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium">
                        {Math.round(
                          (analytics.activeUsers / analytics.totalUsers) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">System Load</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-400 font-medium">
                        Normal
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Database Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">
                        Healthy
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">API Response</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">
                        &lt; 100ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-8">
            {/* System Status */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6">
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Server Status</p>
                      <p className="text-green-400 font-semibold">Online</p>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Database</p>
                      <p className="text-green-400 font-semibold">Connected</p>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">DB</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">API Status</p>
                      <p className="text-green-400 font-semibold">Healthy</p>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">API</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Uptime</p>
                      <p className="text-blue-400 font-semibold">99.9%</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⏱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6">
                System Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <p className="font-semibold">Refresh Cache</p>
                      <p className="text-sm text-blue-100">
                        Clear application cache
                      </p>
                    </div>
                  </div>
                </button>
                <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-semibold">Generate Report</p>
                      <p className="text-sm text-green-100">
                        Export system metrics
                      </p>
                    </div>
                  </div>
                </button>
                <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔧</span>
                    <div>
                      <p className="font-semibold">System Settings</p>
                      <p className="text-sm text-purple-100">
                        Configure system options
                      </p>
                    </div>
                  </div>
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🗄️</span>
                    <div>
                      <p className="font-semibold">Database Backup</p>
                      <p className="text-sm text-orange-100">
                        Create system backup
                      </p>
                    </div>
                  </div>
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧹</span>
                    <div>
                      <p className="font-semibold">Cleanup Files</p>
                      <p className="text-sm text-red-100">
                        Remove temporary files
                      </p>
                    </div>
                  </div>
                </button>
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg transition-colors text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="font-semibold">View Logs</p>
                      <p className="text-sm text-indigo-100">
                        Check system logs
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6">
                Recent System Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white">
                      System started successfully
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-white">
                      Database optimization completed
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-white">
                      Cache cleared automatically
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">3 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-white">
                      Backup completed successfully
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
