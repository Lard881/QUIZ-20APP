# QuizMaster - Advanced Quiz Management System

![QuizMaster](https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&auto=format)

A comprehensive, real-time quiz management platform built with React, TypeScript, and Express.js. Perfect for educators, trainers, and organizations conducting online assessments with advanced analytics and automatic scoring.

## 🌟 Key Features

### 👨‍🏫 **For Instructors**

- **🎯 Complete Quiz Management**: Create, edit, delete, and organize quizzes with ease
- **📝 Multiple Question Types**: Support for multiple choice, true/false, and short answer questions
- **⚙️ Advanced Settings**: Customizable time limits, retry policies, question randomization, and attempt limits
- **📊 Real-time Analytics**: Comprehensive performance metrics with automatic grading and ranking
- **📈 Grade Distribution**: Intelligent grading system (A: 80-100%, B: 50-79%, C: 30-49%, F: 0-29%)
- **📋 Excel Export**: Download detailed student results and analytics in Excel format
- **⏰ Flexible Duration**: Set quiz availability in minutes or days with automatic expiration
- **🔗 Room Code System**: Unique 6-character codes for each quiz session
- **📱 QR Code Generation**: Quick student access via QR codes
- **🔄 Auto-Refresh**: Real-time updates of student progress and submissions

### 🎓 **For Students**

- **🚀 Easy Access**: Join quizzes via room codes or QR code scanning
- **📱 Mobile Responsive**: Seamless experience across all devices and screen sizes
- **⏱️ Real-time Timer**: Visual timer with auto-submission when time expires
- **🔒 Attempt Tracking**: Respects maximum attempt limits set by instructors
- **🛡️ IP-based Security**: Prevents duplicate attempts from same device/IP address
- **✨ Clean Interface**: Distraction-free quiz taking experience with intuitive navigation
- **💾 Auto-save**: Automatic answer saving to prevent data loss

### 🔧 **Technical Features**

- **🔐 Authentication System**: Secure instructor login/signup with session management
- **💾 Session Persistence**: Maintains login state across browser sessions
- **🚨 Error Handling**: Comprehensive error handling with user-friendly feedback
- **🌐 RESTful API**: Clean API design with TypeScript interfaces
- **🎨 Modern UI**: Mobile-first design with Tailwind CSS and Radix UI components
- **📡 Real-time Updates**: Live participant counting and status updates
- **⚡ Performance Optimized**: Fast loading and responsive interactions

## 🛠️ Technology Stack

### Frontend Technologies

```
React 18             - Modern React with hooks and concurrent features
TypeScript           - Type-safe development with enhanced IDE support
Vite                 - Lightning-fast development and build tool
React Router 6       - Client-side routing with nested routes
Tailwind CSS         - Utility-first CSS framework for rapid styling
Radix UI             - Accessible, unstyled UI components
Lucide React         - Beautiful, customizable SVG icons
React Query          - Server state management and caching
```

### Backend Technologies

```
Express.js           - Fast, minimalist web framework for Node.js
TypeScript           - Type-safe server-side development
CORS                 - Cross-Origin Resource Sharing support
RESTful API          - Clean, predictable API design
In-memory Storage    - Fast data access (easily replaceable with database)
```

### Development Tools

```
ESLint               - Code quality and consistency enforcement
PostCSS              - CSS processing and optimization
Netlify Functions    - Serverless deployment and hosting
Hot Module Reload    - Instant development feedback
```

## 📋 Prerequisites

Before running QuizMaster, ensure you have:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm or yarn** - Package manager (npm comes with Node.js)
- **Modern web browser** - Chrome, Firefox, Safari, or Edge
- **Git** - For cloning the repository

## 🚀 Quick Start Guide

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd quiz-management-system

# Install dependencies
npm install
```

### 2. Development Server

```bash
# Start the development server
npm run dev

# The application will be available at:
# Frontend: http://localhost:5173
# API: http://localhost:5173/api
```

### 3. First Time Setup

1. Open your browser to `http://localhost:5173`
2. Click "Instructor Login" to create an account
3. Sign up with your details
4. Start creating your first quiz!

## 📖 User Guide

### 🎯 **Instructor Workflow**

#### Creating Your Account

1. Navigate to the homepage
2. Click "Instructor Login"
3. Choose "Sign Up" and fill in your details
4. You'll be automatically logged in and redirected to the dashboard

#### Creating a Quiz

1. **Basic Information**

   - Click "Create Quiz" from the dashboard
   - Enter quiz title and description
   - Set quiz duration (minutes or days)

2. **Adding Questions**

   - Click "Add Question" to create new questions
   - Choose question type (Multiple Choice, True/False, Short Answer)
   - Set point values for each question
   - For multiple choice: Add options and select correct answer
   - For true/false: Select correct answer
   - For short answer: Students' responses are auto-graded based on content

