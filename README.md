# 🎯 ATSight - AI-Powered Resume Analysis System

> **Transform your hiring process with intelligent resume analysis and candidate matching**

ATSight is a comprehensive recruitment platform that leverages AI to analyze resumes, match candidates to job descriptions, and provide actionable insights for recruiters and job seekers.

---

## ✨ Features

### 🤖 **AI-Powered Analysis**

- Intelligent resume parsing and scoring
- Job description matching with percentage compatibility
- Skills extraction and gap analysis
- Experience level assessment

### 📊 **Smart Analytics**

- Real-time candidate leaderboards
- Performance metrics and insights
- Recruitment pipeline analytics
- Detailed candidate reports

### 👥 **Multi-User Platform**

- **Job Seekers**: Upload resumes, get AI feedback, track applications
- **Recruiters**: Manage candidates, create leaderboards, interview insights
- **Admins**: System monitoring and user management

---

## 🖼️ Screenshots

### 🏠 Landing Page

_Experience the modern, intuitive interface_

<!-- Add your landing page screenshot here -->

![Landing Page](screenshots/landing-page.png)

### 👔 Recruiter Dashboard

_Powerful tools for efficient candidate management_

<!-- Add your recruiter dashboard screenshot here -->

![Recruiter Dashboard](screenshots/recruiter-dashboard.png)

### 💼 Job Seeker Dashboard

_Personalized insights and career guidance_

<!-- Add your job seeker dashboard screenshot here -->

![Job Seeker Dashboard](screenshots/job-seeker-dashboard.png)

---

## 🚀 Quick Start

### Prerequisites

- **Java 21+**
- **Node.js 18+**
- **MySQL 8.0+**

### 1. Clone & Setup

```bash
git clone https://github.com/Pranav-un/ATSight.git
cd ATSight
```

### 2. Backend Setup

```bash
cd backend
# Set up environment variables (see below)
./mvnw spring-boot:run
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8080

---

## ⚙️ Configuration

Create `.env` file in the backend directory:

```env
# Database
DB_URL=jdbc:mysql://localhost:3306/resume_analyzer
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Security
JWT_SECRET=your_jwt_secret_key

# AI Features (Optional)
HUGGINGFACE_API_TOKEN=your_token
GROQ_API_KEY=your_groq_key
AI_SUGGESTIONS_ENABLED=true
```

---

## 🛠️ Tech Stack

| Component    | Technology                         |
| ------------ | ---------------------------------- |
| **Backend**  | Spring Boot 3.5, Java 21, MySQL    |
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **AI/ML**    | Hugging Face, Groq API             |
| **Security** | JWT Authentication                 |
| **Build**    | Maven, Vite                        |

---

## 📈 Key Capabilities

- **Resume Analysis**: Extract skills, experience, education automatically
- **Smart Matching**: AI-powered job-candidate compatibility scoring
- **Interview Insights**: Generate personalized interview questions
- **Performance Tracking**: Monitor recruitment metrics and success rates
- **Secure Platform**: JWT-based authentication with role management

---

## 🔒 Security

- Environment-based configuration
- JWT token authentication
- Secure file upload handling
- CORS protection
- Input validation and sanitization

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For questions or support, please contact [your-email@domain.com](mailto:your-email@domain.com)

---

<div align="center">

**Built with ❤️ for modern recruitment**

[🌟 Star this repo](https://github.com/Pranav-un/ATSight) • [🐛 Report Bug](https://github.com/Pranav-un/ATSight/issues) • [💡 Request Feature](https://github.com/Pranav-un/ATSight/issues)

</div>
