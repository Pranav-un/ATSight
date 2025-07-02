import { motion } from "framer-motion";
import { FiArrowRight, FiCheck, FiUpload, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";

const features = [
  {
    name: "Smart Resume Analysis",
    description:
      "AI-powered resume scanning that matches your skills with job requirements",
    icon: FiSearch,
  },
  {
    name: "Easy Upload",
    description: "Simple drag and drop interface for uploading your resume",
    icon: FiUpload,
  },
  {
    name: "Instant Feedback",
    description: "Get immediate insights on how to improve your resume",
    icon: FiCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-6 pb-16 sm:pb-24">
        <main className="mt-16 sm:mt-24">
          <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <motion.div
                className="px-4 sm:px-6 sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div>
                  <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                    <span className="block">Transform your</span>
                    <span className="block text-accent-500">
                      career journey
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                    Leverage AI to optimize your resume, match with perfect job
                    opportunities, and take control of your professional future.
                  </p>
                  <div className="mt-10 sm:mt-12">
                    <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                      <Link to="/register" className="btn btn-accent">
                        Get started
                        <FiArrowRight className="ml-2 -mr-1 h-5 w-5" />
                      </Link>
                      <Link to="/login" className="btn btn-secondary">
                        Sign in
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="bg-primary-50 sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                  <div className="px-4 py-8 sm:px-10">
                    <div className="relative">
                      <div
                        className="absolute inset-0 flex items-center"
                        aria-hidden="true"
                      >
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-primary-50 text-gray-500">
                          Try it now
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="job-description" className="sr-only">
                            Job Description
                          </label>
                          <textarea
                            id="job-description"
                            name="job-description"
                            rows={4}
                            className="input-field"
                            placeholder="Paste job description here..."
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="btn btn-primary w-full"
                          >
                            Analyze Resume
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <div className="relative bg-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          <motion.h2
            className="text-base font-semibold uppercase tracking-wider text-accent-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Everything you need
          </motion.h2>
          <motion.p
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Supercharge your job search
          </motion.p>
          <motion.p
            className="mx-auto mt-5 max-w-prose text-xl text-gray-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Our AI-powered platform provides everything you need to create a
            winning resume and land your dream job.
          </motion.p>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  className="pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center rounded-md bg-accent-500 p-3 shadow-lg">
                          <feature.icon
                            className="h-6 w-6 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">
                        {feature.name}
                      </h3>
                      <p className="mt-5 text-base text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
