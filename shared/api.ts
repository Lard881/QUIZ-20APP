/**
 * Shared code between client and server
 * Types and interfaces for the Quiz Management System
 */

export interface Quiz {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  timeLimit: number; // in minutes
  questions: QuizQuestion[];
  roomCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[]; // for multiple choice
  correctAnswer: string | number; // index for multiple choice, text for others
  points: number;
}

export interface QuizSession {
  id: string;
  quizId: string;
  participants: QuizParticipant[];
  startTime: string;
  endTime?: string;
  isActive: boolean;
}

export interface QuizParticipant {
  id: string;
  name: string;
  sessionId: string;
  answers: QuizAnswer[];
  score?: number;
  submittedAt?: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number;
  timeStamp: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  quizzes: string[]; // quiz IDs
}

// API Response Types
export interface CreateQuizRequest {
  title: string;
  description: string;
  timeLimit: number;
  questions: Omit<QuizQuestion, 'id'>[];
}

export interface CreateQuizResponse {
  quiz: Quiz;
  success: boolean;
}

export interface JoinQuizRequest {
  roomCode: string;
  participantName: string;
}

export interface JoinQuizResponse {
  sessionId: string;
  quiz: Omit<Quiz, 'questions'>;
  success: boolean;
}

export interface StartQuizResponse {
  quiz: Quiz;
  sessionId: string;
  timeRemaining: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string | number;
}

export interface QuizResultsResponse {
  participants: QuizParticipant[];
  quiz: Quiz;
  averageScore: number;
}

export interface GetQuizzesResponse {
  quizzes: Quiz[];
}

export interface ErrorResponse {
  error: string;
  message: string;
}
