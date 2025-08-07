import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Quiz, QuizSession, QuizParticipant, UpdateQuizRequest } from "@shared/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, BookOpen, Play, Square, Users, Clock, 
  Settings, QrCode, BarChart3, RefreshCw, Shuffle,
  AlertTriangle, CheckCircle, Copy
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

  useEffect(() => {
    if (!instructor) {
      navigate("/auth/login");
      return;
    }
    if (quizId) {
      fetchQuizData();
    }
  }, [instructor, quizId, navigate]);

  const fetchQuizData = async () => {
    try {
      const token = localStorage.getItem('quiz_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch quiz details
      const quizResponse = await fetch(`/api/quiz/${quizId}`, {
        headers
      });

      if (quizResponse.ok) {
        const quizData = await quizResponse.json();
        if (quizData.quiz) {
          setQuiz(quizData.quiz);
          setAllowRetries(quizData.quiz.allowRetries || false);
          setRandomizeQuestions(quizData.quiz.randomizeQuestions || false);
          setMaxAttempts(quizData.quiz.maxAttempts || 1);
        } else {
          throw new Error("Invalid quiz data received");
        }
      } else {
        const errorData = await quizResponse.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${quizResponse.status}: ${quizResponse.statusText}`);
      }

      // Fetch quiz results/participants
      try {
        const resultsResponse = await fetch(`/api/quiz/${quizId}/results`, {
          headers
        });

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          setParticipants(resultsData.participants || []);
        } else {
          // Results endpoint failure is not critical, just log it
          console.warn("Could not fetch quiz results:", resultsResponse.statusText);
        }
      } catch (resultsError) {
        console.warn("Error fetching quiz results:", resultsError);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load quiz data",
        variant: "destructive"
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
      const token = localStorage.getItem('quiz_token');
      const updateData: UpdateQuizRequest = {
        allowRetries,
        randomizeQuestions,
        maxAttempts
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quiz/${quiz.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.quiz) {
          setQuiz(responseData.quiz);
          toast({
            title: "Settings Updated",
            description: "Quiz settings have been saved successfully"
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating quiz settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quiz settings",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleQuizStatus = async () => {
    if (!quiz) return;

    try {
      const token = localStorage.getItem('quiz_token');
      const response = await fetch(`/api/quiz/${quiz.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !quiz.isActive })
      });

      if (response.ok) {
        setQuiz({ ...quiz, isActive: !quiz.isActive });
        toast({
          title: quiz.isActive ? "Quiz Stopped" : "Quiz Started",
          description: quiz.isActive 
            ? "The quiz has been deactivated" 
            : "The quiz is now live and accepting participants"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quiz status",
        variant: "destructive"
      });
    }
  };

  const copyRoomCode = () => {
    if (quiz) {
      navigator.clipboard.writeText(quiz.roomCode);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard"
      });
    }
  };

  const generateQRCode = () => {
    if (!quiz) return "";
    const baseUrl = window.location.origin;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/student?code=${quiz.roomCode}`)}`;
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
              The quiz you're looking for doesn't exist or you don't have permission to access it.
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
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="w-8 h-8 quiz-gradient rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{quiz.title}</h1>
                <p className="text-sm text-muted-foreground">Quiz Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={quiz.isActive ? "default" : "secondary"}>
                {quiz.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                onClick={toggleQuizStatus}
                variant={quiz.isActive ? "destructive" : "default"}
              >
                {quiz.isActive ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Quiz
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Quiz
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
                    {quiz.isActive ? "Accepting participants" : "Not accepting participants"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{participants.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total joined
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quiz.questions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total questions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Limit</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quiz.timeLimit}</div>
                  <p className="text-xs text-muted-foreground">
                    Minutes
                  </p>
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
                    <Label htmlFor="allowRetries" className="text-base">Allow Retries</Label>
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
                      onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                      className="w-24 mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Number of times students can attempt the quiz
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="randomizeQuestions" className="text-base">Randomize Questions</Label>
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
                    <h3 className="text-lg font-medium mb-2">No participants yet</h3>
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
                            {participant.answers.length} / {quiz.questions.length} answered
                            {participant.submittedAt && (
                              <span className="ml-2">
                                • Submitted {new Date(participant.submittedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {participant.score !== undefined && (
                            <Badge variant="outline">
                              Score: {participant.score}
                            </Badge>
                          )}
                          <Badge variant={participant.submittedAt ? "default" : "secondary"}>
                            {participant.submittedAt ? "Completed" : "In Progress"}
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
                <CardTitle>Quiz Analytics</CardTitle>
                <CardDescription>
                  Performance insights and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting features will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
