# Resume ATS Analyzer

A comprehensive Applicant Tracking System (ATS) built with Spring Boot and React that analyzes resumes against job descriptions using AI/LLM technology.

## Features

### 🎯 Core Functionality

- **Resume Analysis**: Upload and analyze resumes against job descriptions
- **AI-Powered Matching**: Uses HuggingFace and Groq LLM APIs for intelligent matching
- **Multi-Role Support**: Job Seekers, Recruiters, and Administrators
- **Bulk Processing**: Upload and analyze multiple resumes simultaneously
- **PDF Generation**: Generate detailed analysis reports

### 👥 User Roles

#### Job Seekers

- Upload resumes and get ATS compatibility scores
- Receive AI-generated improvement suggestions
- Track analysis history
- Download detailed reports

#### Recruiters

- Bulk upload candidate resumes
- View candidate leaderboards and rankings
- Access detailed candidate profiles
- Export candidate data (CSV)
- Individual candidate analysis

#### Administrators

- User management (activate/deactivate accounts)
- Platform analytics and insights
- System monitoring and health checks
- User activity tracking

## Technology Stack

### Backend

- **Framework**: Spring Boot 3.2
- **Database**: MySQL 8.0
- **Security**: Spring Security with JWT
- **File Processing**: Apache Tika
- **AI Integration**: HuggingFace, Groq LLM APIs

### Frontend

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router DOM

## Quick Start

### Prerequisites

- Java 21+
- Node.js 18+
- MySQL 8.0+
- Maven (or use included wrapper)

### 1. Clone Repository

```bash
git clone <repository-url>
cd resume-ats-analyzer
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database and API credentials
./mvnw spring-boot:run
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup

```sql
CREATE DATABASE resume_analyzer;
-- Update .env with your database credentials
```

## Configuration

### Environment Variables

See [SETUP.md](SETUP.md) for detailed configuration instructions.

Key environment variables:

- `DB_URL`: Database connection URL
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `HUGGINGFACE_API_TOKEN`: HuggingFace API token
- `GROQ_API_KEY`: Groq LLM API key
- `JWT_SECRET`: JWT signing secret

## API Documentation

Import `Resume ATS Copy.postman_collection.json` into Postman for complete API documentation and testing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