3. **Advanced Settings**

   - **Allow Retries**: Let students retake the quiz
   - **Maximum Attempts**: Set how many times students can attempt
   - **Randomize Questions**: Shuffle question order for each student
   - **Duration**: Set availability period (auto-deactivates after expiration)

4. **Publishing**
   - Click "Create Quiz" to save
   - You'll be redirected to the quiz management page
   - Share the room code or QR code with students

#### Managing Quizzes

1. **Quiz Overview**

   - View quiz status (Active/Inactive)
   - See participant count and question count
   - Monitor time remaining until expiration

2. **Participants Tab**

   - Simple list of students who joined
   - Clean interface showing participant names
   - Real-time updates of new joiners

3. **Analytics Tab**

   - **Performance Rankings**: Students ranked by score percentage
   - **Detailed Scores**: Individual scores, percentages, and grades
   - **Submission Times**: When each student completed the quiz
   - **Grade Distribution**: Visual breakdown of student performance
   - **Export Options**: Download Excel reports with all data

4. **Settings Tab**
   - Modify quiz settings after creation
   - Update duration, attempts, and randomization
   - Changes apply to future participants

### 🎓 **Student Workflow**

#### Joining a Quiz

1. **Room Code Method**

   - Go to the student access page
   - Enter the 6-character room code provided by instructor
   - Enter your full name
   - Click "Start Quiz"

2. **QR Code Method**
   - Scan the QR code with your phone camera
   - You'll be taken directly to the quiz page
   - Enter your name and start the quiz

#### Taking a Quiz

1. **Quiz Interface**

   - Clean, distraction-free design
   - Question counter shows progress (e.g., "Question 2 of 10")
   - Timer shows remaining time with visual progress bar
   - Navigation buttons to move between questions

2. **Answering Questions**

   - **Multiple Choice**: Click on your chosen answer
   - **True/False**: Select True or False
   - **Short Answer**: Type your response in the text box
   - Answers are automatically saved as you type/select

3. **Submission**
   - Answer all questions at your own pace
   - Click "Submit Quiz" on the final question
   - You'll see your score immediately
   - Automatic redirect to student portal after completion

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application Settings
VITE_APP_NAME=QuizMaster
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_URL=http://localhost:5173/api

# Development Settings
NODE_ENV=development
PORT=5173

# Production Settings (when deploying)
NODE_ENV=production
VITE_API_URL=https://your-domain.com/api
```

### Customization Options

#### Grading Scale

Modify the grading scale in `client/pages/QuizManagement.tsx`:

```typescript
const getGrade = (percentage: number): string => {
  if (percentage >= 80) return "A"; // Excellent
  if (percentage >= 50) return "B"; // Good
  if (percentage >= 30) return "C"; // Satisfactory
  return "F"; // Needs Improvement
};
```

#### Quiz Duration Limits

Adjust duration limits in `client/pages/CreateQuiz.tsx`:

```typescript
// Maximum duration values
max={durationUnit === "days" ? "365" : "43200"} // 1 year or 30 days in minutes
```

#### Theme Colors

Customize colors in `tailwind.config.ts`:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: "hsl(210 40% 50%)", // Main brand color
        secondary: "hsl(210 40% 90%)", // Secondary elements
        "quiz-success": "hsl(142 71% 45%)", // Success states
        "quiz-warning": "hsl(38 92% 50%)", // Warning states
        "quiz-timer": "hsl(25 95% 53%)", // Timer colors
      },
    },
  },
};
```

## 🌐 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/signup
PATCH /api/auth/update
GET /api/auth/profile
```

### Quiz Management Endpoints

```http
# Quiz CRUD Operations
GET /api/quizzes              # Get all quizzes for instructor
POST /api/quiz                # Create new quiz
GET /api/quiz/:id             # Get specific quiz details
PATCH /api/quiz/:id           # Update quiz settings
DELETE /api/quiz/:id          # Delete quiz
PATCH /api/quiz/:id/status    # Toggle quiz active/inactive

