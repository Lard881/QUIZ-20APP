import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Quiz, GetQuizzesResponse } from "@shared/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Clock,
  Users,
  Play,
  QrCode,
  Settings,
  BookOpen,
  Trash2,
  MoreVertical,
  LogOut,
} from "lucide-react";

export default function Dashboard() {
  const { instructor, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (!instructor) {
      navigate("/auth/login");
      return;
    }
    fetchQuizzes();
  }, [instructor, navigate]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("quiz_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/quizzes", {
        headers,
      });

      if (response.ok) {
        const data = (await response.json()) as GetQuizzesResponse;
        const fetchedQuizzes = data.quizzes || [];
        setQuizzes(fetchedQuizzes);

        // Calculate total participants across all quizzes (non-blocking)
        calculateTotalParticipants(fetchedQuizzes).catch((error) => {
          console.warn("Failed to calculate total participants:", error);
          setTotalParticipants(0);
        });
      } else {
        console.error("Failed to fetch quizzes:", response.statusText);
        setQuizzes([]);
        setTotalParticipants(0);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
      setTotalParticipants(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalParticipants = async (quizList: Quiz[]) => {
    try {
      let total = 0;

      // Use Promise.allSettled to handle multiple requests gracefully
      const participantRequests = quizList.map(async (quiz) => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          const token = localStorage.getItem("quiz_token");
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          // Create timeout controller for better browser compatibility
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`/api/quiz/${quiz.id}/results`, {
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            return (data.participants || []).length;
          } else {
            console.warn(
              `Failed to get participants for quiz ${quiz.id}: ${response.status} ${response.statusText}`,
            );
            return 0;
          }
        } catch (error) {
          console.warn(
            `Failed to get participants for quiz ${quiz.id}:`,
            error,
          );
          return 0;
        }
      });

      const results = await Promise.allSettled(participantRequests);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          total += result.value;
        }
      });

      setTotalParticipants(total);
    } catch (error) {
      console.error("Error calculating total participants:", error);
      setTotalParticipants(0);
    }
  };

  const handleToggleQuizStatus = async (
    quizId: string,
    currentStatus: boolean,
  ) => {
    try {
      const token = localStorage.getItem("quiz_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quiz/${quizId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuizzes(
            quizzes.map((q) =>
              q.id === quizId ? { ...q, isActive: !currentStatus } : q,
            ),
          );
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        alert(
          `Failed to update quiz status: ${errorData.message || response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error updating quiz status:", error);
      alert("Failed to update quiz status. Please check your connection.");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("quiz_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        alert(
          `Failed to delete quiz: ${errorData.message || response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz. Please check your connection.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!instructor) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 md:w-10 md:h-10 quiz-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                  QuizMaster
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Welcome back, {instructor.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm" className="flex-shrink-0">
                <Link to="/quiz/create">
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Create Quiz</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="quiz-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Quizzes
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
              <p className="text-xs text-muted-foreground">
                {quizzes.filter((q) => q.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quizzes.filter((q) => q.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Participants
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Across all quizzes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quiz List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Quizzes</h2>
        </div>

        {quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first quiz to get started with QuizMaster
              </p>
              <Button asChild>
                <Link to="/quiz/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="quiz-card-hover group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {quiz.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>
                        {quiz.isActive ? "Active" : "Draft"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/quiz/${quiz.id}/edit`}>Edit Quiz</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/quiz/${quiz.id}/manage`}>
                              Manage Quiz
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleQuizStatus(quiz.id, quiz.isActive)
                            }
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {quiz.isActive
                              ? "Deactivate Quiz"
                              : "Activate Quiz"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Quiz
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {quiz.timeLimit} min
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <QrCode className="w-4 h-4 mr-1" />
                        {quiz.roomCode}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(quiz.createdAt)}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/quiz/${quiz.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        variant={quiz.isActive ? "secondary" : "default"}
                        asChild
                      >
                        <Link to={`/quiz/${quiz.id}/manage`}>
                          {quiz.isActive ? "Manage" : "Start"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
