# QuizMaster - Comprehensive Quiz Management System

A full-featured, real-time quiz management platform built with React, TypeScript, and Express.js. Perfect for educators, trainers, and organizations conducting online assessments.

![QuizMaster Dashboard](https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800&h=400&fit=crop&auto=format)

## 🚀 Features

### 🎓 **For Instructors**

- **Complete Quiz Management**: Create, edit, delete, and organize quizzes
- **Flexible Question Types**: Multiple choice, true/false, and short answer questions
- **Advanced Settings**: Time limits, retry policies, question randomization
- **Real-time Analytics**: Detailed performance metrics and grade analysis
- **Excel Export**: Download student results and analytics in Excel format
- **Duration Flexibility**: Set quiz duration in minutes or days
- **Room Code System**: Unique codes for each quiz session
- **QR Code Generation**: Quick student access via QR codes

### 📱 **For Students**

- **Easy Access**: Join via room codes or QR codes
- **Mobile Responsive**: Works seamlessly on all devices
- **Real-time Timer**: Auto-submission when time expires
- **Attempt Tracking**: Respects maximum attempt limits set by instructors
- **IP-based Security**: Prevents duplicate attempts from same device/IP
- **Intuitive Interface**: Clean, distraction-free quiz taking experience

### 🔧 **Technical Features**

- **Authentication System**: Secure instructor login/signup
- **Session Management**: Persistent login with localStorage
- **Error Handling**: Comprehensive error handling and user feedback
- **API Integration**: RESTful API design with TypeScript interfaces
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live participant counting and status updates

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router 6** for navigation
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons

### Backend

- **Express.js** with TypeScript
- **RESTful API** design
- **In-memory storage** (easily replaceable with database)
- **CORS enabled** for cross-origin requests

### Development Tools

- **TypeScript** for type safety
- **ESLint** for code quality
- **PostCSS** for CSS processing
- **Netlify Functions** for serverless deployment

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Modern web browser** with JavaScript enabled
- **Git** for cloning the repository

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd quiz-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Main App**: Open `http://localhost:5173` in your browser
- **API Server**: Runs automatically alongside the frontend

## 📖 User Guide

### Getting Started as an Instructor

1. **Create Account**

   - Navigate to the home page
   - Click "Login/Sign Up"
   - Fill in your details to create an instructor account

2. **Create Your First Quiz**

   - Click "Create Quiz" from the dashboard
   - Add quiz title, description, and time limit
   - Add questions with multiple choice, true/false, or short answer
   - Configure settings (retries, randomization, attempts)
   - Set duration (minutes or days)
   - Save to create the quiz

3. **Manage Quiz**
   - View all your quizzes on the dashboard
   - Toggle quiz status (Active/Inactive)
   - Edit quiz content and settings
   - View detailed analytics and export results

### Getting Started as a Student

1. **Join a Quiz**

   - Get the room code from your instructor
   - Visit the student access page
   - Enter the room code or scan QR code
   - Provide your name to join

2. **Take the Quiz**
   - Review questions at your own pace
   - Submit answers before time expires
   - View your results when available

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development settings
VITE_APP_NAME=QuizMaster
VITE_API_URL=http://localhost:5173/api

# Production settings (optional)
NODE_ENV=production
PORT=3000
```

### API Endpoints

#### Authentication

- `POST /api/auth/login` - Instructor login
- `POST /api/auth/signup` - Instructor registration

#### Quiz Management

- `GET /api/quizzes` - Get all quizzes for instructor
- `POST /api/quiz` - Create new quiz
- `GET /api/quiz/:id` - Get specific quiz details
- `PUT /api/quiz/:id` - Update quiz
- `DELETE /api/quiz/:id` - Delete quiz
- `PUT /api/quiz/:id/status` - Toggle quiz active status

#### Student Access

- `GET /api/quiz/check/:roomCode` - Check if quiz exists
- `POST /api/quiz/join` - Join quiz with room code
- `POST /api/quiz/:sessionId/start` - Start quiz session
- `POST /api/quiz/answer` - Submit answer
- `GET /api/quiz/:id/results` - Get quiz results

## 🎨 Customization

### Styling

The app uses Tailwind CSS with custom design tokens:

```css
/* Custom CSS classes in global.css */
.quiz-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.quiz-card-hover {
  transition: all 0.2s ease-in-out;
}
```

### Theme Colors

Modify colors in `tailwind.config.ts`:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: "hsl(210 40% 50%)",
        secondary: "hsl(210 40% 90%)",
        // Add your custom colors
      },
    },
  },
};
```

