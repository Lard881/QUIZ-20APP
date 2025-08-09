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
    isActive: true,
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

let quizSessions: QuizSession[] = [
  {
    id: "test-session-1",
    quizId: "1", // JavaScript Fundamentals quiz
    isActive: true,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
    participantCount: 3,
  }
];

let participants: QuizParticipant[] = [
  // Test participants with different performance levels to demonstrate analytics
  {
    id: "test-participant-1",
    sessionId: "test-session-1",
    name: "Alex Johnson",
    joinedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    submittedAt: new Date(Date.now() - 3300000).toISOString(), // 55 minutes ago
    ipAddress: "192.168.1.100",
    deviceFingerprint: "test-device-1",
    answers: [
      { questionId: "q1", answer: 0, answeredAt: new Date(Date.now() - 3350000).toISOString() }, // Correct answer
      { questionId: "q2", answer: 1, answeredAt: new Date(Date.now() - 3320000).toISOString() }  // Correct answer
    ]
  },
  {
    id: "test-participant-2",
    sessionId: "test-session-1",
    name: "Sarah Chen",
    joinedAt: new Date(Date.now() - 3500000).toISOString(),
    submittedAt: new Date(Date.now() - 3200000).toISOString(),
    ipAddress: "192.168.1.101",
    deviceFingerprint: "test-device-2",
    answers: [
      { questionId: "q1", answer: 0, answeredAt: new Date(Date.now() - 3250000).toISOString() }, // Correct answer
      { questionId: "q2", answer: 0, answeredAt: new Date(Date.now() - 3220000).toISOString() }  // Wrong answer (should be 1)
    ]
  },
  {
    id: "test-participant-3",
    sessionId: "test-session-1",
    name: "Mike Rodriguez",
    joinedAt: new Date(Date.now() - 3400000).toISOString(),
    submittedAt: new Date(Date.now() - 3100000).toISOString(),
    ipAddress: "192.168.1.102",
    deviceFingerprint: "test-device-3",
    answers: [
      { questionId: "q1", answer: 1, answeredAt: new Date(Date.now() - 3150000).toISOString() }, // Wrong answer (should be 0)
      { questionId: "q2", answer: 0, answeredAt: new Date(Date.now() - 3120000).toISOString() }  // Wrong answer (should be 1)
    ]
  }
];

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

    const quiz = quizzes.find(
      (q) => q.roomCode.toUpperCase() === roomCode.toUpperCase(),
    );
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

    // Calculate final score with comprehensive answer comparison
    let totalScore = 0;
    let questionsAnswered = 0;
    let questionsCorrect = 0;

    quiz.questions.forEach((question) => {
      const studentAnswer = participant.answers.find(
        (a) => a.questionId === question.id,
      );

      if (
        studentAnswer &&
        studentAnswer.answer !== undefined &&
        studentAnswer.answer !== null
      ) {
        questionsAnswered++;
        let isCorrect = false;

        if (
          question.type === "multiple-choice" ||
          question.type === "true-false"
        ) {
          // Handle both string and number answers for compatibility
          let studentAns = studentAnswer.answer;
          let correctAns = question.correctAnswer;

          // Convert to numbers if possible for comparison
          if (typeof studentAns === "string" && !isNaN(Number(studentAns))) {
            studentAns = Number(studentAns);
          }
          if (typeof correctAns === "string" && !isNaN(Number(correctAns))) {
            correctAns = Number(correctAns);
          }

          isCorrect = studentAns === correctAns;
        } else if (question.type === "short-answer") {
          // For short answer, check if there's a meaningful answer
          const answerText = studentAnswer.answer.toString().trim();
          isCorrect = answerText.length > 0;
        }

        if (isCorrect) {
          totalScore += question.points;
          questionsCorrect++;
        }
      }
    });

    // Mark quiz as submitted with timestamp and score
    // Allow resubmission - update timestamp and score each time
    participant.submittedAt = new Date().toISOString();
    participant.score = totalScore;

    // Store additional scoring metadata
    const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;
    let grade = 'F';
    if (percentage >= 80) grade = 'A';
    else if (percentage >= 50) grade = 'B';
    else if (percentage >= 30) grade = 'C';

    // Add metadata to participant object for easy access
    participant.percentage = Math.round(percentage * 10) / 10;
    participant.grade = grade;
    participant.questionsCorrect = questionsCorrect;
    participant.questionsAnswered = questionsAnswered;

    console.log(`Participant ${participant.name} submitted: ${totalScore}/${totalPossiblePoints} points (${percentage.toFixed(1)}%) - Grade: ${grade}`);

    res.json({
      success: true,
      score: totalScore,
      submittedAt: participant.submittedAt,
      message: "Quiz submitted successfully. Score calculated automatically.",
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "SUBMIT_QUIZ_FAILED",
      message: "Failed to submit quiz",
    };
    res.status(500).json(errorResponse);
  }
};

