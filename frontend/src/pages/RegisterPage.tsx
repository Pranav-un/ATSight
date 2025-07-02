import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { Link } from "react-router-dom";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER" as "USER" | "RECRUITER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | ""
  >("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Check password strength
    if (name === "password") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const checkPasswordStrength = (
    password: string
  ): "weak" | "medium" | "strong" | "" => {
    if (password.length < 6) return "weak";
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return "strong";
    return "medium";
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/register?role=" + formData.role, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful:", data);
        // Redirect to login page after successful registration
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        setErrors({ email: errorData.message || "Registration failed" });
      }
    } catch (error) {
      setErrors({ email: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
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
              className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-400 to-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg"
              animate={{
                scale: isTypingPassword ? 0.95 : 1,
                rotate: isTypingPassword ? -2 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                {/* Eyes */}
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

                {/* Hands covering eyes when typing password */}
                <AnimatePresence>
                  {isTypingPassword && (
                    <motion.div
                      className="absolute -top-1 -left-2 flex space-x-1"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-2 bg-primary-300 rounded transform -rotate-12"></div>
                      <div className="w-3 h-2 bg-primary-300 rounded transform rotate-12"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mouth */}
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
              Join ATSSight!
            </motion.h1>
            <p className="text-dark-600 mt-2">
              Create your account to get started
            </p>
          </div>
        </motion.div>

        {/* Register Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "USER" }))
                  }
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === "USER"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-300 bg-white text-dark-600 hover:border-gray-400"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiUser className="h-5 w-5" />
                    <span className="text-sm font-medium">Job Seeker</span>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "RECRUITER" }))
                  }
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.role === "RECRUITER"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-300 bg-white text-dark-600 hover:border-gray-400"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">Recruiter</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-dark-700 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="John"
                  required
                />
                {errors.firstName && (
                  <motion.p
                    className="text-red-500 text-sm mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.firstName}
                  </motion.p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-dark-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Doe"
                  required
                />
                {errors.lastName && (
                  <motion.p
                    className="text-red-500 text-sm mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.lastName}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Email */}
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="john@example.com"
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

            {/* Password */}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setIsTypingPassword(true)}
                  onBlur={() => setIsTypingPassword(false)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a strong password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            passwordStrength === "weak"
                              ? "33%"
                              : passwordStrength === "medium"
                              ? "66%"
                              : passwordStrength === "strong"
                              ? "100%"
                              : "0%",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength === "weak"
                          ? "text-red-600"
                          : passwordStrength === "medium"
                          ? "text-yellow-600"
                          : passwordStrength === "strong"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {passwordStrength &&
                        passwordStrength.charAt(0).toUpperCase() +
                          passwordStrength.slice(1)}
                    </span>
                  </div>
                </div>
              )}

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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-dark-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-primary-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Sign in here
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
            By creating an account, you agree to our{" "}
            <a
              href="#"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
