import "./global.css";
import React from "react";

// Suppress ResizeObserver warnings in console
if (typeof window !== 'undefined') {
  const originalError = window.console.error;
  window.console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver loop completed')) {
      return;
    }
    originalError(...args);
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CreateQuiz from "./pages/CreateQuiz";
import StudentAccess from "./pages/StudentAccess";
import QuizTaking from "./pages/QuizTaking";
import QuizManagement from "./pages/QuizManagement";
import Settings from "./pages/Settings";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quiz/create" element={<CreateQuiz />} />
            <Route path="/quiz/:id/edit" element={<PlaceholderPage pageName="Quiz Edit" />} />
            <Route path="/quiz/:id/manage" element={<QuizManagement />} />
            <Route path="/settings" element={<PlaceholderPage pageName="Account Settings" />} />
            <Route path="/student" element={<StudentAccess />} />
            <Route path="/quiz/:sessionId/take" element={<QuizTaking />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