## 🚀 Deployment

### Netlify (Recommended)

1. **Prepare for Deployment**

   ```bash
   npm run build
   ```

2. **Deploy to Netlify**

   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Deploy automatically on push

3. **Configure Netlify Functions**
   - API routes are handled by Netlify Functions
   - Functions are automatically deployed from `netlify/functions/`

### Manual Deployment

1. **Build the Project**

   ```bash
   npm run build
   ```

2. **Deploy Static Files**
   - Upload `dist/` folder to your hosting provider
   - Configure your web server to serve the SPA

## 🔍 Development

### Project Structure

```
quiz-management-system/
├── client/                 # React frontend
│   ├── components/         # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and auth
│   └── pages/             # Page components
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript types
├── netlify/functions/     # Serverless functions
└── public/                # Static assets
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:client   # Start only frontend
npm run dev:server   # Start only backend

# Building
npm run build        # Build for production
npm run build:client # Build frontend only
npm run build:server # Build backend only

# Linting
npm run lint         # Run ESLint
```

### Adding New Features

1. **Frontend Components**

   - Add new pages in `client/pages/`
   - Create reusable components in `client/components/`
   - Update routing in `client/App.tsx`

2. **Backend API**

   - Add new routes in `server/routes/`
   - Define types in `shared/api.ts`
   - Update API imports in components

3. **Database Integration**
   - Replace in-memory storage in `server/routes/`
   - Add database connection and models
   - Update API handlers to use database

## 🛡️ Security Features

- **Input Validation**: All user inputs are validated
- **IP Tracking**: Prevents duplicate attempts from same IP
- **Session Management**: Secure token-based authentication
- **CORS Protection**: Configured for secure cross-origin requests
- **Error Handling**: Comprehensive error handling prevents data leaks

## 📊 Analytics Features

- **Student Performance**: Individual and aggregate score tracking
- **Question Analysis**: Answer distribution and difficulty metrics
- **Export Capabilities**: Excel/CSV export of all results
- **Real-time Monitoring**: Live participant counts and status

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write descriptive commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Students can't join quiz:**

- Check if quiz is activated in dashboard
- Verify room code is correct
- Ensure quiz hasn't expired

**Quiz not loading:**

- Check browser console for errors
- Verify API server is running
- Clear browser cache and reload

**Export not working:**

- Ensure there are participant results
- Check browser's download settings
- Try refreshing the page

### Getting Help

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check this README and inline code comments

## 🎯 Roadmap

### Upcoming Features

- [ ] **Database Integration** (PostgreSQL/MongoDB)
- [ ] **Advanced Question Types** (Fill-in-the-blank, matching)
- [ ] **Video/Image Support** in questions
- [ ] **Live Quiz Sessions** with real-time leaderboards
- [ ] **Bulk Import** of questions from CSV/Excel
- [ ] **Advanced Analytics** with charts and insights
- [ ] **Multi-language Support**
- [ ] **Mobile App** (React Native)
- [ ] **Integration APIs** (LMS integration)
- [ ] **Proctoring Features** (webcam monitoring)

### Performance Improvements

- [ ] **Caching** for better performance
- [ ] **Offline Mode** for quiz taking
- [ ] **Progressive Web App** features
- [ ] **Server-side Rendering** (SSR)

---

**QuizMaster** - Empowering education through technology 🎓

Made with ❤️ by the QuizMaster team
