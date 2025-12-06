# ATSight - AI-Powered Resume Analysis System

> **Transform your hiring process with intelligent resume analysis and candidate matching**

ATSight is a comprehensive web app that reads a person’s resume and uses AI to judge it. It tells how strong the resume is, highlights issues, and ranks multiple candidates automatically for recruiters, and provide actionable insights for recruiters and job seekers. Built with modern technologies including Spring Boot 3.5, React 19, and advanced AI integration capabilities.

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
- **Recruiters**: Upload Bulk Resumes, Manage candidates, create leaderboards, and Get Hiring Recommendations 
- **Admins**: System monitoring and user management

---

## 🖼️ Screenshots

### 🏠 Landing Page

_Experience the modern, intuitive interface_

<!-- Add your landing page screenshot here -->

<img width="1896" height="904" alt="Screenshot 2025-11-12 152553" src="https://github.com/user-attachments/assets/6a01287f-ec28-48fb-ab1d-caf2a830c85a" />


### 👔 Recruiter Dashboard

_Powerful tools for efficient candidate management_

<!-- Add your recruiter dashboard screenshot here -->

<img width="1894" height="905" alt="Screenshot 2025-11-12 152634" src="https://github.com/user-attachments/assets/37b5722b-32b3-4ea7-8caf-6d6c5e63a6bd" />


### 💼 Job Seeker Dashboard

_Personalized insights and career guidance_

<!-- Add your job seeker dashboard screenshot here -->

<img width="1897" height="910" alt="Screenshot 2025-11-12 152620" src="https://github.com/user-attachments/assets/bcda4755-02bf-4dd2-9b02-23b15ae0da27" />


---

## 🚀 Quick Start

### Prerequisites

- **Java 21** (Required for Spring Boot 3.5)
- **Node.js 18+** (Tested with React 19)
- **MySQL 8.0+**
- **Maven 3.6+** (or use included wrapper)

### 1. Clone & Setup

```bash
git clone https://github.com/Pranav-un/ATSight.git
cd ATSight
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE resume_analyzer;
-- The application will auto-create tables on first run
```

### 3. Backend Setup

```bash
cd backend

# Windows (PowerShell)
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api-docs (if enabled)

---

## ⚙️ Configuration

Create a `.env` file in the **backend** directory with the following variables:

```env
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/resume_analyzer
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password

# Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars

# AI Features (Optional)
HUGGINGFACE_API_TOKEN=hf_your_hugging_face_token
GROQ_API_KEY=gsk_your_groq_api_key
AI_SUGGESTIONS_ENABLED=true
LLM_ENABLED=true

# Email Configuration (for notifications)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Optional: Ollama Local LLM
OLLAMA_API_URL=http://localhost:11434/api/generate
```

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_URL` | MySQL database connection URL | ✅ |
| `DB_USERNAME` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `JWT_SECRET` | Secret key for JWT token generation | ✅ |
| `HUGGINGFACE_API_TOKEN` | For AI-powered resume analysis | ❌ |
| `GROQ_API_KEY` | For LLM-based suggestions | ❌ |
| `MAIL_*` | Email service configuration | ❌ |

---

## 🛠️ Tech Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Spring Boot | 3.5.3 |
| **Language** | Java | 21 |
| **Database** | MySQL | 8.0+ |
| **ORM** | Spring Data JPA | - |
| **Security** | Spring Security + JWT | - |
| **File Processing** | Apache Tika | 2.9.0 |
| **PDF Processing** | iText | 5.5.13 |
| **Build Tool** | Maven | 3.6+ |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | React | 19.1.0 |
| **Language** | TypeScript | 5.8.3 |
| **Styling** | Tailwind CSS | 3.3.0 |
| **Build Tool** | Vite | 7.0.0 |
| **Charts** | Chart.js + Recharts | - |
| **Icons** | React Icons | 5.5.0 |
| **Animation** | Framer Motion | 12.19.2 |

### AI & External Services
- **Hugging Face** - NLP and resume analysis
- **Groq API** - Fast LLM inference
- **Ollama** - Local LLM support (optional)

---

## 📈 Key Capabilities

### 🔍 **Resume Analysis**
- Automatic text extraction from PDF and DOC files (Apache Tika)
- AI-powered skills identification and categorization
- Experience level assessment and career progression analysis
- Education qualification parsing and validation

### 🎯 **Smart Matching**
- Job-candidate compatibility scoring with detailed breakdowns
- Skills gap analysis and recommendations
- Experience relevance matching
- Cultural fit assessment

### 💬 **AI-Powered Insights**
- Personalized interview questions generation
- Resume improvement suggestions
- Career path recommendations
- Industry-specific feedback

### 📊 **Analytics & Reporting**
- Real-time candidate leaderboards and rankings
- Recruitment pipeline analytics and bottleneck identification
- Performance metrics and success rate tracking
- Detailed candidate assessment reports

### 🔐 **Enterprise Security**
- JWT-based stateless authentication
- Role-based access control (Job Seeker, Recruiter, Admin)
- Secure file upload and processing
- Environment-based configuration management

---

## 🔒 Security Features

- **Authentication**: Stateless JWT token-based authentication
- **Authorization**: Role-based access control with Spring Security
- **Data Protection**: Input validation and sanitization using Spring Validation
- **File Security**: Secure file upload handling with Apache Tika
- **Configuration**: Environment-based secrets management
- **Email Security**: Secure SMTP with TLS encryption
- **CORS Protection**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: JPA/Hibernate query protection

---

### Project Structure

```
ATSight/
├── backend/                 # Spring Boot application
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Application properties and static resources
│   └── src/test/           # Unit and integration tests
├── frontend/               # React application
│   ├── src/components/     # Reusable React components
│   ├── src/pages/         # Page components
│   ├── src/types/         # TypeScript type definitions
│   └── src/utils/         # Utility functions
└── README.md              # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License .

---

<div align="center">

**Built with ❤️ for modern recruitment**

</div>
