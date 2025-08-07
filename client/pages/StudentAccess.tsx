import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { JoinQuizRequest } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, QrCode, Hash, Users, Clock, BookOpen, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [roomCode, setRoomCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [joining, setJoining] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for room code in URL parameters
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
      handleRoomCodeSubmit(codeFromUrl.toUpperCase());
    }

    fetchAvailableQuizzes();
  }, [searchParams]);

  const fetchAvailableQuizzes = async () => {
    try {
      const response = await fetch("/api/quizzes/active");
      if (response.ok) {
        const data = await response.json();
        setAvailableQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCodeSubmit = async (codeToSubmit?: string) => {
    const code = codeToSubmit || roomCode;

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if quiz exists and is active
      const response = await fetch(`/api/quiz/check/${code.toUpperCase()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.quiz && data.quiz.isActive) {
          setSelectedQuiz(data.quiz);
          setShowNameInput(true);
          if (!codeToSubmit) {
            setRoomCode(code.toUpperCase());
          }
        } else {
          toast({
            title: "Quiz Not Available",
            description: "This quiz is not currently active",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Quiz Not Found",
          description: "Invalid room code or quiz does not exist",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleJoinQuiz = async () => {
    if (!participantName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    if (!selectedQuiz) return;

    setJoining(true);
    try {
      const joinData: JoinQuizRequest = {
        roomCode: selectedQuiz.roomCode,
        participantName: participantName.trim()
      };

      const response = await fetch("/api/quiz/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinData)
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          toast({
            title: "Joined Successfully!",
            description: `Welcome to ${selectedQuiz.title}`
          });

          // Navigate to quiz taking page with session ID
          navigate(`/quiz/${data.sessionId}/take`);
        } else {
          toast({
            title: "Failed to Join",
            description: data.message || "Could not join the quiz",
            variant: "destructive"
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to join quiz",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const selectQuizFromList = (quiz: any) => {
    setSelectedQuiz(quiz);
    setRoomCode(quiz.roomCode);
    setShowNameInput(true);
  };

  const resetForm = () => {
    setShowNameInput(false);
    setSelectedQuiz(null);
    setRoomCode("");
    setParticipantName("");
  };

  // Generate QR code URL (in real app, this would be a proper QR code)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/student")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="w-8 h-8 quiz-gradient rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Student Access</h1>
            </div>
            <Badge variant="secondary">
              {availableQuizzes.filter(q => q.isActive).length} Active Quizzes
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!showNameInput ? (
          <div className="space-y-8">
            {/* QR Code Section */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 quiz-gradient rounded-full flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Join Quiz with QR Code</CardTitle>
                <CardDescription>
                  Students can scan this QR code to quickly access the quiz portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-6 inline-block shadow-sm border">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code for Quiz Access" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Scan with your phone camera or QR code app
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="h-px bg-border flex-1 w-24"></div>
                <span className="text-sm">OR</span>
                <div className="h-px bg-border flex-1 w-24"></div>
              </div>
            </div>

            {/* Room Code Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Hash className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle>Enter Room Code</CardTitle>
                    <CardDescription>
                      Type the room code provided by your instructor
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomCode">Room Code</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="roomCode"
                      placeholder="e.g., JS2024"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="flex-1 text-center font-mono text-lg"
                      maxLength={10}
                    />
                    <Button onClick={handleRoomCodeSubmit} disabled={!roomCode.trim()}>
                      Join Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Quizzes */}
            {availableQuizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Quizzes</CardTitle>
                  <CardDescription>
                    Click on any quiz below to join directly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => selectQuizFromList(quiz)}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{quiz.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              {quiz.roomCode}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {quiz.timeLimit} min
                            </div>
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {quiz.participantCount} joined
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={quiz.isActive ? "default" : "secondary"}>
                            {quiz.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Name Input Section */
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Join "{selectedQuiz?.title}"</CardTitle>
                <CardDescription>
                  Please enter your name to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 mr-1" />
                      {selectedQuiz?.roomCode}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedQuiz?.timeLimit} minutes
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="participantName">Your Name</Label>
                  <Input
                    id="participantName"
                    placeholder="Enter your full name"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="mt-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && participantName.trim()) {
                        handleJoinQuiz();
                      }
                    }}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleJoinQuiz} 
                    disabled={joining || !participantName.trim()}
                    className="flex-1"
                  >
                    {joining ? "Joining..." : "Start Quiz"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
