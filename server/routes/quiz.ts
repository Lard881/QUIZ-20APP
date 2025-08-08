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
  ErrorResponse,
} from "@shared/api";

// In-memory storage (replace with database in production)
let quizzes: Quiz[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description:
      "Test your knowledge of basic JavaScript concepts including variables, functions, and control structures.",
    instructorId: "instructor1",
    timeLimit: 30,
    questions: [
      {
        id: "q1",
        question:
          "What is the correct way to declare a variable in JavaScript?",
        type: "multiple-choice",
        options: [
          "var x = 5;",
          "variable x = 5;",
          "v x = 5;",
          "declare x = 5;",
        ],
        correctAnswer: 0,
        points: 1,
      },
      {
        id: "q2",
        question: "JavaScript is a compiled language.",
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: 1,
        points: 1,
      },
    ],
    roomCode: "JS2024",
    isActive: false,
    allowRetries: false,
    randomizeQuestions: false,
    maxAttempts: 1,
    durationValue: 30,
    durationUnit: "days",
    expiresAt: "2024-02-15T10:00:00Z",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "React Components Quiz",
    description:
      "Advanced quiz covering React hooks, state management, and component lifecycle.",
    instructorId: "instructor1",
    timeLimit: 45,
    questions: [
      {
        id: "q3",
        question: "Which hook is used for side effects in React?",
        type: "multiple-choice",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correctAnswer: 1,
        points: 2,
      },
    ],
    roomCode: "REACT45",
    isActive: true,
    allowRetries: true,
    randomizeQuestions: true,
    maxAttempts: 3,
    durationValue: 180,
    durationUnit: "minutes",
    expiresAt: "2024-01-16T17:30:00Z",
    createdAt: "2024-01-16T14:30:00Z",
    updatedAt: "2024-01-16T14:30:00Z",
  },
];

let quizSessions: QuizSession[] = [];
let participants: QuizParticipant[] = [];

// Helper function to generate room code
const generateRoomCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get all quizzes for instructor
export const getQuizzes: RequestHandler = (req, res) => {
  try {
    const response: GetQuizzesResponse = {
      quizzes: quizzes,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "FETCH_FAILED",
      message: "Failed to fetch quizzes",
    };
    res.status(500).json(errorResponse);
  }
};

// Create new quiz
export const createQuiz: RequestHandler = (req, res) => {
  try {
    const quizData = req.body as CreateQuizRequest;

    // Validate required fields
    if (
      !quizData.title ||
      !quizData.questions ||
      quizData.questions.length === 0
    ) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Title and at least one question are required",
      };
      return res.status(400).json(errorResponse);
    }

    const now = new Date();
    const durationValue = quizData.durationValue || 30;
    const durationUnit = quizData.durationUnit || "days";

    // Calculate expiration time based on unit
    let expirationMilliseconds: number;
    if (durationUnit === "minutes") {
      expirationMilliseconds = durationValue * 60 * 1000; // minutes to milliseconds
    } else {
      expirationMilliseconds = durationValue * 24 * 60 * 60 * 1000; // days to milliseconds
    }

    const expiresAt = new Date(now.getTime() + expirationMilliseconds);

    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: quizData.title,
      description: quizData.description || "",
      instructorId: "instructor1", // TODO: Get from auth
      timeLimit: quizData.timeLimit,
      questions: quizData.questions.map((q, index) => ({
        ...q,
        id: `q${Date.now()}_${index}`,
      })),
      roomCode: generateRoomCode(),
      isActive: true, // Start as active by default
      allowRetries: quizData.allowRetries || false,
      randomizeQuestions: quizData.randomizeQuestions || false,
      maxAttempts: quizData.maxAttempts || 1,
      durationValue,
      durationUnit,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    quizzes.push(newQuiz);

    const response: CreateQuizResponse = {
      quiz: newQuiz,
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "CREATE_FAILED",
      message: "Failed to create quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Helper function to check if quiz is expired
const isQuizExpired = (quiz: Quiz): boolean => {
  if (!quiz.expiresAt) return false;
  return new Date() > new Date(quiz.expiresAt);
};

// Helper function to get client IP address
const getClientIP = (req: any): string => {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  );
};

