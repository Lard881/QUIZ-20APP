import { RequestHandler } from "express";
import { 
  Quiz, 
  QuizSession, 
  QuizParticipant,
  CreateQuizRequest, 
  CreateQuizResponse,
  JoinQuizRequest,
  JoinQuizResponse,
  StartQuizResponse,
  SubmitAnswerRequest,
  GetQuizzesResponse,
  QuizResultsResponse,
  ErrorResponse 
} from "@shared/api";

// In-memory storage (replace with database in production)
let quizzes: Quiz[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of basic JavaScript concepts including variables, functions, and control structures.",
    instructorId: "instructor1",
    timeLimit: 30,
    questions: [
      {
        id: "q1",
        question: "What is the correct way to declare a variable in JavaScript?",
        type: "multiple-choice",
        options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
        correctAnswer: 0,
        points: 1
      },
      {
        id: "q2", 
        question: "JavaScript is a compiled language.",
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: 1,
        points: 1
      }
    ],
    roomCode: "JS2024",
    isActive: false,
    allowRetries: false,
    randomizeQuestions: false,
    maxAttempts: 1,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    title: "React Components Quiz", 
    description: "Advanced quiz covering React hooks, state management, and component lifecycle.",
    instructorId: "instructor1",
    timeLimit: 45,
    questions: [
      {
        id: "q3",
        question: "Which hook is used for side effects in React?",
        type: "multiple-choice", 
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correctAnswer: 1,
        points: 2
      }
    ],
    roomCode: "REACT45",
    isActive: true,
    createdAt: "2024-01-16T14:30:00Z",
    updatedAt: "2024-01-16T14:30:00Z"
  }
];

let quizSessions: QuizSession[] = [];
let participants: QuizParticipant[] = [];

// Helper function to generate room code
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get all quizzes for instructor
export const getQuizzes: RequestHandler = (req, res) => {
  try {
    const response: GetQuizzesResponse = {
      quizzes: quizzes
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "FETCH_FAILED",
      message: "Failed to fetch quizzes"
    };
    res.status(500).json(errorResponse);
  }
};

// Create new quiz
export const createQuiz: RequestHandler = (req, res) => {
  try {
    const quizData = req.body as CreateQuizRequest;
    
    // Validate required fields
    if (!quizData.title || !quizData.questions || quizData.questions.length === 0) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Title and at least one question are required"
      };
      return res.status(400).json(errorResponse);
    }

    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: quizData.title,
      description: quizData.description || "",
      instructorId: "instructor1", // TODO: Get from auth
      timeLimit: quizData.timeLimit,
      questions: quizData.questions.map((q, index) => ({
        ...q,
        id: `q${Date.now()}_${index}`
      })),
      roomCode: generateRoomCode(),
      isActive: false,
      allowRetries: quizData.allowRetries || false,
      randomizeQuestions: quizData.randomizeQuestions || false,
      maxAttempts: quizData.maxAttempts || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    quizzes.push(newQuiz);

    const response: CreateQuizResponse = {
      quiz: newQuiz,
      success: true
    };

    res.status(201).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "CREATE_FAILED",
      message: "Failed to create quiz"
    };
    res.status(500).json(errorResponse);
  }
};

// Join quiz with room code
export const joinQuiz: RequestHandler = (req, res) => {
  try {
    const { roomCode, participantName } = req.body as JoinQuizRequest;

    if (!roomCode || !participantName) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Room code and participant name are required"
      };
      return res.status(400).json(errorResponse);
    }

    const quiz = quizzes.find(q => q.roomCode === roomCode && q.isActive);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found or not active"
      };
      return res.status(404).json(errorResponse);
    }

    // Find or create session for this quiz
    let session = quizSessions.find(s => s.quizId === quiz.id && s.isActive);
    if (!session) {
      session = {
        id: `session_${Date.now()}`,
        quizId: quiz.id,
        participants: [],
        startTime: new Date().toISOString(),
        isActive: true
      };
      quizSessions.push(session);
    }

    // Add participant
    const participant: QuizParticipant = {
      id: `participant_${Date.now()}`,
      name: participantName,
      sessionId: session.id,
      answers: []
    };

    participants.push(participant);
    session.participants.push(participant);

    const response: JoinQuizResponse = {
      sessionId: session.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        instructorId: quiz.instructorId,
        timeLimit: quiz.timeLimit,
        roomCode: quiz.roomCode,
        isActive: quiz.isActive,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        questions: [] // Don't send questions until quiz starts
      },
      success: true
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "JOIN_FAILED",
      message: "Failed to join quiz"
    };
    res.status(500).json(errorResponse);
  }
};

