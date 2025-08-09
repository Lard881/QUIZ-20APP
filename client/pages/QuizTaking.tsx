import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Quiz,
  QuizAnswer,
  SubmitAnswerRequest,
  StartQuizResponse,
} from "@shared/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuizTaking() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  useEffect(() => {
    if (sessionId) {
      startQuiz();
    }
  }, [sessionId]);

  // Handle page visibility changes to pause/resume timer efficiently
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, save current progress
        if (quiz && currentQuestionIndex >= 0) {
          const currentQuestion = quiz.questions[currentQuestionIndex];
          if (currentQuestion && answers[currentQuestion.id] !== undefined) {
            saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
          }
        }
      }
    };

    const handleBeforeUnload = () => {
      // Save progress before page unload
      if (quiz && currentQuestionIndex >= 0) {
        const currentQuestion = quiz.questions[currentQuestionIndex];
        if (currentQuestion && answers[currentQuestion.id] !== undefined) {
          // Use sendBeacon for reliable background requests
          const answerData = {
            sessionId,
            questionId: currentQuestion.id,
            answer: answers[currentQuestion.id],
          };

          navigator.sendBeacon("/api/quiz/answer", JSON.stringify(answerData));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quiz, currentQuestionIndex, answers, sessionId]);

  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizCompleted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Auto-submit when time runs out
          if (newTime <= 0) {
            handleAutoSubmit();
            return 0;
          }

          // Auto-save current answer every 10 seconds if there's an active answer
          if (newTime % 10 === 0 && quiz) {
            const currentQuestion = quiz.questions[currentQuestionIndex];
            if (currentQuestion && answers[currentQuestion.id] !== undefined) {
              saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
            }
          }

          return newTime;
        });
      }, 1000);
    } else {
      // Clear timer when quiz is not active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quizStarted, quizCompleted]);

  const startQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/session/${sessionId}/start`);

      if (response.ok) {
        const data = (await response.json()) as StartQuizResponse;

        // Randomize questions if enabled
        let questionsToUse = [...data.quiz.questions];
        if (data.quiz.randomizeQuestions) {
          questionsToUse = questionsToUse.sort(() => Math.random() - 0.5);
        }

        const quizWithRandomizedQuestions = {
          ...data.quiz,
          questions: questionsToUse,
        };

        setQuiz(quizWithRandomizedQuestions);
        setTimeRemaining(data.timeRemaining);
        setQuizStarted(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Cannot Start Quiz",
          description:
            errorData.message || "Quiz session not found or has expired",
          variant: "destructive",
        });
        navigate("/student");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to quiz. Please check your connection.",
        variant: "destructive",
      });
      navigate("/student");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    console.log(`🎯 Answer changed: Q${questionId} = ${answer}`);

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Immediate save for manual changes (bypass debouncing)
    lastSaveRef.current = 0; // Reset to allow immediate save

    // Small delay to ensure state is updated before save
    setTimeout(() => {
      saveAnswer(questionId, answer);
    }, 100);
  };

  const saveAnswer = async (questionId: string, answer: string | number) => {
    if (!sessionId) {
      console.error('❌ No sessionId available for answer submission');
      return;
    }

    // Skip empty answers
    if (answer === undefined || answer === null || answer === '') {
      console.log(`⚠️ Skipping empty answer for question ${questionId}`);
      return;
    }

    // Debouncing: only save if enough time has passed since last save
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;

    // Minimum 1 second between auto-saves, immediate for manual saves
    if (timeSinceLastSave < 1000) {
      console.log(`⏰ Debouncing answer save for question ${questionId}`);
      return;
    }

    try {
      lastSaveRef.current = now;
      console.log(`📤 SUBMITTING ANSWER: Q${questionId} = ${answer} (SessionID: ${sessionId})`);

      const answerData: SubmitAnswerRequest = {
        sessionId,
        questionId,
        answer,
      };

      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(answerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Answer submission failed: ${response.status} ${response.statusText}`);
        console.error(`Response body:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Answer saved successfully:`, result);

      // Show success feedback to user
      if (result.success) {
        toast({
          title: "Answer Saved",
          description: `Question ${questionId.split('_').pop()} answer recorded`,
          duration: 1000,
        });
      }

    } catch (error) {
      console.error(`❌ CRITICAL: Failed to save answer for question ${questionId}:`, error);

      // Show error to user
      toast({
        title: "Answer Save Failed",
        description: `Failed to save answer for question ${questionId.split('_').pop()}. Please try again.`,
        variant: "destructive",
        duration: 3000,
      });

      // Reset the save timer on error to allow immediate retry
      lastSaveRef.current = now - 2000;
    }
  };

  const handleAutoSubmit = () => {
    toast({
      title: "Time's Up!",
      description: "Quiz has been automatically submitted",
      variant: "destructive",
    });
    submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    console.log(`🎯 STARTING QUIZ SUBMISSION for session: ${sessionId}`);

    try {
      // Force save all answers before final submission
      if (quiz && sessionId) {
        console.log(`💾 Force saving all ${Object.keys(answers).length} answers before submission...`);

        const savePromises = [];
        for (const question of quiz.questions) {
          if (answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '') {
            console.log(`💾 Force saving Q${question.id} = ${answers[question.id]}`);
            // Force immediate save by resetting debounce timer
            lastSaveRef.current = 0;
            savePromises.push(saveAnswer(question.id, answers[question.id]));
          }
        }

        // Wait for all answers to be saved
        await Promise.all(savePromises);
        console.log(`✅ All answers force-saved before submission`);

        // Additional delay to ensure backend processes all saves
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Submit quiz for auto-scoring with comprehensive error handling
      console.log(`📤 Submitting quiz to backend...`);
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Quiz submission failed: ${response.status} ${response.statusText}`);
        console.error(`Response body:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Quiz submitted successfully:`, data);

      setQuizCompleted(true);
      toast({
        title: "Quiz Submitted Successfully!",
        description: `Your score: ${data.score || 0}/${data.totalPossible || 0} points (${data.grade || 'N/A'}). Results calculated automatically.`,
      });

      // Redirect after a delay
      setTimeout(() => {
        navigate("/student");
      }, 3000);
    } catch (error) {
      console.error(`❌ CRITICAL: Quiz submission failed:`, error);
      toast({
        title: "Submission Error",
        description: `Failed to submit quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeProgress = (): number => {
    if (!quiz) return 0;
    const totalSeconds = quiz.timeLimit * 60;
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };

  const getTimerColor = (): string => {
    if (timeRemaining <= 60) return "text-destructive"; // Last minute - red
    if (timeRemaining <= 300) return "text-quiz-timer"; // Last 5 minutes - orange
    return "text-foreground"; // Normal - default color
  };

  const getProgressColor = (): string => {
    if (timeRemaining <= 60) return "bg-destructive";
    if (timeRemaining <= 300) return "bg-quiz-timer";
    return "bg-primary";
  };

  const isAnswered = (questionId: string): boolean => {
    return answers[questionId] !== undefined && answers[questionId] !== "";
  };

  const getAnsweredCount = (): number => {
    if (!quiz) return 0;
    return quiz.questions.filter((q) => isAnswered(q.id)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-quiz-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-quiz-success" />
            </div>
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            <CardDescription>
              Your answers have been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 text-sm">
                <p>
                  <strong>Quiz:</strong> {quiz?.title}
                </p>
                <p>
                  <strong>Questions Answered:</strong> {getAnsweredCount()} /{" "}
                  {quiz?.questions.length}
                </p>
              </div>
              <p className="text-muted-foreground">
                Redirecting to student portal in a few seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The quiz session could not be loaded.
            </p>
            <Button onClick={() => navigate("/student")}>
              Return to Student Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Timer */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
              <div className="w-6 h-6 md:w-8 md:h-8 quiz-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                  {quiz.title}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <div className="text-right">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Clock
                    className={`w-3 h-3 md:w-4 md:h-4 ${getTimerColor()}`}
                  />
                  <span
                    className={`text-sm md:text-base font-mono font-semibold ${getTimerColor()} ${timeRemaining <= 60 ? "animate-pulse" : ""}`}
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="w-16 md:w-24 mt-1">
                  <Progress value={getTimeProgress()} className="h-1" />
                </div>
                {timeRemaining <= 60 && (
                  <p className="text-xs text-destructive mt-1 font-medium hidden md:block">
                    Time running out!
                  </p>
                )}
              </div>

              <Badge
                variant="outline"
                className="text-xs md:text-sm hidden sm:inline-flex"
              >
                {getAnsweredCount()} / {quiz.questions.length}
              </Badge>
              <Badge variant="outline" className="text-xs sm:hidden">
                {getAnsweredCount()}/{quiz.questions.length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Question Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <Badge variant="secondary">{currentQuestion.points} pts</Badge>
            </div>
            <CardDescription className="text-base">
              {currentQuestion.question}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === "multiple-choice" &&
              currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString() || ""}
                  onValueChange={(value) =>
                    handleAnswerChange(currentQuestion.id, parseInt(value))
                  }
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

            {currentQuestion.type === "true-false" && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ""}
                onValueChange={(value) =>
                  handleAnswerChange(currentQuestion.id, parseInt(value))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === "short-answer" && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id]?.toString() || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                className="min-h-[100px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Question indicators */}
          <div className="flex flex-wrap justify-center space-x-1 md:space-x-2 order-2 md:order-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full text-xs font-medium transition-all ${
                  index === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : isAnswered(quiz.questions[index].id)
                      ? "bg-quiz-success text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-4 w-full md:w-auto order-1 md:order-1">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="flex-1 md:flex-none"
              size="sm"
            >
              Previous
            </Button>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto order-3 md:order-3">
            {isLastQuestion ? (
              <Button
                onClick={submitQuiz}
                disabled={submitting}
                className="bg-quiz-success hover:bg-quiz-success/90 flex-1 md:flex-none"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      quiz.questions.length - 1,
                      currentQuestionIndex + 1,
                    ),
                  )
                }
                className="flex-1 md:flex-none"
                size="sm"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