// Join quiz with room code
export const joinQuiz: RequestHandler = (req, res) => {
  try {
    const { roomCode, participantName } = req.body as JoinQuizRequest;
    const clientIP = getClientIP(req);

    if (!roomCode || !participantName) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Room code and participant name are required",
      };
      return res.status(400).json(errorResponse);
    }

    const quiz = quizzes.find((q) => q.roomCode.toUpperCase() === roomCode.toUpperCase());
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Check if quiz is expired
    if (isQuizExpired(quiz)) {
      // Auto-deactivate expired quiz
      quiz.isActive = false;
      const errorResponse: ErrorResponse = {
        error: "QUIZ_EXPIRED",
        message: "This quiz has expired and is no longer available",
      };
      return res.status(410).json(errorResponse);
    }

    // Allow joining inactive quizzes but show appropriate message
    if (!quiz.isActive) {
      // Still allow joining, but participant will wait for quiz to be activated
      console.log(`Student attempting to join inactive quiz: ${quiz.title}`);
    }

    // Check attempts by name and IP
    const existingParticipants = participants.filter(
      (p) =>
        p.name.toLowerCase() === participantName.toLowerCase() ||
        p.ipAddress === clientIP,
    );

    const participantAttempts = existingParticipants.filter((p) => {
      const session = quizSessions.find((s) => s.id === p.sessionId);
      return session && session.quizId === quiz.id;
    });

    if (participantAttempts.length >= quiz.maxAttempts) {
      const errorResponse: ErrorResponse = {
        error: "MAX_ATTEMPTS_REACHED",
        message: `You have reached the maximum number of attempts (${quiz.maxAttempts}) for this quiz`,
      };
      return res.status(429).json(errorResponse);
    }

    // Find or create session for this quiz
    let session = quizSessions.find((s) => s.quizId === quiz.id && s.isActive);
    if (!session) {
      session = {
        id: `session_${Date.now()}`,
        quizId: quiz.id,
        participants: [],
        startTime: new Date().toISOString(),
        isActive: true,
      };
      quizSessions.push(session);
    }

    // Add participant with IP and attempt tracking
    const participant: QuizParticipant = {
      id: `participant_${Date.now()}`,
      name: participantName,
      sessionId: session.id,
      answers: [],
      ipAddress: clientIP,
      attemptNumber: participantAttempts.length + 1,
      deviceFingerprint: req.headers["user-agent"] || "unknown",
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
        questions: [], // Don't send questions until quiz starts
      },
      success: true,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "JOIN_FAILED",
      message: "Failed to join quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Start quiz session