// Start quiz session
export const startQuiz: RequestHandler = (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = quizSessions.find(s => s.id === sessionId);
    if (!session) {
      const errorResponse: ErrorResponse = {
        error: "SESSION_NOT_FOUND",
        message: "Quiz session not found"
      };
      return res.status(404).json(errorResponse);
    }

    const quiz = quizzes.find(q => q.id === session.quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND", 
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    // Mark session as started
    session.startTime = new Date().toISOString();

    const response: StartQuizResponse = {
      quiz: quiz,
      sessionId: session.id,
      timeRemaining: quiz.timeLimit * 60 // Convert to seconds
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "START_FAILED",
      message: "Failed to start quiz"
    };
    res.status(500).json(errorResponse);
  }
};

// Submit answer
export const submitAnswer: RequestHandler = (req, res) => {
  try {
    const { sessionId, questionId, answer } = req.body as SubmitAnswerRequest;

    const participant = participants.find(p => p.sessionId === sessionId);
    if (!participant) {
      const errorResponse: ErrorResponse = {
        error: "PARTICIPANT_NOT_FOUND",
        message: "Participant not found"
      };
      return res.status(404).json(errorResponse);
    }

    // Update or add answer
    const existingAnswerIndex = participant.answers.findIndex(a => a.questionId === questionId);
    const answerData = {
      questionId,
      answer,
      timeStamp: new Date().toISOString()
    };

    if (existingAnswerIndex >= 0) {
      participant.answers[existingAnswerIndex] = answerData;
    } else {
      participant.answers.push(answerData);
    }

    res.json({ success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "SUBMIT_FAILED",
      message: "Failed to submit answer"
    };
    res.status(500).json(errorResponse);
  }
};

// Get quiz results
export const getQuizResults: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    const sessions = quizSessions.filter(s => s.quizId === quizId);
    const allParticipants = participants.filter(p => 
      sessions.some(s => s.id === p.sessionId)
    );

    // Calculate scores (simplified)
    const participantsWithScores = allParticipants.map(p => ({
      ...p,
      score: p.answers.length // Simplified scoring
    }));

    const averageScore = participantsWithScores.length > 0
      ? participantsWithScores.reduce((sum, p) => sum + (p.score || 0), 0) / participantsWithScores.length
      : 0;

    const response: QuizResultsResponse = {
      participants: participantsWithScores,
      quiz: quiz,
      averageScore
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "RESULTS_FAILED",
      message: "Failed to get quiz results"
    };
    res.status(500).json(errorResponse);
  }
};

// Update quiz status (activate/deactivate)
export const updateQuizStatus: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const { isActive } = req.body;

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    quiz.isActive = isActive;
    quiz.updatedAt = new Date().toISOString();

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "UPDATE_FAILED",
      message: "Failed to update quiz status"
    };
    res.status(500).json(errorResponse);
  }
};

// Get single quiz details
export const getQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "FETCH_FAILED",
      message: "Failed to fetch quiz"
    };
    res.status(500).json(errorResponse);
  }
};

// Update quiz details and settings
export const updateQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const updateData = req.body;

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    // Update quiz properties
    if (updateData.title !== undefined) quiz.title = updateData.title;
    if (updateData.description !== undefined) quiz.description = updateData.description;
    if (updateData.timeLimit !== undefined) quiz.timeLimit = updateData.timeLimit;
    if (updateData.allowRetries !== undefined) quiz.allowRetries = updateData.allowRetries;
    if (updateData.randomizeQuestions !== undefined) quiz.randomizeQuestions = updateData.randomizeQuestions;
    if (updateData.maxAttempts !== undefined) quiz.maxAttempts = updateData.maxAttempts;
    if (updateData.isActive !== undefined) quiz.isActive = updateData.isActive;
    if (updateData.questions !== undefined) {
      quiz.questions = updateData.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${Date.now()}_${index}`
      }));
    }

    quiz.updatedAt = new Date().toISOString();

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "UPDATE_FAILED",
      message: "Failed to update quiz"
    };
    res.status(500).json(errorResponse);
  }
};

// Delete quiz
export const deleteQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quizIndex = quizzes.findIndex(q => q.id === quizId);
    if (quizIndex === -1) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found"
      };
      return res.status(404).json(errorResponse);
    }

    // Remove quiz
    quizzes.splice(quizIndex, 1);

    // Clean up related sessions and participants
    const relatedSessions = quizSessions.filter(s => s.quizId === quizId);
    relatedSessions.forEach(session => {
      // Remove participants from this session
      participants = participants.filter(p => p.sessionId !== session.id);
    });

    // Remove sessions
    quizSessions = quizSessions.filter(s => s.quizId !== quizId);

    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "DELETE_FAILED",
      message: "Failed to delete quiz"
    };
    res.status(500).json(errorResponse);
  }
};
