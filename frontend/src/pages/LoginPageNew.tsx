import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful, received data:", data);
        console.log("Storing token:", data.accessToken);
        console.log("Storing role:", data.userRole);

        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("userRole", data.userRole);

        // Verify storage
        console.log(
          "Verification - Token stored:",
          localStorage.getItem("token")
        );
        console.log(
          "Verification - Role stored:",
          localStorage.getItem("userRole")
        );

        // Route to appropriate dashboard based on user role
        if (data.userRole === "RECRUITER") {
          window.location.href = "/recruiter-dashboard";
        } else if (data.userRole === "ADMIN") {
          window.location.href = "/admin-dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const errorData = await response.json();
        setErrors({ email: errorData.message || "Login failed" });
      }
    } catch (error) {
      setErrors({ email: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Character */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative inline-block">
            <motion.div
              className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-4 shadow-lg"
              animate={{
                scale: isTypingPassword ? 0.95 : 1,
                rotate: isTypingPassword ? -2 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <motion.div
                  className="flex space-x-2"
                  animate={{
                    scaleY: isTypingPassword ? 0.1 : 1,
                    y: isTypingPassword ? 2 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </motion.div>

                <AnimatePresence>
                  {isTypingPassword && (
                    <motion.div
                      className="absolute -top-1 -left-2 flex space-x-1"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-2 bg-teal-300 rounded transform -rotate-12"></div>
                      <div className="w-3 h-2 bg-teal-300 rounded transform rotate-12"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  className="w-3 h-1 bg-white rounded-full mt-2 mx-auto"
                  animate={{
                    scaleX: isTypingPassword ? 0.7 : 1,
                    scaleY: isTypingPassword ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                ></motion.div>
              </div>
            </motion.div>

            <motion.h1
              className="text-2xl font-bold text-dark-800"
              animate={{ color: isTypingPassword ? "#0f766e" : "#1e293b" }}
            >
              Welcome Back!
            </motion.h1>
            <p className="text-dark-600 mt-2">Sign in to your account</p>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dark-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <motion.p
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dark-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTypingPassword(true)}
                  onBlur={() => setIsTypingPassword(false)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-dark-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          className="mt-6 bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-dark-600">
            <span className="font-medium">Job Seekers:</span> Analyze and
            improve your resume
            <br />
            <span className="font-medium">Recruiters:</span> Bulk analyze and
            rank candidates
          </p>
        </motion.div>
      </div>
    </div>
  );
}