// Get quiz results with optional recalculation
export const getQuizResults: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const forceRecalculate = req.method === 'POST' || req.body?.forceRecalculate;

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

    console.log(`${forceRecalculate ? 'Force recalculating' : 'Getting'} scores for ${allParticipants.length} participants in quiz: ${quiz.title}`);

    // Process all participants - no demo answers, give 0 score to those who didn't answer

    // Process student responses and calculate proper scores for each participant
    const participantsWithScores = allParticipants.map((participant, index) => {
      console.log(`\n=== Processing Participant ${index + 1}: ${participant.name} ===`);
      console.log(`Participant ID: ${participant.id}, Session: ${participant.sessionId}`);
      console.log(`Student answers:`, participant.answers);

      let totalScore = 0;
      let questionsAnswered = 0;
      let questionsCorrect = 0;
      const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
      const scoreDetails: any[] = [];

      // If student didn't answer any questions, give them 0 score
      if (!participant.answers || participant.answers.length === 0) {
        console.log(`Student ${participant.name} did not answer any questions - Score: 0`);

        // Create score details for each question showing they didn't answer
        quiz.questions.forEach((question) => {
          scoreDetails.push({
            questionId: question.id,
            question: question.question,
            correctAnswer: question.correctAnswer,
            studentAnswer: null,
            isCorrect: false,
            pointsEarned: 0,
            maxPoints: question.points,
            answered: false
          });
        });

        // Calculate final results - 0% and F grade
        const percentage = 0;
        const grade = 'F';

        console.log(`\n=== Final Results for ${participant.name} ===`);
        console.log(`Total Score: ${totalScore}/${totalPossiblePoints} points (No answers submitted)`);
        console.log(`Percentage: ${percentage.toFixed(1)}%`);
        console.log(`Grade: ${grade}`);

        // Update participant record if forced recalculation
        if (forceRecalculate) {
          participant.score = totalScore;
          participant.percentage = percentage;
          participant.grade = grade;
          participant.questionsCorrect = questionsCorrect;
          participant.questionsAnswered = questionsAnswered;
          participant.calculatedAt = new Date().toISOString();
        }

        return {
          ...participant,
          score: totalScore,
          questionsAnswered,
          questionsCorrect,
          totalPossiblePoints,
          percentage,
          grade,
          scoreDetails,
          calculatedAt: new Date().toISOString(),
        };
      }

      // Process each question for this participant
      quiz.questions.forEach((question, qIndex) => {
        console.log(`\n--- Question ${qIndex + 1} (ID: ${question.id}) ---`);
        console.log(`Question: ${question.question}`);
        console.log(`Correct Answer: ${question.correctAnswer} (Type: ${question.type})`);

        // Fetch student's response to this question
        const studentAnswer = participant.answers.find(
          (answer) => answer.questionId === question.id,
        );

        let isCorrect = false;
        let pointsEarned = 0;
        let studentResponse = null;

        if (
          studentAnswer &&
          studentAnswer.answer !== undefined &&
          studentAnswer.answer !== null
        ) {
          questionsAnswered++;
          studentResponse = studentAnswer.answer;
          console.log(`Student Answer: ${studentResponse}`);

          // Calculate if answer is correct based on question type
          if (
            question.type === "multiple-choice" ||
            question.type === "true-false"
          ) {
            // Normalize both answers for accurate comparison
            let normalizedStudentAns = studentAnswer.answer;
            let normalizedCorrectAns = question.correctAnswer;

            // Convert string numbers to actual numbers for comparison
            if (typeof normalizedStudentAns === "string") {
              const numericAns = Number(normalizedStudentAns);
              if (!isNaN(numericAns)) {
                normalizedStudentAns = numericAns;
              }
            }
            if (typeof normalizedCorrectAns === "string") {
              const numericAns = Number(normalizedCorrectAns);
              if (!isNaN(numericAns)) {
                normalizedCorrectAns = numericAns;
              }
            }

            isCorrect = normalizedStudentAns === normalizedCorrectAns;
            console.log(`Comparison: ${normalizedStudentAns} === ${normalizedCorrectAns} = ${isCorrect}`);
          } else if (question.type === "short-answer") {
            // For short answer, check if there's a meaningful answer
            const answerText = studentAnswer.answer.toString().trim();
            isCorrect = answerText.length > 0;
            console.log(`Short answer non-empty: ${isCorrect}`);
          }

          if (isCorrect) {
            pointsEarned = question.points;
            totalScore += pointsEarned;
            questionsCorrect++;
            console.log(`✓ Correct! Earned ${pointsEarned} points`);
          } else {
            console.log(`✗ Incorrect. No points earned.`);
          }
        } else {
          console.log(`No answer provided for this question`);
        }

        // Store detailed scoring information
        scoreDetails.push({
          questionId: question.id,
          question: question.question,
          correctAnswer: question.correctAnswer,
          studentAnswer: studentResponse,
          isCorrect,
          pointsEarned,
          maxPoints: question.points,
          answered: studentResponse !== null
        });
      });

      // Calculate final percentage and grade
      const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;
      let grade = 'F'; // Default grade
      if (percentage >= 80) grade = 'A';
      else if (percentage >= 50) grade = 'B';
      else if (percentage >= 30) grade = 'C';

      console.log(`\n=== Final Results for ${participant.name} ===`);
      console.log(`Total Score: ${totalScore}/${totalPossiblePoints} points`);
      console.log(`Percentage: ${percentage.toFixed(1)}%`);
      console.log(`Grade: ${grade}`);
      console.log(`Questions Answered: ${questionsAnswered}/${quiz.questions.length}`);
      console.log(`Questions Correct: ${questionsCorrect}/${quiz.questions.length}`);

      // Update participant record with recalculated data if forced recalculation
      if (forceRecalculate) {
        participant.score = totalScore;
        participant.percentage = Math.round(percentage * 10) / 10;
        participant.grade = grade;
        participant.questionsCorrect = questionsCorrect;
        participant.questionsAnswered = questionsAnswered;
        participant.calculatedAt = new Date().toISOString();
        console.log(`Updated participant record for ${participant.name}`);
      }

      // Return comprehensive participant data
      return {
        ...participant,
        score: totalScore,
        questionsAnswered,
        questionsCorrect,
        totalPossiblePoints,
        percentage: Math.round(percentage * 10) / 10,
        grade,
        scoreDetails,
        calculatedAt: new Date().toISOString(),
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

    const quiz = quizzes.find(
      (q) => q.roomCode.toUpperCase() === roomCode.toUpperCase(),
    );
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
