# ATSight - Resume Analysis System

## Overview
ATSight is a comprehensive resume analysis system with AI-powered matching, built with Spring Boot backend and React frontend.

## Features
- AI-powered resume analysis and scoring
- Job description matching
- Leaderboard comparison
- User profile management
- Admin dashboard for system monitoring

## Security Setup

### Environment Variables
Before running the application, set up the following environment variables:

```bash
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/resume_analyzer
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_key_here

# AI API Keys (optional)
HUGGINGFACE_API_TOKEN=your_huggingface_token
GROQ_API_KEY=your_groq_api_key
OLLAMA_API_URL=http://localhost:11434/api/generate

# AI Features
AI_SUGGESTIONS_ENABLED=true
LLM_ENABLED=true
```

### Getting Started

1. **Backend Setup:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup:**
   - Create MySQL database named `resume_analyzer`
   - The application will create tables automatically

### Security Notes
- Never commit `.env` files or API keys to version control
- Use strong, unique JWT secrets in production
- All sensitive configuration uses environment variables
- User uploaded files are stored locally and excluded from git

### API Documentation
The application provides RESTful APIs for:
- User authentication and authorization
- Resume upload and analysis
- Job description management
- Leaderboard operations
- User profile management

### Development
- Backend runs on `http://localhost:8080`
- Frontend runs on `http://localhost:3001`
- Hot reload enabled for both environments

### Production Deployment
1. Set all environment variables in production environment
2. Use production-grade database
3. Configure proper CORS settings
4. Enable HTTPS
5. Set appropriate JWT expiration times
