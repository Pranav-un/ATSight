import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NewLandingPage from "./pages/NewLandingPage";
import LoginPage from "./pages/LoginPageNew";
import RegisterPage from "./pages/RegisterPage";
import JobSeekerDashboard from "./pages/JobSeekerDashboardNew";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NewLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<JobSeekerDashboard />} />
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
