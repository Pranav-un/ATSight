# Environment Setup Guide

## Prerequisites

1. **Java 21** - Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://openjdk.org/)
2. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
3. **MySQL 8.0+** - Download from [mysql.com](https://www.mysql.com/downloads/)
4. **Maven** (or use included mvnw wrapper)

## Backend Setup

### 1. Database Setup

```sql
CREATE DATABASE resume_analyzer;
CREATE USER 'resume_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON resume_analyzer.* TO 'resume_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Environment Configuration

1. Copy `.env.example` to `.env` in the backend directory:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:

   ```env
   # Database Configuration
   DB_URL=jdbc:mysql://localhost:3306/resume_analyzer
   DB_USERNAME=resume_user
   DB_PASSWORD=secure_password

   # AI/LLM API Keys
   HUGGINGFACE_API_TOKEN=your_huggingface_token_here
   GROQ_API_KEY=your_groq_api_key_here

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   ```

### 3. Getting API Keys

#### HuggingFace API Token

1. Go to [HuggingFace](https://huggingface.co/)
2. Sign up/Login
3. Go to Settings → Access Tokens
4. Create a new token with read permissions
5. Copy the token (starts with `hf_`)

#### Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 4. Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

Or on Windows:

```cmd
cd backend
mvnw.cmd spring-boot:run
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration (Optional)

Create `.env.local` if you need custom API URLs:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Run Frontend

```bash
cd frontend
npm run dev
```

## Production Deployment

### Environment Variables for Production

Set these environment variables in your production environment:

```env
# Database
DB_URL=jdbc:mysql://your-prod-db:3306/resume_analyzer
DB_USERNAME=your_prod_user
DB_PASSWORD=your_secure_prod_password

# API Keys
HUGGINGFACE_API_TOKEN=your_production_hf_token
GROQ_API_KEY=your_production_groq_key

# Security
JWT_SECRET=your_very_secure_production_jwt_secret

# Application
AI_SUGGESTIONS_ENABLED=true
LLM_ENABLED=true
```

### Build Commands

```bash
# Backend
cd backend
./mvnw clean package -DskipTests

# Frontend
cd frontend
npm run build
```

## Default Users

The application will create default users on first run:

- **Admin**: `admin@admin.com` / `admin123`
- **Recruiter**: `recruiter@test.com` / `password123`
- **Job Seeker**: `jobseeker@test.com` / `password123`

⚠️ **Important**: Change these default credentials in production!

## API Documentation

The backend provides a Postman collection at `Resume ATS Copy.postman_collection.json` for testing all endpoints.

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **API Key Errors**

   - Verify API keys are correctly set in `.env`
   - Check API key permissions and quotas

3. **Port Conflicts**
   - Backend runs on port 8080 by default
   - Frontend runs on port 5173 by default
   - Change ports if needed

### Logs

- Backend logs: Check console output
- Frontend logs: Check browser console
- Database logs: Check MySQL error logs