export const startQuiz: RequestHandler = (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = quizSessions.find((s) => s.id === sessionId);
    if (!session) {
      const errorResponse: ErrorResponse = {
        error: "SESSION_NOT_FOUND",
        message: "Quiz session not found",
      };
      return res.status(404).json(errorResponse);
    }

    const quiz = quizzes.find((q) => q.id === session.quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Mark session as started
    session.startTime = new Date().toISOString();

    const response: StartQuizResponse = {
      quiz: quiz,
      sessionId: session.id,
      timeRemaining: quiz.timeLimit * 60, // Convert to seconds
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "START_FAILED",
      message: "Failed to start quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Submit answer
export const submitAnswer: RequestHandler = (req, res) => {
  try {
    const { sessionId, questionId, answer } = req.body as SubmitAnswerRequest;

    const participant = participants.find((p) => p.sessionId === sessionId);
    if (!participant) {
      const errorResponse: ErrorResponse = {
        error: "PARTICIPANT_NOT_FOUND",
        message: "Participant not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Update or add answer
    const existingAnswerIndex = participant.answers.findIndex(
      (a) => a.questionId === questionId,
    );
    const answerData = {
      questionId,
      answer,
      timeStamp: new Date().toISOString(),
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
      message: "Failed to submit answer",
    };
    res.status(500).json(errorResponse);
  }
};

// Submit entire quiz with auto-scoring
export const submitQuiz: RequestHandler = (req, res) => {
  try {
    const { sessionId } = req.body;

    const participant = participants.find((p) => p.sessionId === sessionId);
    if (!participant) {
      const errorResponse: ErrorResponse = {
        error: "PARTICIPANT_NOT_FOUND",
        message: "Participant not found",
      };
      return res.status(404).json(errorResponse);
    }

    const session = quizSessions.find((s) => s.id === participant.sessionId);
    if (!session) {
      const errorResponse: ErrorResponse = {
        error: "SESSION_NOT_FOUND",
        message: "Quiz session not found",
      };
      return res.status(404).json(errorResponse);
    }

    const quiz = quizzes.find((q) => q.id === session.quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Calculate final score with improved answer comparison
    let totalScore = 0;

    quiz.questions.forEach((question) => {
      const studentAnswer = participant.answers.find((a) => a.questionId === question.id);

      if (studentAnswer) {
        let isCorrect = false;

        if (question.type === "multiple-choice" || question.type === "true-false") {
          // Handle both string and number answers for compatibility
          const studentAns = typeof studentAnswer.answer === 'string'
            ? (isNaN(Number(studentAnswer.answer)) ? studentAnswer.answer : Number(studentAnswer.answer))
            : studentAnswer.answer;
          const correctAns = typeof question.correctAnswer === 'string'
            ? (isNaN(Number(question.correctAnswer)) ? question.correctAnswer : Number(question.correctAnswer))
            : question.correctAnswer;

          isCorrect = studentAns === correctAns;
        } else if (question.type === "short-answer") {
          isCorrect = studentAnswer.answer &&
                     studentAnswer.answer.toString().trim() !== "";
        }

        if (isCorrect) {
          totalScore += question.points;
        }
      }
    });

    // Mark quiz as submitted with timestamp and score
    // Allow resubmission - update timestamp and score each time
    participant.submittedAt = new Date().toISOString();
    participant.score = totalScore;

    res.json({
      success: true,
      score: totalScore,
      submittedAt: participant.submittedAt,
      message: "Quiz submitted successfully. Score calculated automatically."
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "SUBMIT_QUIZ_FAILED",
      message: "Failed to submit quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Get quiz results
export const getQuizResults: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    const sessions = quizSessions.filter((s) => s.quizId === quizId);
    const allParticipants = participants.filter((p) =>
      sessions.some((s) => s.id === p.sessionId),
    );

    // Calculate scores properly
    const participantsWithScores = allParticipants.map((p) => {
      let totalScore = 0;

      // Calculate actual score based on correct answers
      quiz.questions.forEach((question) => {
        const studentAnswer = p.answers.find((a) => a.questionId === question.id);

        if (studentAnswer) {
          let isCorrect = false;

          if (question.type === "multiple-choice" || question.type === "true-false") {
            // Handle both string and number answers for compatibility
            const studentAns = typeof studentAnswer.answer === 'string'
              ? (isNaN(Number(studentAnswer.answer)) ? studentAnswer.answer : Number(studentAnswer.answer))
              : studentAnswer.answer;
            const correctAns = typeof question.correctAnswer === 'string'
              ? (isNaN(Number(question.correctAnswer)) ? question.correctAnswer : Number(question.correctAnswer))
              : question.correctAnswer;

            isCorrect = studentAns === correctAns;
          } else if (question.type === "short-answer") {
            // For short answer, check if there's a non-empty answer
            // In a real system, this would need manual grading
            isCorrect = studentAnswer.answer &&
                       studentAnswer.answer.toString().trim() !== "";
          }

          if (isCorrect) {
            totalScore += question.points;
          }
        }
      });

      // Update the participant score regardless of previous value
      return {
        ...p,
        score: totalScore,
      };
    });

    const averageScore =
      participantsWithScores.length > 0
        ? participantsWithScores.reduce((sum, p) => sum + (p.score || 0), 0) /
          participantsWithScores.length
        : 0;

    const response: QuizResultsResponse = {
      participants: participantsWithScores,
      quiz: quiz,
      averageScore,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "RESULTS_FAILED",
      message: "Failed to get quiz results",
    };
    res.status(500).json(errorResponse);
  }
};

// Update quiz status (activate/deactivate)
export const updateQuizStatus: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const { isActive } = req.body;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    quiz.isActive = isActive;
    quiz.updatedAt = new Date().toISOString();

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "UPDATE_FAILED",
      message: "Failed to update quiz status",
    };
    res.status(500).json(errorResponse);
  }
};

// Get single quiz details
export const getQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "FETCH_FAILED",
      message: "Failed to fetch quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Update quiz details and settings
export const updateQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const updateData = req.body;

    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Update quiz properties
    if (updateData.title !== undefined) quiz.title = updateData.title;
    if (updateData.description !== undefined)
      quiz.description = updateData.description;
    if (updateData.timeLimit !== undefined)
      quiz.timeLimit = updateData.timeLimit;
    if (updateData.allowRetries !== undefined)
      quiz.allowRetries = updateData.allowRetries;
    if (updateData.randomizeQuestions !== undefined)
      quiz.randomizeQuestions = updateData.randomizeQuestions;
    if (updateData.maxAttempts !== undefined)
      quiz.maxAttempts = updateData.maxAttempts;
    if (updateData.isActive !== undefined) quiz.isActive = updateData.isActive;
    if (updateData.questions !== undefined) {
      quiz.questions = updateData.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${Date.now()}_${index}`,
      }));
    }

    // Update duration and recalculate expiration if duration changed
    let shouldRecalculateExpiration = false;
    if (
      updateData.durationValue !== undefined &&
      updateData.durationValue !== quiz.durationValue
    ) {
      quiz.durationValue = updateData.durationValue;
      shouldRecalculateExpiration = true;
    }
    if (
      updateData.durationUnit !== undefined &&
      updateData.durationUnit !== quiz.durationUnit
    ) {
      quiz.durationUnit = updateData.durationUnit;
      shouldRecalculateExpiration = true;
    }

    if (shouldRecalculateExpiration) {
      const now = new Date();
      let expirationMilliseconds: number;
      if (quiz.durationUnit === "minutes") {
        expirationMilliseconds = quiz.durationValue * 60 * 1000;
      } else {
        expirationMilliseconds = quiz.durationValue * 24 * 60 * 60 * 1000;
      }
      quiz.expiresAt = new Date(
        now.getTime() + expirationMilliseconds,
      ).toISOString();
    }

    quiz.updatedAt = new Date().toISOString();

    res.json({ quiz, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "UPDATE_FAILED",
      message: "Failed to update quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Check if quiz exists and is active by room code
export const checkQuiz: RequestHandler = (req, res) => {
  try {
    const { roomCode } = req.params;

    const quiz = quizzes.find((q) => q.roomCode.toUpperCase() === roomCode.toUpperCase());
    if (!quiz) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Check if quiz is expired
    if (isQuizExpired(quiz)) {
      // Auto-deactivate expired quiz
      quiz.isActive = false;
      const errorResponse: ErrorResponse = {
        error: "QUIZ_EXPIRED",
        message: "This quiz has expired",
      };
      return res.status(410).json(errorResponse);
    }

    // Return quiz without questions for security, regardless of active status
    const { questions, ...quizWithoutQuestions } = quiz;
    res.json({ quiz: quizWithoutQuestions, success: true });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "CHECK_FAILED",
      message: "Failed to check quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Get active quizzes (for student access page)
export const getActiveQuizzes: RequestHandler = (req, res) => {
  try {
    const activeQuizzes = quizzes
      .filter((q) => q.isActive)
      .map(({ questions, ...quiz }) => ({
        ...quiz,
        participantCount: Math.floor(Math.random() * 20), // Mock participant count
      }));

    res.json({ quizzes: activeQuizzes });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "FETCH_FAILED",
      message: "Failed to fetch active quizzes",
    };
    res.status(500).json(errorResponse);
  }
};

// Delete quiz
export const deleteQuiz: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    const quizIndex = quizzes.findIndex((q) => q.id === quizId);
    if (quizIndex === -1) {
      const errorResponse: ErrorResponse = {
        error: "QUIZ_NOT_FOUND",
        message: "Quiz not found",
      };
      return res.status(404).json(errorResponse);
    }

    // Remove quiz
    quizzes.splice(quizIndex, 1);

    // Clean up related sessions and participants
    const relatedSessions = quizSessions.filter((s) => s.quizId === quizId);
    relatedSessions.forEach((session) => {
      // Remove participants from this session
      participants = participants.filter((p) => p.sessionId !== session.id);
    });

    // Remove sessions
    quizSessions = quizSessions.filter((s) => s.quizId !== quizId);

    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "DELETE_FAILED",
      message: "Failed to delete quiz",
    };
    res.status(500).json(errorResponse);
  }
};
