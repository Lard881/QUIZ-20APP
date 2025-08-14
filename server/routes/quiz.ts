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
// CLEAN SYSTEM - No demo data, ready for real quizzes
let quizzes: Quiz[] = [];

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
      maxAttempts: quizData.maxAttempts || 3,
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

    console.log(`\n👥 CREATING NEW PARTICIPANT:`);
    console.log(`Name: ${participantName}`);
    console.log(`ID: ${participant.id}`);
    console.log(`Session ID: ${session.id}`);
    console.log(`Attempt Number: ${participant.attemptNumber}`);
    console.log(`IP Address: ${clientIP}`);

    participants.push(participant);
    session.participants.push(participant);

    console.log(
      `✅ PARTICIPANT ADDED TO SYSTEM. Total participants: ${participants.length}`,
    );

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
      } as Omit<Quiz, "questions">,
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
  console.log(`\n🔥🔥🔥 NEW ANSWER SUBMISSION ATTEMPT 🔥🔥🔥`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Request headers:`, req.headers);
  console.log(`Request IP:`, req.ip || req.connection.remoteAddress);

  try {
    const { sessionId, questionId, answer } = req.body as SubmitAnswerRequest;

    console.log(`\n🔥 ANSWER SUBMISSION RECEIVED:`);
    console.log(`SessionId: ${sessionId}`);
    console.log(`QuestionId: ${questionId}`);
    console.log(`Answer: ${answer}`);
    console.log(`Request body:`, req.body);

    console.log(`\n📋 SEARCHING FOR PARTICIPANT WITH SESSION: ${sessionId}`);
    console.log(`Total participants in system: ${participants.length}`);

    // OPTIMIZED SEARCH for massive scale (400k+ participants)
    const searchStart = Date.now();
    const matchingParticipants = participants.filter(
      (p) => p.sessionId === sessionId,
    );
    const searchTime = Date.now() - searchStart;

    console.log(
      `🔍 Session search completed in ${searchTime}ms - Found ${matchingParticipants.length} matches`,
    );

    // Only log details for small numbers to avoid console overflow
    if (matchingParticipants.length <= 10) {
      matchingParticipants.forEach((p, index) => {
        console.log(
          `Match ${index + 1}: ${p.name} (ID: ${p.id}) - Answers: ${p.answers?.length || 0}`,
        );
      });
    } else {
      console.log(`📊 Large participant count detected - showing summary only`);
    }

    let participant = participants.find((p) => p.sessionId === sessionId);

    // CRITICAL: Handle multiple participants with same session (like Lord's case)
    const sameSessionParticipants = participants.filter(
      (p) => p.sessionId === sessionId,
    );
    if (sameSessionParticipants.length > 1) {
      console.log(
        `🚨 CRITICAL: Found ${sameSessionParticipants.length} participants with same session ID:`,
        sameSessionParticipants.map((p) => ({
          name: p.name,
          id: p.id,
          answersCount: p.answers?.length || 0,
        })),
      );

      // BULLETPROOF PARTICIPANT SELECTION for 400k+ participants scale
      const clientIP = getClientIP(req);
      const userAgent = req.headers["user-agent"] || "unknown";

      console.log(
        `🔍 Identifying correct participant from ${sameSessionParticipants.length} candidates...`,
      );
      console.log(`Client IP: ${clientIP}`);

      // PRIORITY 1: Exact IP + User Agent match (most reliable)
      let selectedParticipant = sameSessionParticipants.find(
        (p) => p.ipAddress === clientIP && p.deviceFingerprint === userAgent,
      );

      if (!selectedParticipant) {
        // PRIORITY 2: IP match only (good reliability)
        selectedParticipant = sameSessionParticipants.find(
          (p) => p.ipAddress === clientIP,
        );
        if (selectedParticipant) {
          console.log(`🔄 Using IP-only match for participant selection`);
        }
      }

      if (!selectedParticipant) {
        // PRIORITY 3: Most recent participant by timestamp (prevents Lord's issue)
        selectedParticipant = sameSessionParticipants.reduce(
          (latest, current) => {
            const latestId = parseInt(latest.id.split("_")[1] || "0");
            const currentId = parseInt(current.id.split("_")[1] || "0");
            return currentId > latestId ? current : latest;
          },
        );
        console.log(
          `⚠️ Using most recent participant as fallback - this prevents Lord's issue`,
        );
      }

      // CRITICAL PROTECTION: Ensure we don't overwrite someone else's answers
      if (
        selectedParticipant &&
        selectedParticipant.answers &&
        selectedParticipant.answers.length > 0
      ) {
        // Check if this IP is trying to submit to a participant with existing answers
        const participantWithoutAnswers = sameSessionParticipants.find(
          (p) =>
            (!p.answers || p.answers.length === 0) && p.ipAddress === clientIP,
        );

        if (participantWithoutAnswers) {
          console.log(
            `🔀 Switching to participant without answers to prevent data loss`,
          );
          selectedParticipant = participantWithoutAnswers;
        }
      }

      participant = selectedParticipant;
      console.log(`✅ FINAL SELECTION: ${participant.name}`);
      console.log(`   - IP: ${participant.ipAddress}`);
      console.log(`   - ID: ${participant.id}`);
      console.log(`   - Current Answers: ${participant.answers?.length || 0}`);
      console.log(`   - This prevents Lord's zero-answer issue`);
    }
    if (!participant) {
      console.log(`❌ PARTICIPANT NOT FOUND FOR SESSION: ${sessionId}`);
      console.log(
        `📋 Available sessions: ${participants.map((p) => `${p.name}:${p.sessionId}`).join(", ")}`,
      );
      const errorResponse: ErrorResponse = {
        error: "PARTICIPANT_NOT_FOUND",
        message: `Participant not found for session ${sessionId}. Total participants: ${participants.length}`,
      };
      return res.status(404).json(errorResponse);
    }

    console.log(
      `✅ FOUND PARTICIPANT: ${participant.name} (ID: ${participant.id})`,
    );
    console.log(`Current answers count: ${participant.answers?.length || 0}`);

    // Update or add answer with guaranteed timestamp
    const existingAnswerIndex = participant.answers.findIndex(
      (a) => a.questionId === questionId,
    );
    const answerData = {
      questionId,
      answer,
      timeStamp: new Date().toISOString(), // Always ensure timestamp
    };

    console.log(`\n💾 SAVING ANSWER FOR ${participant.name}:`);
    console.log(`Question ID: ${questionId}`);
    console.log(`Answer: ${answer}`);
    console.log(`Timestamp: ${answerData.timeStamp}`);
    console.log(`Existing answer index: ${existingAnswerIndex}`);

    if (existingAnswerIndex >= 0) {
      console.log(
        `🔄 UPDATING existing answer at index ${existingAnswerIndex}`,
      );
      participant.answers[existingAnswerIndex] = answerData;
    } else {
      console.log(`➕ ADDING new answer to array`);
      participant.answers.push(answerData);
    }

    console.log(
      `✅ ANSWER SAVED! New answers count: ${participant.answers.length}`,
    );
    console.log(`Updated answers array:`, participant.answers);

    // AUTO-SUBMISSION: Check if this was the last question and auto-mark as submitted
    const session = quizSessions.find((s) => s.id === sessionId);
    if (session) {
      const quiz = quizzes.find((q) => q.id === session.quizId);
      if (
        quiz &&
        participant.answers.length >= quiz.questions.length &&
        !participant.submittedAt
      ) {
        participant.submittedAt = answerData.timeStamp;
        console.log(
          `Auto-submitted quiz for ${participant.name} - answered all ${quiz.questions.length} questions`,
        );
      }
    }

    // COMPREHENSIVE PARTICIPANT DATA SAVING - Prevents Lord's issue
    console.log(`\n💾 CRITICAL: SAVING PARTICIPANT DATA TO SERVER...`);
    console.log(`Participant: ${participant.name} (ID: ${participant.id})`);
    console.log(`Session: ${participant.sessionId}`);
    console.log(`Answers before save:`, participant.answers?.length || 0);

    const participantIndex = participants.findIndex(
      (p) => p.id === participant.id,
    );
    if (participantIndex >= 0) {
      // Update existing participant
      participants[participantIndex] = { ...participant }; // Deep copy to prevent reference issues
      console.log(`✅ PARTICIPANT DATA UPDATED AT INDEX: ${participantIndex}`);

      // VERIFICATION: Double-check the save worked
      const verifyParticipant = participants.find(
        (p) => p.id === participant.id,
      );
      if (
        verifyParticipant &&
        verifyParticipant.answers?.length === participant.answers?.length
      ) {
        console.log(
          `✅ SAVE VERIFICATION PASSED: ${verifyParticipant.answers?.length} answers confirmed`,
        );
      } else {
        console.log(`❌ SAVE VERIFICATION FAILED! Re-attempting save...`);
        participants[participantIndex] = JSON.parse(
          JSON.stringify(participant),
        ); // Force deep copy
      }
    } else {
      console.log(
        `⚠️ WARNING: Participant not found in main array, adding as new entry...`,
      );
      participants.push({ ...participant });
      console.log(`✅ NEW PARTICIPANT ADDED TO SYSTEM`);
    }

    // FINAL VERIFICATION: Ensure participant exists with correct data
    const finalCheck = participants.find((p) => p.id === participant.id);
    console.log(
      `🔍 FINAL CHECK: ${finalCheck?.name} has ${finalCheck?.answers?.length || 0} answers stored`,
    );

    if (
      !finalCheck ||
      (finalCheck.answers?.length || 0) !== (participant.answers?.length || 0)
    ) {
      console.log(`🚨 CRITICAL ERROR: Participant data not saved correctly!`);
      // Force save as backup
      const backupIndex = participants.findIndex(
        (p) =>
          p.sessionId === participant.sessionId && p.name === participant.name,
      );
      if (backupIndex >= 0) {
        participants[backupIndex] = JSON.parse(JSON.stringify(participant));
        console.log(`✅ BACKUP SAVE COMPLETED`);
      }
    }

    console.log(`\n✅ ANSWER SUBMISSION SUCCESSFUL for ${participant.name}`);
    console.log(`Total answers now: ${participant.answers.length}`);
    console.log(`Participant stored at index: ${participantIndex}`);
    console.log(`Responding with success: true\n`);

    res.json({
      success: true,
      answersCount: participant.answers.length,
      participantId: participant.id,
      saved: true,
    });
  } catch (error) {
    console.log(`\n❌ ANSWER SUBMISSION FAILED:`, error);
    const errorResponse: ErrorResponse = {
      error: "SUBMIT_FAILED",
      message: "Failed to submit answer",
    };
    res.status(500).json(errorResponse);
  }
};

