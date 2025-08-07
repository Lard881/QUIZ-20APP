import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Quiz, QuizAnswer, SubmitAnswerRequest, StartQuizResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, CheckCircle, AlertTriangle, BookOpen, Send } from "lucide-react";
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

  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizCompleted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
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
      const data = (await response.json()) as StartQuizResponse;
      
      setQuiz(data.quiz);
      setTimeRemaining(data.timeRemaining);
      setQuizStarted(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quiz",
        variant: "destructive"
      });
      navigate("/student");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Auto-save answer
    saveAnswer(questionId, answer);
  };

  const saveAnswer = async (questionId: string, answer: string | number) => {
    if (!sessionId) return;

    try {
      const answerData: SubmitAnswerRequest = {
        sessionId,
        questionId,
        answer
      };

      await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answerData)
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleAutoSubmit = () => {
    toast({
      title: "Time's Up!",
      description: "Quiz has been automatically submitted",
      variant: "destructive"
    });
    submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      // Final save of all answers
      if (quiz && sessionId) {
        for (const question of quiz.questions) {
          if (answers[question.id] !== undefined) {
            await saveAnswer(question.id, answers[question.id]);
          }
        }
      }

      setQuizCompleted(true);
      toast({
        title: "Quiz Submitted!",
        description: "Your answers have been recorded successfully"
      });
      
      // Redirect after a delay
      setTimeout(() => {
        navigate("/student");
      }, 3000);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeProgress = (): number => {
    if (!quiz) return 0;
    const totalSeconds = quiz.timeLimit * 60;
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };

  const isAnswered = (questionId: string): boolean => {
    return answers[questionId] !== undefined && answers[questionId] !== '';
  };

  const getAnsweredCount = (): number => {
    if (!quiz) return 0;
    return quiz.questions.filter(q => isAnswered(q.id)).length;
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
                <p><strong>Quiz:</strong> {quiz?.title}</p>
                <p><strong>Questions Answered:</strong> {getAnsweredCount()} / {quiz?.questions.length}</p>
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 quiz-gradient rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{quiz.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${timeRemaining < 300 ? 'text-quiz-timer' : 'text-muted-foreground'}`} />
                  <span className={`font-mono font-semibold ${timeRemaining < 300 ? 'text-quiz-timer' : 'text-foreground'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="w-24 mt-1">
                  <Progress 
                    value={getTimeProgress()} 
                    className={`h-1 ${timeRemaining < 300 ? 'text-quiz-timer' : ''}`}
                  />
                </div>
              </div>
              
              <Badge variant="outline">
                {getAnsweredCount()} / {quiz.questions.length} answered
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
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'true-false' && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === 'short-answer' && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id]?.toString() || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[100px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : isAnswered(quiz.questions[index].id)
                    ? 'bg-quiz-success text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button 
              onClick={submitQuiz} 
              disabled={submitting}
              className="bg-quiz-success hover:bg-quiz-success/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
