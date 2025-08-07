import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CreateQuiz from "./pages/CreateQuiz";
import StudentAccess from "./pages/StudentAccess";
import QuizTaking from "./pages/QuizTaking";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quiz/create" element={<CreateQuiz />} />
          <Route path="/quiz/:id/edit" element={<PlaceholderPage pageName="Quiz Edit" />} />
          <Route path="/quiz/:id/manage" element={<PlaceholderPage pageName="Quiz Management" />} />
          <Route path="/student" element={<StudentAccess />} />
          <Route path="/quiz/:sessionId/take" element={<PlaceholderPage pageName="Quiz Taking" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
