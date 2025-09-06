import { motion } from "framer-motion";
import {
  FiUpload,
  FiMail,
  FiCalendar,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import ProfilePicture from "./ProfilePicture";

interface Resume {
  id: number;
  fileName: string;
  uploadDate: string;
}

interface ProfileSectionProps {
  user: {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    jobTitle?: string;
    location?: string;
  };
  resumes: Resume[];
  onUploadResume: (file: File) => Promise<boolean>;
  onDeleteResume?: (resumeId: number) => Promise<void>;
}

export default function ProfileSection({
  user,
  resumes,
  onUploadResume,
  onDeleteResume,
}: ProfileSectionProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      await onUploadResume(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white"
      >
        <div className="flex items-center">
          <div className="mr-4">
            <ProfilePicture
              src={user.profilePicture}
              size="lg"
              alt={`${user.firstName} ${user.lastName}`}
              className="border-4 border-white/20"
              fallbackBg="from-white/20 to-white/30"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back{user.firstName ? `, ${user.firstName}` : ""}!
            </h2>
            <div className="flex items-center mt-1">
              <FiMail className="w-4 h-4 mr-2 opacity-80" />
              <span className="opacity-90">{user.email}</span>
            </div>
            {user.jobTitle && (
              <div className="flex items-center mt-1 opacity-90">
                <FiBriefcase className="w-4 h-4 mr-2 opacity-80" />
                <span>{user.jobTitle}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center mt-1 opacity-90">
                <FiMapPin className="w-4 h-4 mr-2 opacity-80" />
                <span>{user.location}</span>
              </div>
            )}
            <div className="mt-2">
              <span className="inline-block bg-white/20 px-2 py-1 rounded-full text-sm">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resume Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-dark-800">Resume Management</h3>
          <span className="text-sm text-dark-500">
            {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
          </span>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 hover:border-teal-400 transition-colors">
          <div className="text-center">
            <FiUpload className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-dark-800 mb-2">
              Upload New Resume
            </h4>
            <p className="text-dark-600 mb-4">
              Add a new version to your resume collection
            </p>
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 cursor-pointer transition-all transform hover:scale-105"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Choose File
            </label>
            <p className="text-sm text-dark-500 mt-3">
              Supports PDF, DOC, DOCX up to 5MB
            </p>
          </div>
        </div>

        {/* Resume List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-dark-700 mb-3">Your Resumes</h4>
          {resumes.length > 0 ? (
            resumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <FiUpload className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-dark-800">
                      {resume.fileName}
                    </h5>
                    <div className="flex items-center text-sm text-dark-500">
                      <FiCalendar className="w-3 h-3 mr-1" />
                      {new Date(resume.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <FiDownload className="w-4 h-4" />
                  </button>
                  {onDeleteResume && (
                    <button
                      onClick={() => onDeleteResume(resume.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUpload className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No resumes uploaded yet</p>
              <p className="text-sm">Upload your first resume to get started</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