# Quiz Access
GET /api/quizzes/active       # Get all active quizzes
GET /api/quiz/check/:roomCode # Verify room code exists
```

### Student Interaction Endpoints

```http
POST /api/quiz/join           # Join quiz with room code
GET /api/quiz/session/:id/start # Start quiz session
POST /api/quiz/answer         # Submit individual answers
POST /api/quiz/submit         # Submit complete quiz
GET /api/quiz/:id/results     # Get quiz results and analytics
```

### Request/Response Examples

#### Create Quiz

```json
POST /api/quiz
{
  "title": "JavaScript Fundamentals",
  "description": "Test your JS knowledge",
  "timeLimit": 30,
  "questions": [
    {
      "question": "What is a closure?",
      "type": "multiple-choice",
      "options": ["Function", "Variable", "Scope", "None"],
      "correctAnswer": 0,
      "points": 2
    }
  ],
  "allowRetries": true,
  "maxAttempts": 3,
  "durationValue": 7,
  "durationUnit": "days"
}
```

#### Join Quiz

```json
POST /api/quiz/join
{
  "roomCode": "ABC123",
  "participantName": "John Doe"
}
```

## 🚀 Deployment

### Netlify Deployment (Recommended)

1. **Prepare for Deployment**

   ```bash
   npm run build
   ```

2. **Deploy to Netlify**

   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Environment variables: Add production environment variables

3. **Netlify Configuration**

   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"

   [functions]
     directory = "netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Manual Deployment

1. **Build for Production**

   ```bash
   npm run build
   ```

2. **Deploy Static Files**

   - Upload `dist/` folder to your web server
   - Configure server to serve SPA (redirect all routes to index.html)
   - Set up API endpoints on your server

3. **Environment Setup**
   - Update `VITE_API_URL` to your production API URL
   - Configure CORS settings for your domain
   - Set up SSL certificates for HTTPS

## 📊 Analytics and Reporting

### Student Performance Metrics

- **Individual Scores**: Points earned vs. total possible
- **Percentage Scores**: Calculated as (earned points / total points) × 100
- **Letter Grades**: Automatic grade assignment based on percentage
- **Completion Time**: Timestamp when student submitted quiz
- **Attempt Numbers**: Track multiple attempts per student

### Analytics Features

- **Real-time Rankings**: Students automatically ranked by performance
- **Grade Distribution**: Visual breakdown of class performance
- **Export Capabilities**: Download Excel/CSV files with all data
- **Historical Data**: Track performance over time
- **Participation Metrics**: Monitor student engagement

### Data Export Format

```csv
Rank,Student Name,Score,Total Points,Percentage,Grade,Submission Time
1,"Alice Johnson",18,20,90.0%,A,"2024-01-15 10:30:00"
2,"Bob Smith",15,20,75.0%,B,"2024-01-15 10:28:00"
3,"Carol Davis",12,20,60.0%,B,"2024-01-15 10:35:00"
```

## 🛡️ Security Features

### Authentication & Authorization

- **Secure Sessions**: Token-based authentication with automatic expiration
- **Password Protection**: Secure password hashing and validation
- **Session Management**: Persistent login across browser sessions

### Quiz Integrity

- **IP Address Tracking**: Prevent multiple attempts from same device
- **Device Fingerprinting**: Additional layer of attempt verification
- **Room Code Security**: Unique, time-limited access codes
- **Attempt Limits**: Configurable maximum attempts per student

### Data Protection

- **Input Validation**: All user inputs validated and sanitized
- **CORS Configuration**: Secure cross-origin request handling
- **Error Handling**: Secure error messages that don't leak sensitive data
- **Session Timeouts**: Automatic logout for inactive sessions

## 🔍 Development

### Project Structure

```
quiz-management-system/
├── client/                     # React frontend application
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Base UI components (buttons, cards, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and configurations
│   └── pages/                # Page components and routing
├── server/                    # Express.js backend
│   ├── routes/               # API route handlers
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── quiz.ts          # Quiz management endpoints
│   │   └── demo.ts          # Demo/testing endpoints
│   └── index.ts             # Server entry point
├── shared/                    # Shared TypeScript types and interfaces
│   └── api.ts               # API type definitions
├── netlify/functions/         # Serverless functions for deployment
├── public/                    # Static assets
└── docs/                     # Additional documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:client       # Start only frontend development server
npm run dev:server       # Start only backend development server

# Building
npm run build            # Build for production
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Code Quality
npm run lint             # Run ESLint for code quality
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run test suite
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage report
```

### Adding New Features

#### Frontend Components

1. **Create Component**

   ```bash
   # Add new page component
   touch client/pages/NewFeature.tsx

   # Add reusable component
   touch client/components/NewComponent.tsx
   ```

2. **Update Routing**
   ```typescript
   // In client/App.tsx
   <Route path="/new-feature" element={<NewFeature />} />
   ```

#### Backend API Endpoints

1. **Create Route Handler**

   ```typescript
   // In server/routes/newFeature.ts
   export const newFeatureHandler: RequestHandler = (req, res) => {
     // Implementation
   };
   ```

2. **Register Route**
   ```typescript
   // In server/index.ts
   app.get("/api/new-feature", newFeatureHandler);
   ```

#### Database Integration

To replace in-memory storage with a database:

1. **Install Database Driver**

   ```bash
   npm install prisma @prisma/client  # For Prisma ORM
   # or
   npm install mongoose               # For MongoDB
   ```

2. **Update Data Layer**
   - Replace arrays in `server/routes/quiz.ts`
   - Add database connection and models
   - Update API handlers to use database operations

## 🤝 Contributing

We welcome contributions to QuizMaster! Here's how to get started:

### Development Setup

1. **Fork the Repository**

   ```bash
   git clone https://github.com/your-username/quiz-management-system.git
   cd quiz-management-system
   npm install
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Development Guidelines**

   - Follow TypeScript best practices
   - Write descriptive commit messages
   - Add comments for complex logic
   - Test your changes thoroughly
   - Update documentation as needed

4. **Commit and Push**

   ```bash
   git add .
   git commit -m "Add: Amazing new feature that improves user experience"
   git push origin feature/amazing-new-feature
   ```

5. **Create Pull Request**
   - Open a pull request with detailed description
   - Include screenshots for UI changes
   - Reference any related issues

### Code Style Guidelines

- **TypeScript**: Use strict type checking
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes, minimal custom CSS
- **Naming**: Descriptive variable and function names
- **Comments**: Document complex logic and business rules

## 🆘 Troubleshooting

### Common Issues and Solutions

#### Students Can't Join Quiz

```
Problem: Room code not working
Solutions:
✓ Verify quiz is activated in dashboard
✓ Check room code for typos (case-insensitive)
✓ Ensure quiz hasn't expired
✓ Refresh the instructor dashboard
```

#### Scores Not Calculating

```
Problem: Students show 0 scores in analytics
Solutions:
✓ Click "Recalculate All Scores" button
✓ Ensure students submitted their quiz (not just took it)
✓ Check that questions have correct answers defined
✓ Refresh analytics data
```

#### Quiz Not Loading

```
Problem: White screen or loading forever
Solutions:
✓ Check browser console for errors (F12)
✓ Verify API server is running
✓ Clear browser cache and cookies
✓ Try incognito/private browsing mode
```

#### Export Not Working

```
Problem: Excel download fails
Solutions:
✓ Ensure there are participant results
✓ Check browser's download settings
✓ Disable popup blockers temporarily
✓ Try different browser
```

#### Performance Issues

```
Problem: Slow loading or laggy interface
Solutions:
✓ Check internet connection speed
✓ Close unnecessary browser tabs
✓ Clear browser cache
✓ Use Chrome or Firefox for best performance
```

### Debug Mode

Enable debug logging by adding to `.env`:

```env
VITE_DEBUG=true
NODE_ENV=development
```

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues with detailed reproduction steps
- **Discussions**: Ask questions in GitHub Discussions
- **Support**: Contact the development team for critical issues

## 🎯 Roadmap & Future Features

### Version 2.0 - Enhanced Features

- [ ] **Advanced Question Types**

  - Fill-in-the-blank questions
  - Matching questions
  - Drag-and-drop sorting
  - Image-based questions

- [ ] **Rich Media Support**
  - Video questions and explanations
  - Audio recordings for language tests
  - Image upload for visual questions
  - Mathematical equation support

### Version 2.1 - Collaboration Features

- [ ] **Team Management**

  - Multiple instructors per quiz
  - Department-level organization
  - Shared question banks
  - Template sharing

- [ ] **Advanced Analytics**
  - Learning analytics dashboard
  - Performance trend analysis
  - Comparative class reports
  - Detailed question analysis

### Version 2.2 - Enterprise Features

- [ ] **Integration Capabilities**

  - LMS integration (Canvas, Blackboard, Moodle)
  - Single Sign-On (SSO) support
  - Google Classroom integration
  - Webhook notifications

- [ ] **Advanced Security**
  - Proctoring features
  - Webcam monitoring
  - Screen recording prevention
  - Anti-cheating measures

### Version 3.0 - AI-Powered Features

- [ ] **Intelligent Features**

  - AI-powered question generation
  - Automatic essay grading
  - Personalized learning paths
  - Predictive analytics

- [ ] **Mobile Application**
  - Native iOS and Android apps
  - Offline quiz capability
  - Push notifications
  - Mobile-optimized interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Radix UI** - For accessible, unstyled components
- **Lucide** - For beautiful SVG icons
- **Netlify** - For seamless deployment and hosting
- **Community Contributors** - For feedback, testing, and improvements

---

**QuizMaster** - Transforming education through technology 🎓

_Built with ❤️ for educators worldwide_

**Version 1.0.0** | **Last Updated**: January 2024

For support, questions, or contributions, please visit our [GitHub repository](https://github.com/your-username/quiz-management-system) or contact our development team.
