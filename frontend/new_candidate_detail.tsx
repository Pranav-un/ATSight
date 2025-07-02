const renderCandidateDetail = () => {
  if (!selectedCandidate) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">No candidate selected</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      selectedCandidate.rankPosition === 1
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : selectedCandidate.rankPosition === 2
                        ? "bg-gradient-to-r from-gray-300 to-gray-500"
                        : "bg-gradient-to-r from-orange-400 to-orange-600"
                    }`}
                  >
                    {selectedCandidate.rankPosition}
                  </div>
                )}
              {selectedCandidate.rankPosition && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCandidate.rankPosition <= 3
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedCandidate.rankPosition <= 10
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Rank #{selectedCandidate.rankPosition}
                </span>
              )}
            </div>
            <p className="text-gray-500">
              Applied on{" "}
              {new Date(selectedCandidate.createdAt).toLocaleDateString()}
            </p>
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
              className={selectedCandidate.isFavorite ? "fill-current" : ""}
            />
          </button>
          <button
            onClick={() =>
              downloadCandidateReport(
                selectedCandidate.id,
                selectedCandidate.candidateName
              )
            }
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all flex items-center space-x-2"
          >
            <FiDownload />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {!candidateReport && (
        <div className="flex items-center justify-center py-12">
          <CustomLoader />
        </div>
      )}

      {/* Report Content */}
      {candidateReport && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Executive Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg
                    className="w-24 h-24 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${
                        candidateReport.overallScore * 251.2
                      } 251.2`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(candidateReport.overallScore * 100)}%
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">Overall Score</h3>
              </div>

              {/* Top Skill Category */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FiTarget className="text-white text-3xl" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Top Skill Category
                </h3>
                <p className="text-gray-600">
                  {candidateReport.topSkillCategory}
                </p>
              </div>

              {/* Experience Level */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <FiUser className="text-white text-3xl" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Experience Level
                </h3>
                <p className="text-gray-600">
                  {candidateReport.experienceLevel}
                </p>
                {candidateReport.totalYearsExperience && (
                  <p className="text-sm text-gray-500">
                    {candidateReport.totalYearsExperience} years
                  </p>
                )}
              </div>
            </div>

            {/* Hiring Recommendation */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Hiring Recommendation
              </h4>
              <p className="text-lg text-gray-800">
                {candidateReport.hiringRecommendation}
              </p>
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FiTarget className="mr-3 text-teal-500" />
              Skills Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Score */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Skills Score
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round(candidateReport.skillsScore * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: `${candidateReport.skillsScore * 100}%` }}
                  ></div>
                </div>

                {/* JD Match if available */}
                {candidateReport.jdMatchPercentage && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Job Match
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {candidateReport.jdMatchPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${candidateReport.jdMatchPercentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Matched Skills */}
                {candidateReport.matchedSkills &&
                  candidateReport.matchedSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateReport.matchedSkills.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Missing Skills */}
                {candidateReport.missingSkills &&
                  candidateReport.missingSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateReport.missingSkills.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* All Skills */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  All Skills ({candidateReport.allSkills.length})
                </h4>
                <div className="max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {candidateReport.allSkills.map(
                      (skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="mr-2 text-teal-500" />
                Experience
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Experience Score
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round(candidateReport.experienceScore * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full"
                    style={{
                      width: `${candidateReport.experienceScore * 100}%`,
                    }}
                  ></div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Experience Highlights:
                  </p>
                  <ul className="space-y-1">
                    {candidateReport.experienceHighlights.map(
                      (highlight: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-start"
                        >
                          <span className="text-teal-500 mr-2">•</span>
                          {highlight}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiFileText className="mr-2 text-teal-500" />
                Projects ({candidateReport.projectCount})
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Projects Score
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round(candidateReport.projectsScore * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full"
                    style={{ width: `${candidateReport.projectsScore * 100}%` }}
                  ></div>
                </div>

                {candidateReport.projects.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                      {candidateReport.projects.map(
                        (project: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start"
                          >
                            <span className="text-teal-500 mr-2">•</span>
                            {project}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No projects found</p>
                )}
              </div>
            </div>
          </div>

          {/* Education & Certifications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Education & Certifications
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Education
                </h4>
                {candidateReport.education.length > 0 ? (
                  <ul className="space-y-1">
                    {candidateReport.education.map(
                      (edu: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">
                          {edu}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No education information found
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </h4>
                {candidateReport.certifications.length > 0 ? (
                  <ul className="space-y-1">
                    {candidateReport.certifications.map(
                      (cert: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">
                          {cert}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No certifications found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Cards - Strengths, Weaknesses, and Fit */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Strengths */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-lg p-6 border border-emerald-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl font-bold">✅</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-800">
                  Key Strengths
                </h3>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
                <p className="text-gray-800 leading-relaxed">
                  {candidateReport.candidateStrength}
                </p>
              </div>
            </div>

            {/* Development Areas */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl shadow-lg p-6 border border-amber-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl font-bold">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-amber-800">
                  Development Areas
                </h3>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
                <p className="text-gray-800 leading-relaxed">
                  {candidateReport.candidateWeakness}
                </p>
              </div>
            </div>

            {/* Role Fit Assessment */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl font-bold">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-blue-800">
                  Role Fit Assessment
                </h3>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                <p className="text-gray-800 leading-relaxed">
                  {candidateReport.fitAssessment ||
                    candidateReport.hiringRecommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Recruiter Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recruiter Notes
              </h3>
              <button
                onClick={() => {
                  setEditingNotes(selectedCandidate.id);
                  setTempNotes(candidateReport.notes || "");
                }}
                className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all flex items-center space-x-1"
              >
                <FiEdit3 className="text-xs" />
                <span>Edit Notes</span>
              </button>
            </div>

            {editingNotes === selectedCandidate.id ? (
              <div>
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Add your notes about this candidate..."
                />
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => {
                      updateNotes(selectedCandidate.id, tempNotes);
                      setEditingNotes(null);
                      // Update the local report notes
                      if (candidateReport) {
                        setCandidateReport({
                          ...candidateReport,
                          notes: tempNotes,
                        });
                      }
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
              <div className="text-gray-700">
                {candidateReport.notes ||
                  "No notes yet. Click 'Edit Notes' to add your thoughts about this candidate."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
