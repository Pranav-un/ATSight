import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUpload,
  FiFileText,
  FiTrash2,
  FiDownload,
  FiEye,
  FiPlus,
} from "react-icons/fi";

interface Resume {
  id: number;
  fileName: string;
  filePath: string;
  uploadDate: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: Resume[];
  onUploadResume: (file: File) => Promise<boolean>;
  onDeleteResume: (resumeId: number) => void;
  onSelectResume: (resumeId: number) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  resumes,
  onUploadResume,
  onDeleteResume,
  onSelectResume,
}: ProfileModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await onUploadResume(file);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-dark-800">
                Resume Management
              </h2>
              <p className="text-dark-600 mt-1">
                Manage your resume collection and versions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-dark-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Upload Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-dark-800 mb-4">
                Upload New Resume
              </h3>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-300 hover:border-teal-300 hover:bg-teal-50/50"
                } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="relative">
                  {uploading ? (
                    <motion.div
                      className="w-16 h-16 border-4 border-teal-200 rounded-full mx-auto mb-4 border-t-teal-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ) : (
                    <FiUpload className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                  )}
                </div>

                <h4 className="text-xl font-semibold text-dark-800 mb-2">
                  {uploading ? "Uploading..." : "Drop your resume here"}
                </h4>
                <p className="text-dark-600 mb-6">
                  Or click to browse and select a file from your computer
                </p>

                <input
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInput}
                  disabled={uploading}
                />
                <label
                  htmlFor="resume-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 cursor-pointer transition-all font-medium"
                >
                  <FiPlus className="w-5 h-5 mr-2" />
                  Choose File
                </label>

                <p className="text-sm text-dark-500 mt-4">
                  Supported formats: PDF, DOC, DOCX (up to 5MB)
                </p>
              </div>
            </div>

            {/* Resume List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-800">
                  Your Resume Collection
                </h3>
                <div className="text-sm text-dark-600">
                  {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
                </div>
              </div>

              {resumes.length > 0 ? (
                <div className="grid gap-4">
                  {resumes.map((resume, index) => (
                    <motion.div
                      key={resume.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <FiFileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-800 group-hover:text-teal-700 transition-colors">
                            {resume.fileName}
                          </h4>
                          <p className="text-sm text-dark-600">
                            Version {index + 1} • Uploaded{" "}
                            {new Date(resume.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectResume(resume.id)}
                          className="flex items-center px-3 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          <FiEye className="w-4 h-4 mr-1" />
                          Use for Analysis
                        </button>
                        <button className="p-2 text-dark-400 hover:text-blue-500 transition-colors">
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteResume(resume.id)}
                          className="p-2 text-dark-400 hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-dark-800 mb-2">
                    No resumes uploaded yet
                  </h4>
                  <p className="text-dark-600">
                    Upload your first resume to get started with analysis
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-dark-600 hover:text-dark-800 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
