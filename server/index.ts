import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getQuizzes,
  createQuiz,
  joinQuiz,
  startQuiz,
  submitAnswer,
  getQuizResults,
  updateQuizStatus
} from "./routes/quiz";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Quiz Management API Routes
  app.get("/api/quizzes", getQuizzes);
  app.post("/api/quiz", createQuiz);
  app.post("/api/quiz/join", joinQuiz);
  app.get("/api/quiz/session/:sessionId/start", startQuiz);
  app.post("/api/quiz/answer", submitAnswer);
  app.get("/api/quiz/:quizId/results", getQuizResults);
  app.patch("/api/quiz/:quizId/status", updateQuizStatus);

  return app;
}
