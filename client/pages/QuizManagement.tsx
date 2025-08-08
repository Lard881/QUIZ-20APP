import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Quiz,
  QuizSession,
  QuizParticipant,
  UpdateQuizRequest,
} from "@shared/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Square,
  Users,
  Clock,
  Settings,
  QrCode,
  BarChart3,
  RefreshCw,
  Shuffle,
  AlertTriangle,
  CheckCircle,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuizManagement() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { instructor } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Quiz settings state
  const [allowRetries, setAllowRetries] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "days">("days");

  useEffect(() => {
    if (!instructor) {
      navigate("/auth/login");
      return;
    }
    if (!quizId) {
      toast({
        title: "Error",
        description: "No quiz ID provided",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    fetchQuizData();
  }, [instructor, quizId, navigate]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details with minimal headers first
      const quizResponse = await fetch(`/api/quiz/${quizId}`);

      if (quizResponse.ok) {
        const quizData = await quizResponse.json();
        if (quizData.quiz) {
          setQuiz(quizData.quiz);
          setAllowRetries(quizData.quiz.allowRetries || false);
          setRandomizeQuestions(quizData.quiz.randomizeQuestions || false);
          setMaxAttempts(quizData.quiz.maxAttempts || 1);
          setDurationValue(quizData.quiz.durationValue || 30);
          setDurationUnit(quizData.quiz.durationUnit || "days");
        } else {
          throw new Error("Invalid quiz data received");
        }
      } else {
        const errorData = await quizResponse
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message ||
            `HTTP ${quizResponse.status}: ${quizResponse.statusText}`,
        );
      }

      // Fetch quiz results/participants
      try {
        const resultsResponse = await fetch(`/api/quiz/${quizId}/results`);

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          console.log("Quiz results data received:", resultsData);
          console.log("Participants data:", resultsData.participants);
          setParticipants(resultsData.participants || []);
        } else {
          // Results endpoint failure is not critical, just log it
          console.warn(
            "Could not fetch quiz results:",
            resultsResponse.statusText,
          );
        }
      } catch (resultsError) {
        console.warn("Error fetching quiz results:", resultsError);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load quiz data",
        variant: "destructive",
      });

      // Navigate back to dashboard on critical errors
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const updateQuizSettings = async () => {
    if (!quiz) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("quiz_token");
      const updateData: UpdateQuizRequest = {
        allowRetries,
        randomizeQuestions,
        maxAttempts,
        durationValue,
        durationUnit,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quiz/${quiz.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.quiz) {
          setQuiz(responseData.quiz);
          toast({
            title: "Settings Updated",
            description: "Quiz settings have been saved successfully",
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error updating quiz settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update quiz settings",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleQuizStatus = async () => {
    if (!quiz) return;

    try {
      const token = localStorage.getItem("quiz_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quiz/${quiz.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: !quiz.isActive }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.quiz) {
          setQuiz(responseData.quiz);
        } else {
          setQuiz({ ...quiz, isActive: !quiz.isActive });
        }

        toast({
          title: quiz.isActive ? "Quiz Stopped" : "Quiz Started",
          description: quiz.isActive
            ? "The quiz has been deactivated"
            : "The quiz is now live and accepting participants",
        });
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to update quiz status`);
      }
    } catch (error) {
      console.error("Error updating quiz status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update quiz status",
        variant: "destructive",
      });
    }
  };

  const copyRoomCode = () => {
    if (quiz) {
      navigator.clipboard.writeText(quiz.roomCode);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    }
  };

  const generateQRCode = () => {
    if (!quiz) return "";
    const baseUrl = window.location.origin;
    const studentUrl = `${baseUrl}/student?code=${quiz.roomCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentUrl)}`;
  };

  // Analytics helper functions
  const calculateStudentScore = (
    participant: QuizParticipant,
  ): { score: number; details: any[] } => {
    if (!quiz) return { score: 0, details: [] };

    let totalScore = 0;
    const details: any[] = [];

    quiz.questions.forEach((question) => {
      const studentAnswer = participant.answers.find(
        (a) => a.questionId === question.id,
      );
      let isCorrect = false;
      let pointsEarned = 0;

      if (studentAnswer) {
        console.log(`  Question ${question.id}: Student answered ${studentAnswer.answer}, correct is ${question.correctAnswer}`);

        if (
          question.type === "multiple-choice" ||
          question.type === "true-false"
        ) {
          // Handle both string and number answers
          const studentAns = typeof studentAnswer.answer === 'string'
            ? parseInt(studentAnswer.answer)
            : studentAnswer.answer;
          const correctAns = typeof question.correctAnswer === 'string'
            ? parseInt(question.correctAnswer.toString())
            : question.correctAnswer;

          isCorrect = studentAns === correctAns;
          pointsEarned = isCorrect ? question.points : 0;
          console.log(`    Comparison: ${studentAns} === ${correctAns} = ${isCorrect} (${pointsEarned} points)`);
        } else if (question.type === "short-answer") {
          // For short answer, we'll assume it's correct if there's an answer
          // In a real system, this would need manual grading
          isCorrect =
            studentAnswer.answer &&
            studentAnswer.answer.toString().trim() !== "";
          pointsEarned = isCorrect ? question.points : 0;
          console.log(`    Short answer: ${isCorrect} (${pointsEarned} points)`);
        }
      } else {
        console.log(`  Question ${question.id}: No answer provided`);
      }

      totalScore += pointsEarned;
      details.push({
        questionId: question.id,
        question: question.question,
        studentAnswer: studentAnswer?.answer,
        correctAnswer: question.correctAnswer,
        options: question.options,
        type: question.type,
        isCorrect,
        pointsEarned,
        maxPoints: question.points,
      });
    });

    return { score: totalScore, details };
  };

  const getStudentScoreOnly = (participant: QuizParticipant): number => {
    return calculateStudentScore(participant).score;
  };

  const getTotalPossiblePoints = (): number => {
    if (!quiz) return 0;
    return quiz.questions.reduce(
      (total, question) => total + question.points,
      0,
    );
  };

  const calculateAverageScore = (): number => {
    if (participants.length === 0) return 0;
    const totalPossible = getTotalPossiblePoints();
    if (totalPossible === 0) return 0;

    const averagePoints =
      participants.reduce((sum, participant) => {
        return sum + getStudentScoreOnly(participant);
      }, 0) / participants.length;

    return (averagePoints / totalPossible) * 100;
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 80) return "A";
    if (percentage >= 50) return "B";
    if (percentage >= 30) return "C";
    return "F";
  };

  const getGradeVariant = (grade: string) => {
    switch (grade) {
      case "A":
        return "default";
      case "B":
        return "secondary";
      case "C":
        return "outline";
      case "D":
        return "destructive";
      case "F":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return "text-quiz-success";
    if (percentage >= 50) return "text-primary";
    if (percentage >= 30) return "text-quiz-warning";
    return "text-destructive";
  };

  const downloadExcel = () => {
    if (!quiz || participants.length === 0) {
      toast({
        title: "No Data",
        description: "No student data available to download",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content (which can be opened in Excel)
    const headers = [
      "Student Name",
      "Score",
      "Total Points",
      "Percentage",
      "Grade",
      "Submission Time",
    ];
    const csvContent = [
      headers.join(","),
      ...participants.map((participant) => {
        const scoreData = calculateStudentScore(participant);
        const score = scoreData.score;
        const totalPoints = getTotalPossiblePoints();
        const percentage = ((score / totalPoints) * 100).toFixed(1);
        const grade = getGrade(parseFloat(percentage));
        const submissionTime = participant.submittedAt
          ? new Date(participant.submittedAt).toLocaleString()
          : "In Progress";

        return [
          `"${participant.name}"`,
          score,
          totalPoints,
          `${percentage}%`,
          grade,
          `"${submissionTime}"`,
        ].join(",");
      }),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${quiz.title}_results.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Quiz results have been downloaded as CSV file",
    });
  };

  if (!instructor) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz management...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The quiz you're looking for doesn't exist or you don't have
              permission to access it.
            </p>
            <Button asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="flex-shrink-0"
              >
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Back to Dashboard</span>
                </Link>
              </Button>
              <div className="w-6 h-6 md:w-8 md:h-8 quiz-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-semibold text-foreground truncate">
                  {quiz.title}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  Quiz Management
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <Badge
                variant={quiz.isActive ? "default" : "secondary"}
                className="hidden sm:inline-flex"
              >
                {quiz.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                onClick={toggleQuizStatus}
                variant={quiz.isActive ? "destructive" : "default"}
                size="sm"
                className="flex-shrink-0"
              >
                {quiz.isActive ? (
                  <>
                    <Square className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Stop Quiz</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Start Quiz</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  {quiz.isActive ? (
                    <CheckCircle className="h-4 w-4 text-quiz-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quiz.isActive ? "Live" : "Stopped"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {quiz.isActive
                      ? "Accepting participants"
                      : "Not accepting participants"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Participants
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {participants.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Total joined</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Questions
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quiz.questions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total questions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Time Limit
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quiz.timeLimit}</div>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </CardContent>
              </Card>
            </div>

            {/* Room Code and QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Room Code</CardTitle>
                  <CardDescription>
                    Students can join using this code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={quiz.roomCode}
                      readOnly
                      className="font-mono text-lg text-center"
                    />
                    <Button onClick={copyRoomCode} variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>
                    Students can scan to join quickly
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <img
                    src={generateQRCode()}
                    alt="Quiz QR Code"
                    className="w-32 h-32 mx-auto border rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>
                  Configure advanced options for your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowRetries" className="text-base">
                      Allow Retries
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Let students take the quiz multiple times
                    </p>
                  </div>
                  <Switch
                    id="allowRetries"
                    checked={allowRetries}
                    onCheckedChange={setAllowRetries}
                  />
                </div>

                {allowRetries && (
                  <div>
                    <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      max="10"
                      value={maxAttempts}
                      onChange={(e) =>
                        setMaxAttempts(parseInt(e.target.value) || 1)
                      }
                      className="w-24 mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Number of times students can attempt the quiz
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="randomizeQuestions" className="text-base">
                      Randomize Questions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Shuffle question order for each participant
                    </p>
                  </div>
                  <Switch
                    id="randomizeQuestions"
                    checked={randomizeQuestions}
                    onCheckedChange={setRandomizeQuestions}
                  />
                </div>

                <div>
                  <Label htmlFor="durationValue">Quiz Duration</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="durationValue"
                      type="number"
                      min="1"
                      max={durationUnit === "days" ? "365" : "43200"}
                      value={durationValue}
                      onChange={(e) =>
                        setDurationValue(parseInt(e.target.value) || 30)
                      }
                      className="w-24"
                    />
                    <Select
                      value={durationUnit}
                      onValueChange={(value: "minutes" | "days") =>
                        setDurationUnit(value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quiz will automatically deactivate after this duration
                    {quiz?.expiresAt && (
                      <span className="block mt-1">
                        Expires on:{" "}
                        {new Date(quiz.expiresAt).toLocaleDateString()} at{" "}
                        {new Date(quiz.expiresAt).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>

                <Button onClick={updateQuizSettings} disabled={updating}>
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Participants ({participants.length})</CardTitle>
                <CardDescription>
                  View and manage quiz participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No participants yet
                    </h3>
                    <p className="text-muted-foreground">
                      Participants will appear here once they join the quiz
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{participant.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {participant.answers.length} /{" "}
                            {quiz.questions.length} answered
                            {participant.submittedAt && (
                              <span className="ml-2">
                                • Submitted{" "}
                                {new Date(
                                  participant.submittedAt,
                                ).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {participant.submittedAt ? (
                            <Badge variant="outline">
                              Score: {getStudentScoreOnly(participant)}/{getTotalPossiblePoints()}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              participant.submittedAt ? "default" : "secondary"
                            }
                          >
                            {participant.submittedAt
                              ? "Completed"
                              : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Performance Analytics</CardTitle>
                    <CardDescription>
                      Detailed scores and grades for all quiz participants
                    </CardDescription>
                  </div>
                  <Button onClick={downloadExcel} variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Download Excel Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Data Available
                    </h3>
                    <p className="text-muted-foreground">
                      No students have completed this quiz yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-quiz-success">
                          {participants.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Students
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {calculateAverageScore().toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Average Score
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-quiz-success">
                          {
                            participants.filter((p) => {
                              const scoreData = calculateStudentScore(p);
                              const totalPossible = getTotalPossiblePoints();
                              const percentage = totalPossible > 0 ? (scoreData.score / totalPossible) * 100 : 0;
                              return getGrade(percentage) !== "F";
                            }).length
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Passed
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-destructive">
                          {
                            participants.filter((p) => {
                              const scoreData = calculateStudentScore(p);
                              const totalPossible = getTotalPossiblePoints();
                              const percentage = totalPossible > 0 ? (scoreData.score / totalPossible) * 100 : 0;
                              return getGrade(percentage) === "F";
                            }).length
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Failed
                        </div>
                      </div>
                    </div>

                    {/* Student Results Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 border-b">
                        <h4 className="font-medium">Student Results</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="text-left p-3 font-medium">
                                Student Name
                              </th>
                              <th className="text-left p-3 font-medium">
                                Score
                              </th>
                              <th className="text-left p-3 font-medium">
                                Percentage
                              </th>
                              <th className="text-left p-3 font-medium">
                                Grade
                              </th>
                              <th className="text-left p-3 font-medium">
                                Submission Time
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((participant) => {
                              // Debug logging
                              console.log(`Processing participant: ${participant.name}`);
                              console.log(`Participant data:`, participant);
                              console.log(`Participant answers:`, participant.answers);

                              // Always recalculate score for each participant
                              const scoreData = calculateStudentScore(participant);
                              const score = scoreData.score;
                              const totalPossible = getTotalPossiblePoints();
                              const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
                              const grade = getGrade(percentage);

                              console.log(`${participant.name} - Score: ${score}/${totalPossible} (${percentage}%) Grade: ${grade}`);
                              console.log(`Score details:`, scoreData.details);

                              return (
                                <tr
                                  key={participant.id}
                                  className="border-b hover:bg-muted/20"
                                >
                                  <td className="p-3 font-medium">
                                    {participant.name}
                                  </td>
                                  <td className="p-3">
                                    {score} / {totalPossible}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`font-medium ${getScoreColor(percentage)}`}
                                    >
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant={getGradeVariant(grade)}
                                      className="font-bold"
                                    >
                                      {grade}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">
                                    {participant.submittedAt
                                      ? new Date(
                                          participant.submittedAt,
                                        ).toLocaleString()
                                      : "In Progress"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
