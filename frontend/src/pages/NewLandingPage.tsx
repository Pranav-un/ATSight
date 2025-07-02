import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheck,
  FiUpload,
  FiSearch,
  FiUsers,
  FiBarChart,
  FiFileText,
  FiStar,
  FiPlay,
  FiArrowDown,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const jobSeekerSteps = [
  {
    step: "01",
    title: "Upload Your Resume",
    description:
      "Easily drag and drop your resume into our upload box or select a file from your computer. We accept PDF and DOCX formats with a maximum file size of 2MB.",
    icon: FiUpload,
    image:
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    step: "02",
    title: "Automatic Analysis",
    description:
      "Our advanced AI-powered system analyzes your resume instantly. We review your content for key elements such as formatting, structure, keyword optimization, grammar, and spelling.",
    icon: FiSearch,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    step: "03",
    title: "Detailed Feedback",
    description:
      "Ensure consistent formatting with clear headers and bullet points. Keep content concise, focus on achievements, and use relevant keywords. Proofread for errors and use action verbs.",
    icon: FiFileText,
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

const recruiterSteps = [
  {
    step: "01",
    title: "Bulk Upload Resumes",
    description:
      "Upload multiple resumes at once and organize them by job position. Our system handles large volumes efficiently, saving you valuable time in the screening process.",
    icon: FiUsers,
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    step: "02",
    title: "Smart Ranking System",
    description:
      "Get AI-powered rankings based on job requirements. Our algorithm scores candidates automatically, highlighting the best matches for your specific role requirements.",
    icon: FiBarChart,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    step: "03",
    title: "Export & Reports",
    description:
      "Generate comprehensive reports in PDF or CSV format. Export candidate data, comparison charts, and detailed analytics to share with your hiring team.",
    icon: FiFileText,
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

const features = [
  {
    name: "AI-Powered Analysis",
    description:
      "Advanced machine learning algorithms analyze resumes with precision",
    icon: FiSearch,
    color: "teal",
  },
  {
    name: "Real-time Processing",
    description: "Get instant results and feedback within seconds of upload",
    icon: FiUpload,
    color: "cyan",
  },
  {
    name: "Smart Matching",
    description: "Intelligent job-resume matching with accuracy scores",
    icon: FiCheck,
    color: "teal",
  },
  {
    name: "Bulk Processing",
    description:
      "Handle multiple resumes simultaneously for efficient screening",
    icon: FiUsers,
    color: "cyan",
  },
];

const testimonials = [
  {
    content:
      "ATSSight transformed our hiring process. We can now screen 100+ resumes in minutes instead of hours.",
    author: "Sarah Johnson",
    role: "HR Director at TechCorp",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
  },
  {
    content:
      "The AI feedback helped me land my dream job. My resume score improved from 65% to 95%!",
    author: "Michael Chen",
    role: "Software Engineer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
  },
  {
    content:
      "Finally, a tool that understands what recruiters really look for. Game-changer for job seekers!",
    author: "Emily Rodriguez",
    role: "Product Manager",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
  },
];

const stats = [
  { label: "Resumes Analyzed", value: "50,000+", icon: FiFileText },
  { label: "Success Rate", value: "95%", icon: FiCheck },
  { label: "Time Saved", value: "80%", icon: FiBarChart },
  { label: "Happy Users", value: "5,000+", icon: FiUsers },
];

export default function LandingPage() {
  const [activeUserType, setActiveUserType] = useState<
    "jobseeker" | "recruiter"
  >("jobseeker");

  const currentSteps =
    activeUserType === "jobseeker" ? jobSeekerSteps : recruiterSteps;

  return (
    <div className="relative overflow-hidden">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-dark-200 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container-padding">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"></div>
              <span className="text-xl font-display font-bold text-dark-800">
                ATSSight
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-dark-600 hover:text-teal-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-dark-600 hover:text-teal-600 transition-colors"
              >
                How it Works
              </a>
              <a
                href="#testimonials"
                className="text-dark-600 hover:text-teal-600 transition-colors"
              >
                Testimonials
              </a>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="container-padding">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <motion.div
                  className="inline-flex items-center px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <FiStar className="w-4 h-4 mr-2" />
                  Trusted by 5,000+ professionals
                </motion.div>
                <h1 className="text-5xl md:text-6xl font-display font-bold text-dark-800 leading-tight">
                  Transform your{" "}
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    career journey
                  </span>
                </h1>
                <p className="text-xl text-dark-600 leading-relaxed">
                  Leverage AI to optimize your resume, match with perfect job
                  opportunities, and take control of your professional future
                  with intelligent insights.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="btn btn-primary text-lg px-8 py-4"
                >
                  Get started free
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button className="btn btn-secondary text-lg px-8 py-4 group">
                  <FiPlay className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch demo
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      src={`https://images.unsplash.com/photo-${
                        150000000 + i
                      }?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`}
                      alt="User"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FiStar
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-dark-600">
                    4.9/5 from 1,200+ reviews
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-dark-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-dark-800">
                      Resume Analysis
                    </h3>
                    <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">
                        Job Description
                      </label>
                      <textarea
                        rows={4}
                        className="input-field"
                        placeholder="Paste job description here..."
                        defaultValue="We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and TypeScript..."
                      />
                    </div>

                    <div className="border-2 border-dashed border-teal-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                      <FiUpload className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                      <p className="text-dark-600">
                        Drop your resume here or click to upload
                      </p>
                      <p className="text-sm text-dark-400 mt-1">
                        PDF, DOCX up to 2MB
                      </p>
                    </div>

                    <button className="btn btn-primary w-full">
                      Analyze Resume
                      <FiArrowRight className="ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full opacity-20"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-20"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FiArrowDown className="w-6 h-6 text-dark-400" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-dark-800">
        <div className="container-padding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500 rounded-lg mb-4">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-dark-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding bg-white">
        <div className="container-padding">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-dark-800 mb-4">
              Powerful features for modern hiring
            </h2>
            <p className="text-xl text-dark-600 max-w-3xl mx-auto">
              Everything you need to streamline your hiring process and find the
              perfect candidates faster than ever before.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="card p-6 text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-${feature.color}-100 text-${feature.color}-600 rounded-lg mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-dark-800 mb-2">
                  {feature.name}
                </h3>
                <p className="text-dark-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="section-padding bg-gradient-to-br from-teal-50 to-cyan-50"
      >
        <div className="container-padding">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-dark-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-dark-600 max-w-3xl mx-auto mb-8">
              Simple, fast, and effective. Get started in minutes with our
              intuitive platform.
            </p>

            {/* User Type Switcher */}
            <div className="inline-flex items-center p-1 bg-white rounded-lg shadow-sm border border-dark-200">
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeUserType === "jobseeker"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-dark-600 hover:text-teal-600"
                }`}
                onClick={() => setActiveUserType("jobseeker")}
              >
                For Job Seekers
              </button>
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeUserType === "recruiter"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-dark-600 hover:text-teal-600"
                }`}
                onClick={() => setActiveUserType("recruiter")}
              >
                For Recruiters
              </button>
            </div>
          </motion.div>

          <div className="space-y-16">
            {currentSteps.map((step, index) => (
              <motion.div
                key={step.step}
                className={`flex flex-col ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center gap-12`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold text-xl">
                      {step.step}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-lg">
                      <step.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-dark-800">
                    {step.title}
                  </h3>
                  <p className="text-lg text-dark-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-80 object-cover rounded-2xl shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section-padding bg-white">
        <div className="container-padding">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-dark-800 mb-4">
              Loved by professionals worldwide
            </h2>
            <p className="text-xl text-dark-600 max-w-3xl mx-auto">
              Join thousands of satisfied users who have transformed their
              hiring process with ATSSight.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                className="card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-dark-700 mb-4">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold text-dark-800">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-dark-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container-padding">
          <motion.div
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to transform your hiring process?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of companies and job seekers who trust ATSSight for
              their recruitment needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-white text-teal-600 hover:bg-gray-50 text-lg px-8 py-4"
              >
                Start Free Trial
                <FiArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/demo"
                className="btn border-2 border-white text-white hover:bg-white hover:text-teal-600 text-lg px-8 py-4"
              >
                Book a Demo
              </Link>
            </div>
            <p className="text-sm opacity-75 mt-4">
              No credit card required • Setup in 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900 text-white py-16">
        <div className="container-padding">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"></div>
                <span className="text-xl font-display font-bold">ATSSight</span>
              </div>
              <p className="text-dark-300 mb-4">
                Transforming the way companies hire and candidates find their
                dream jobs.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-dark-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-dark-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-dark-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-700 mt-12 pt-8 text-center text-dark-400">
            <p>&copy; 2025 ATSSight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