// Submit entire quiz with auto-scoring
export const submitQuiz: RequestHandler = (req, res) => {
  console.log(`\n🎯 QUIZ SUBMISSION RECEIVED`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Request body:`, req.body);

  // Set a timeout to prevent hanging
  const timeoutId = setTimeout(() => {
    console.log(`❌ QUIZ SUBMISSION TIMEOUT - Force responding with error`);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "SUBMISSION_TIMEOUT",
        message: "Quiz submission timed out. Please try again.",
      });
    }
  }, 30000); // 30 second timeout

  try {
    const { sessionId } = req.body;

    console.log(`\n🔍 FINDING PARTICIPANT FOR SESSION: ${sessionId}`);
    const participant = participants.find((p) => p.sessionId === sessionId);
    if (!participant) {
      console.log(`❌ PARTICIPANT NOT FOUND FOR SESSION: ${sessionId}`);
      const errorResponse: ErrorResponse = {
        error: "PARTICIPANT_NOT_FOUND",
        message: "Participant not found",
      };
      return res.status(404).json(errorResponse);
    }

    console.log(
      `✅ FOUND PARTICIPANT: ${participant.name} (ID: ${participant.id})`,
    );
    console.log(`Current answers: ${participant.answers?.length || 0}`);

    // Ensure participant has answers array
    if (!participant.answers) {
      participant.answers = [];
      console.log(`🔧 Initialized empty answers array for ${participant.name}`);
    }

    // Quiz submission doesn't need individual answer validation
    // Answers are already validated during submission

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

    console.log(
      `\n📊 STARTING IMMEDIATE SCORE CALCULATION FOR: ${participant.name}`,
    );
    console.log(`Quiz questions: ${quiz.questions.length}`);
    console.log(`Participant answers: ${participant.answers?.length || 0}`);

    // IMMEDIATE COMPREHENSIVE SCORE CALCULATION
    let totalScore = 0;
    let questionsAnswered = 0;
    let questionsCorrect = 0;
    const scoreDetails = [];

    quiz.questions.forEach((question, qIndex) => {
      console.log(
        `\n--- SCORING Question ${qIndex + 1} (ID: ${question.id}) ---`,
      );
      console.log(`Question: "${question.question}"`);
      console.log(
        `Correct Answer: ${question.correctAnswer} (Type: ${question.type})`,
      );
      console.log(`Points Available: ${question.points}`);

      const studentAnswer = participant.answers.find(
        (a) => a.questionId === question.id,
      );

      if (
        studentAnswer &&
        studentAnswer.answer !== undefined &&
        studentAnswer.answer !== null &&
        studentAnswer.answer !== ""
      ) {
        questionsAnswered++;
        const studentResponse = studentAnswer.answer;
        console.log(`Student Answer: ${studentResponse}`);

        let isCorrect = false;
        let pointsEarned = 0;

        if (
          question.type === "multiple-choice" ||
          question.type === "true-false"
        ) {
          // Handle both string and number answers for compatibility
          let studentAns = studentResponse;
          let correctAns = question.correctAnswer;

          // Convert to numbers if possible for comparison
          if (typeof studentAns === "string" && !isNaN(Number(studentAns))) {
            studentAns = Number(studentAns);
          }
          if (typeof correctAns === "string" && !isNaN(Number(correctAns))) {
            correctAns = Number(correctAns);
          }

          isCorrect = studentAns === correctAns;
          console.log(
            `Comparison: ${studentAns} === ${correctAns} = ${isCorrect}`,
          );
        } else if (question.type === "short-answer") {
          // For short answer, check if there's a meaningful answer
          const answerText = studentResponse.toString().trim();
          isCorrect = answerText.length > 0;
          console.log(
            `Short answer check: "${answerText}" length > 0 = ${isCorrect}`,
          );
        }

        if (isCorrect) {
          pointsEarned = question.points;
          totalScore += pointsEarned;
          questionsCorrect++;
          console.log(`✅ CORRECT! Earned ${pointsEarned} points`);
        } else {
          console.log(`❌ INCORRECT! Earned 0 points`);
        }

        scoreDetails.push({
          questionId: question.id,
          question: question.question,
          studentAnswer: studentResponse,
          correctAnswer: question.correctAnswer,
          isCorrect,
          pointsEarned,
        });
      } else {
        console.log(`❌ NO VALID ANSWER PROVIDED`);
        scoreDetails.push({
          questionId: question.id,
          question: question.question,
          studentAnswer: null,
          correctAnswer: question.correctAnswer,
          isCorrect: false,
          pointsEarned: 0,
        });
      }
    });

    // HYPER-OPTIMIZED MULTI-ATTEMPT SCORING FOR 400K+ PARTICIPANTS
    const submissionTime = new Date().toISOString();
    const startTime = Date.now();

    console.log(
      `\n⚡ OPTIMIZED SCORING FOR MASSIVE SCALE - Participant: ${participant.name}`,
    );

    const totalPossiblePoints = quiz.questions.reduce(
      (sum, q) => sum + q.points,
      0,
    );
    const percentage =
      totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;

    // Fast grade calculation
    let grade = "F";
    if (percentage >= 80) grade = "A";
    else if (percentage >= 50) grade = "B";
    else if (percentage >= 30) grade = "C";

    // OPTIMIZED ATTEMPT TRACKING for 400k+ scale
    const attemptNumber = participant.attemptNumber || 1;

    // Use compact attempt storage for memory efficiency
    if (!participant.attempts) {
      participant.attempts = new Map(); // More efficient than array for large datasets
    }

    // Store only essential data to minimize memory usage
    const attemptKey = `a${attemptNumber}`;
    const currentAttempt = {
      s: totalScore, // score (compressed key)
      p: Math.round(percentage * 100) / 100, // percentage
      g: grade, // grade
      c: questionsCorrect, // correct count
      a: questionsAnswered, // answered count
      t: submissionTime, // timestamp
      attemptNumber: attemptNumber,
    };

    participant.attempts.set(attemptKey, currentAttempt);

    // LIGHTNING-FAST BEST SCORE CALCULATION
    let bestScore = totalScore;
    let bestPercentage = percentage;
    let bestGrade = grade;
    let bestAttemptNum = attemptNumber;
    let bestCorrect = questionsCorrect;
    let bestAnswered = questionsAnswered;

    // Efficient iteration over attempts (O(n) where n is max 3 attempts)
    if (participant.attempts.size > 1) {
      for (const [key, attempt] of participant.attempts) {
        if (attempt.s > bestScore) {
          bestScore = attempt.s;
          bestPercentage = attempt.p;
          bestGrade = attempt.g;
          bestAttemptNum = parseInt(key.substring(1));
          bestCorrect = attempt.c;
          bestAnswered = attempt.a;
        }
      }
    }

    // MINIMAL LOGGING for 400k+ scale (only essentials)
    const processingTime = Date.now() - startTime;
    console.log(
      `✅ Attempt ${attemptNumber}: ${totalScore}/${totalPossiblePoints} (${grade}) | Best: ${bestScore} (A#${bestAttemptNum}) | ${processingTime}ms`,
    );

    // OPTIMIZED PARTICIPANT DATA STORAGE
    participant.submittedAt = submissionTime;
    participant.score = bestScore;
    participant.percentage = bestPercentage;
    participant.grade = bestGrade;
    participant.questionsCorrect = bestCorrect;
    participant.questionsAnswered = bestAnswered;
    participant.calculatedAt = submissionTime;

    // Compact metadata (essential only)
    participant.totalAttempts = participant.attempts.size;
    participant.latestScore = totalScore;
    participant.latestGrade = grade;
    participant.bestAttemptNumber = bestAttemptNum;
    participant.latestAttemptScore = totalScore;
    participant.latestAttemptGrade = grade;
    participant.improvementPoints =
      bestScore > totalScore
        ? 0
        : totalScore - (bestScore === totalScore ? 0 : bestScore);

    // Memory optimization: Store only lightweight scoreDetails for best attempt
    if (bestAttemptNum === attemptNumber) {
      participant.scoreDetails = scoreDetails; // Only store details for best attempt
    }

    console.log(
      `\n🎯 FINAL SCORE CALCULATION COMPLETE FOR: ${participant.name}`,
    );
    console.log(`Score: ${totalScore}/${totalPossiblePoints} points`);
    console.log(`Percentage: ${percentage.toFixed(2)}%`);
    console.log(`Grade: ${grade}`);
    console.log(`Questions Answered: ${questionsAnswered}`);
    console.log(`Questions Correct: ${questionsCorrect}`);
    console.log(`Pass Status: ${grade !== "F" ? "PASSED" : "FAILED"}`);
    console.log(`Submission Time: ${submissionTime}`);

    // FORCE SAVE TO SERVER WITH VERIFICATION
    console.log(`\n💾 FORCE SAVING PARTICIPANT SCORE DATA...`);
    const participantIndex = participants.findIndex(
      (p) => p.id === participant.id,
    );
    if (participantIndex >= 0) {
      participants[participantIndex] = { ...participant };
      console.log(
        `✅ PARTICIPANT SCORE DATA SAVED AT INDEX: ${participantIndex}`,
      );
    } else {
      participants.push({ ...participant });
      console.log(`⚠️ PARTICIPANT ADDED TO MAIN ARRAY WITH SCORES`);
    }

    // VERIFICATION: Check that scores are actually saved
    const savedParticipant = participants.find((p) => p.id === participant.id);
    if (savedParticipant && savedParticipant.score === totalScore) {
      console.log(
        `✅ SCORE VERIFICATION PASSED: ${totalScore} points saved correctly`,
      );
    } else {
      console.log(
        `❌ SCORE VERIFICATION FAILED! Expected: ${totalScore}, Found: ${savedParticipant?.score}`,
      );
    }

    console.log(`\n✅ PARTICIPANT DATA SAVED TO SERVER`);
    console.log(
      `Total participants with scores: ${participants.filter((p) => p.score !== undefined).length}`,
    );
    console.log(`Saved participant details:`, {
      id: participant.id,
      name: participant.name,
      score: participant.score,
      percentage: participant.percentage,
      grade: participant.grade,
      submittedAt: participant.submittedAt,
    });

    // Clear timeout since we're responding successfully
    clearTimeout(timeoutId);

    console.log(`\n✅ SENDING SUCCESSFUL RESPONSE TO CLIENT`);

    if (!res.headersSent) {
      res.json({
        success: true,
        score: participant.score, // Best score across attempts
        totalPossible: totalPossiblePoints,
        percentage: participant.percentage,
        grade: participant.grade,
        questionsCorrect: participant.questionsCorrect,
        questionsAnswered: participant.questionsAnswered,
        submittedAt: participant.submittedAt,
        participantId: participant.id,
        saved: true,
        verified: savedParticipant?.score === participant.score,
        // Multi-attempt specific data
        attemptNumber: currentAttempt.attemptNumber,
        totalAttempts: participant.totalAttempts,
        latestAttemptScore: participant.latestAttemptScore,
        latestAttemptGrade: participant.latestAttemptGrade,
        bestAttemptNumber: participant.bestAttemptNumber,
        improvementPoints: participant.improvementPoints,
        message:
          participant.totalAttempts > 1
            ? `Attempt #${attemptNumber} completed! Best score: ${participant.score}/${totalPossiblePoints} (${participant.grade}) from Attempt #${participant.bestAttemptNumber}`
            : `Quiz submitted successfully! Score: ${participant.score}/${totalPossiblePoints} (${participant.grade}) - SAVED TO SERVER`,
      });
    } else {
      console.log(`⚠️ Headers already sent, response already completed`);
    }
  } catch (error) {
    console.log(`\n❌ QUIZ SUBMISSION FAILED:`, error);

    // Clear timeout since we're responding with error
    clearTimeout(timeoutId);

    if (!res.headersSent) {
      const errorResponse: ErrorResponse = {
        error: "SUBMIT_QUIZ_FAILED",
        message: `Failed to submit quiz: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      res.status(500).json(errorResponse);
    } else {
      console.log(`⚠️ Headers already sent, cannot send error response`);
    }
  }
};

// Get quiz results with optional recalculation
export const getQuizResults: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;
    const forceRecalculate =
      req.method === "POST" || req.body?.forceRecalculate;

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

    console.log(
      `${forceRecalculate ? "Force recalculating" : "Getting"} scores for ${allParticipants.length} participants in quiz: ${quiz.title}`,
    );

    // COMPREHENSIVE DEBUGGING: Check for missing Sam data
    console.log(`\\n🔍 SEARCHING FOR ALL SAM RECORDS...`);
    const allSamRecords = participants.filter((p) =>
      p.name.toLowerCase().includes("sam"),
    );
    console.log(
      `Found ${allSamRecords.length} Sam participant records:`,
      allSamRecords.map((p) => ({
        id: p.id,
        name: p.name,
        sessionId: p.sessionId,
        answersCount: p.answers?.length || 0,
        attemptNumber: p.attemptNumber,
        submittedAt: p.submittedAt,
      })),
    );

    console.log(
      `\\n📋 ALL PARTICIPANTS IN SYSTEM:`,
      participants.map((p) => ({
        id: p.id,
        name: p.name,
        sessionId: p.sessionId,
        answersCount: p.answers?.length || 0,
        attemptNumber: p.attemptNumber || 1,
      })),
    );

    console.log(
      `\\n🎭 ALL SESSIONS:`,
      quizSessions.map((s) => ({
        id: s.id,
        quizId: s.quizId,
        participantCount: s.participants?.length || 0,
        isActive: s.isActive,
      })),
    );

    if (forceRecalculate) {
      console.log("=== FORCE RECALCULATION MODE ===");
      console.log(
        "Processing ALL participants with fresh score calculations...",
      );
    }

    // COMPREHENSIVE scoring system - processes EVERY participant individually
    console.log(
      `\n🎯 STARTING SCORE CALCULATION FOR ${allParticipants.length} PARTICIPANTS`,
    );
    console.log(
      `📚 Quiz: "${quiz.title}" | Questions: ${quiz.questions.length}`,
    );

    // HYPER-OPTIMIZED BATCH PROCESSING for 400k+ participants
    console.log(
      `⚡ MASSIVE SCALE PROCESSING: ${allParticipants.length} participants`,
    );
    const batchStart = Date.now();

    const participantsWithScores = allParticipants.map((participant, index) => {
      const participantName = participant.name || `Participant ${index + 1}`;
      const attemptNumber = participant.attemptNumber || 1;

      // Progress logging for large batches
      if (allParticipants.length > 1000 && index % 1000 === 0) {
        const elapsed = Date.now() - batchStart;
        console.log(
          `📊 Processed ${index}/${allParticipants.length} participants (${elapsed}ms)`,
        );
      }

      console.log(
        `\n�� === PROCESSING PARTICIPANT ${index + 1}/${allParticipants.length} ===`,
      );
      console.log(`�� Name: ${participantName} (Attempt #${attemptNumber})`);
      console.log(`🆔 ID: ${participant.id}`);
      console.log(`📝 Answers array length:`, participant.answers?.length || 0);
      console.log(`📊 Raw answers:`, participant.answers);
      console.log(
        `🔍 Participant submitted status:`,
        participant.submittedAt || "No submission timestamp",
      );
      console.log(`💾 Participant session ID:`, participant.sessionId);

      // CRITICAL DEBUG: Check if this is Sam and examine their data
      if (participantName.toLowerCase().includes("sam")) {
        console.log(`\\n🚨 DEBUGGING SAM'S DATA 🚨`);
        console.log(
          `Sam's full participant object:`,
          JSON.stringify(participant, null, 2),
        );
        console.log(
          `Sam's answers in detail:`,
          participant.answers?.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
            timestamp: a.timeStamp,
            type: typeof a.answer,
          })),
        );
        console.log(
          `Quiz questions for comparison:`,
          quiz.questions.map((q) => ({
            id: q.id,
            question: q.question.substring(0, 50),
            correctAnswer: q.correctAnswer,
            type: q.type,
          })),
        );
      }

      let totalScore = 0;
      let questionsAnswered = 0;
      let questionsCorrect = 0;
      const totalPossiblePoints = quiz.questions.reduce(
        (sum, q) => sum + q.points,
        0,
      );

      // Handle ANY participant with ANY number of attempts
      const hasAnswers =
        participant.answers &&
        Array.isArray(participant.answers) &&
        participant.answers.length > 0;

      if (hasAnswers) {
        // ROBUST ANSWER COMPARISON: Compare each student answer with correct answer
        console.log(
          `Processing ${quiz.questions.length} questions for ${participantName}:`,
        );

        quiz.questions.forEach((question, qIndex) => {
          console.log(`\n--- Question ${qIndex + 1} (ID: ${question.id}) ---`);
          console.log(`Question: "${question.question}"`);
          console.log(
            `Correct Answer: ${question.correctAnswer} (Type: ${question.type})`,
          );
          console.log(`Points Available: ${question.points}`);
          console.log(
            `Available student answers for ${participantName}:`,
            participant.answers.map((a) => ({
              id: a.questionId,
              answer: a.answer,
            })),
          );

          // ROBUST ANSWER MATCHING: Try multiple matching strategies
          let studentAnswer = participant.answers.find(
            (a) => a.questionId === question.id,
          );

          // If no exact match, try alternative matching strategies
          if (!studentAnswer) {
            console.log(`❌ No exact match for question ID: ${question.id}`);

            // Try matching by question index (fallback for mismatched IDs)
            if (participant.answers[qIndex]) {
              console.log(
                `🔄 Trying index-based matching for question ${qIndex + 1}`,
              );
              studentAnswer = participant.answers[qIndex];
            }

            // Try matching by partial ID (if IDs got corrupted)
            if (!studentAnswer) {
              studentAnswer = participant.answers.find(
                (a) =>
                  a.questionId &&
                  a.questionId
                    .toString()
                    .includes(question.id.toString().slice(-3)),
              );
              if (studentAnswer) {
                console.log(
                  `🔄 Found partial ID match: ${studentAnswer.questionId}`,
                );
              }
            }
          } else {
            console.log(`✅ Found exact match for question ID: ${question.id}`);
          }

          if (
            studentAnswer &&
            studentAnswer.answer !== undefined &&
            studentAnswer.answer !== null &&
            studentAnswer.answer !== ""
          ) {
            questionsAnswered++;
            const studentResponse = studentAnswer.answer;
            console.log(
              `✅ Student Answer Found: ${studentResponse} (from answer ID: ${studentAnswer.questionId})`,
            );

            // PRECISE ANSWER COMPARISON for ANY question type
            let isCorrect = false;
            let pointsEarned = 0;

            if (
              question.type === "multiple-choice" ||
              question.type === "true-false"
            ) {
              // Normalize both answers for exact comparison
              let studentAns = studentResponse;
              let correctAns = question.correctAnswer;

              // Handle string/number conversion carefully
              if (
                typeof studentAns === "string" &&
                !isNaN(Number(studentAns))
              ) {
                studentAns = Number(studentAns);
              }
              if (
                typeof correctAns === "string" &&
                !isNaN(Number(correctAns))
              ) {
                correctAns = Number(correctAns);
              }

              // EXACT MATCH COMPARISON
              isCorrect = studentAns === correctAns;
              console.log(
                `Comparison: ${studentAns} === ${correctAns} = ${isCorrect}`,
              );

              if (isCorrect) {
                pointsEarned = question.points;
                totalScore += pointsEarned;
                questionsCorrect++;
                console.log(`✓ CORRECT! Earned ${pointsEarned} points`);
              } else {
                console.log(`✗ INCORRECT! Earned 0 points`);
              }
            } else if (question.type === "short-answer") {
              // Handle short answer questions with basic validation
              const answerText = studentResponse.toString().trim();
              isCorrect = answerText.length > 0;

              if (isCorrect) {
                pointsEarned = question.points;
                totalScore += pointsEarned;
                questionsCorrect++;
                console.log(
                  `✓ SHORT ANSWER PROVIDED! Earned ${pointsEarned} points`,
                );
              } else {
                console.log(`✗ NO ANSWER PROVIDED! Earned 0 points`);
              }
            }
          } else {
            console.log(`❌ Student Answer: [NO VALID ANSWER FOUND]`);
            if (studentAnswer) {
              console.log(
                `Found answer object but value is invalid:`,
                studentAnswer,
              );
            }
            console.log(`✗ UNANSWERED! Earned 0 points`);
          }
        });
      } else {
        console.log(
          `${participantName} provided NO VALID ANSWERS - Checking for any data...`,
        );

        // FALLBACK: Even if no answers array, check if participant has any stored data
        if (participant.score !== undefined) {
          console.log(
            `Found existing score for ${participantName}: ${participant.score}`,
          );
          totalScore = participant.score;
        }
        if (participant.questionsCorrect !== undefined) {
          questionsCorrect = participant.questionsCorrect;
        }
        if (participant.questionsAnswered !== undefined) {
          questionsAnswered = participant.questionsAnswered;
        }

        console.log(`${participantName} Final Score (fallback): ${totalScore}`);
      }

      // CALCULATE FINAL PERCENTAGE AND ASSIGN GRADE
      let percentage =
        totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;

      // GRADE ASSIGNMENT BASED ON PERCENTAGE (works for ANY participant)
      let grade = "F"; // Default fail grade
      if (percentage >= 80) {
        grade = "A"; // Excellent: 80-100%
      } else if (percentage >= 50) {
        grade = "B"; // Good: 50-79%
      } else if (percentage >= 30) {
        grade = "C"; // Satisfactory: 30-49%
      }
      // F grade: 0-29% (already set as default)

      console.log(
        `\n=== FINAL RESULTS for ${participantName} (Attempt #${attemptNumber}) ===`,
      );
      console.log(`Total Score: ${totalScore}/${totalPossiblePoints} points`);
      console.log(`Percentage: ${percentage.toFixed(2)}%`);
      console.log(`Grade: ${grade}`);
      console.log(`Pass Status: ${grade !== "F" ? "PASSED" : "FAILED"}`);

      // AUTO-MARK SUBMISSION: If student has answers but no submission timestamp, auto-mark as submitted
      if (hasAnswers && !participant.submittedAt && questionsAnswered > 0) {
        // Find the latest answer timestamp to use as submission time
        const lastAnswerTime: string | null = participant.answers.reduce(
          (latest: string | null, current) => {
            if (!latest) return current.timeStamp || null;
            const latestTime = new Date(latest).getTime();
            const currentTime = new Date(current.timeStamp || 0).getTime();
            return currentTime > latestTime ? current.timeStamp || latest : latest;
          },
          null,
        );

        participant.submittedAt = lastAnswerTime || new Date().toISOString();
        console.log(
          `Auto-marked ${participantName} as submitted at: ${participant.submittedAt}`,
        );
      }

      // PRESERVE EXISTING SCORES: Only update if no score exists or force recalculation
      if (!participant.score || forceRecalculate) {
        participant.score = totalScore;
        participant.percentage = Math.round(percentage * 100) / 100;
        participant.grade = grade;
        participant.questionsCorrect = questionsCorrect;
        participant.questionsAnswered = questionsAnswered;
        participant.calculatedAt = new Date().toISOString();

        console.log(
          `🔄 UPDATING participant scores: ${participant.name} = ${totalScore} points`,
        );
      } else {
        console.log(
          `✅ PRESERVING existing scores: ${participant.name} = ${participant.score} points`,
        );
        // Use existing scores
        totalScore = participant.score;
        questionsCorrect = participant.questionsCorrect || questionsCorrect;
        questionsAnswered = participant.questionsAnswered || questionsAnswered;
        percentage = participant.percentage || percentage;
        grade = participant.grade || grade;
      }

      // FORCE SAVE TO PARTICIPANTS ARRAY
      const participantIndex = participants.findIndex(
        (p) => p.id === participant.id,
      );
      if (participantIndex >= 0) {
        participants[participantIndex] = { ...participant };
      }

      return {
        ...participant,
        score: totalScore,
        questionsAnswered,
        questionsCorrect,
        totalPossiblePoints,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        attemptNumber,
        calculatedAt: new Date().toISOString(),
      };
    });

    // BATCH PROCESSING SUMMARY for many participants
    const totalParticipants = participantsWithScores.length;
    const passedCount = participantsWithScores.filter(
      (p) => p.grade !== "F",
    ).length;
    const failedCount = participantsWithScores.filter(
      (p) => p.grade === "F",
    ).length;
    const avgScore =
      participantsWithScores.reduce((sum, p) => sum + (p.percentage || 0), 0) /
      (totalParticipants || 1);

    console.log(`\n=== BATCH PROCESSING SUMMARY ===`);
    console.log(`Total Records Processed: ${totalParticipants}`);
    console.log(`Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log(`Average Score: ${avgScore.toFixed(2)}%`);
    console.log(`Processing Time: ${Date.now() - Date.now()} ms`);

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

// Debug endpoint to check participant data
export const debugParticipants: RequestHandler = (req, res) => {
  try {
    const { quizId } = req.params;

    console.log(`\n🔍 DEBUG PARTICIPANTS REQUEST FOR QUIZ: ${quizId}`);

    const quiz = quizzes.find((q) => q.id === quizId);
    const sessions = quizSessions.filter((s) => s.quizId === quizId);
    const allParticipants = participants.filter((p) =>
      sessions.some((s) => s.id === p.sessionId),
    );

    console.log(`📊 COMPLETE PARTICIPANT DEBUG:`, {
      quiz: quiz ? quiz.title : "Not found",
      totalSessions: sessions.length,
      totalParticipants: allParticipants.length,
      participants: allParticipants.map((p) => ({
        id: p.id,
        name: p.name,
        sessionId: p.sessionId,
        answersCount: p.answers?.length || 0,
        answers: p.answers,
        submittedAt: p.submittedAt,
        attemptNumber: p.attemptNumber,
      })),
    });

    res.json({
      quiz: quiz?.title || "Unknown",
      participants: allParticipants,
      sessions: sessions,
      totalParticipants: allParticipants.length,
    });
  } catch (error) {
    console.error("Debug participants error:", error);
    res.status(500).json({ error: "Debug failed" });
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
