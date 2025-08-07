import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { QuizQuestion, Quiz, UpdateQuizRequest } from "@shared/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  Save,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QuestionType = "multiple-choice" | "true-false" | "short-answer";

interface QuestionForm extends Omit<QuizQuestion, "id"> {
  tempId: string;
  id?: string;
}

export default function QuizEdit() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { instructor } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [allowRetries, setAllowRetries] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "days">("days");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  useEffect(() => {
    if (!instructor) {
      navigate("/auth/login");
      return;
    }
    if (quizId) {
      fetchQuiz();
    }
  }, [instructor, quizId, navigate]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem("quiz_token");
      const response = await fetch(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedQuiz = data.quiz;

        setQuiz(fetchedQuiz);
        setTitle(fetchedQuiz.title);
        setDescription(fetchedQuiz.description);
        setTimeLimit(fetchedQuiz.timeLimit);
        setAllowRetries(fetchedQuiz.allowRetries || false);
        setRandomizeQuestions(fetchedQuiz.randomizeQuestions || false);
        setMaxAttempts(fetchedQuiz.maxAttempts || 1);
        setDurationValue(fetchedQuiz.durationValue || 30);
        setDurationUnit(fetchedQuiz.durationUnit || "days");

        // Convert questions to form format
        const formQuestions: QuestionForm[] = fetchedQuiz.questions.map(
          (q: QuizQuestion) => ({
            ...q,
            tempId: q.id,
          }),
        );
        setQuestions(formQuestions);
      } else {
        throw new Error("Failed to fetch quiz");
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz data",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuestionForm = {
      tempId: Date.now().toString(),
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (tempId: string, updates: Partial<QuestionForm>) => {
    setQuestions(
      questions.map((q) => (q.tempId === tempId ? { ...q, ...updates } : q)),
    );
  };

  const removeQuestion = (tempId: string) => {
    setQuestions(questions.filter((q) => q.tempId !== tempId));
  };

  const updateQuestionOption = (
    tempId: string,
    optionIndex: number,
    value: string,
  ) => {
    const question = questions.find((q) => q.tempId === tempId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(tempId, { options: newOptions });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a quiz title",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        toast({
          title: "Error",
          description: "All questions must have text",
          variant: "destructive",
        });
        return;
      }

      if (question.type === "multiple-choice" && question.options) {
        const filledOptions = question.options.filter((opt) => opt.trim());
        if (filledOptions.length < 2) {
          toast({
            title: "Error",
            description: "Multiple choice questions need at least 2 options",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("quiz_token");
      const updateData: UpdateQuizRequest = {
        title: title.trim(),
        description: description.trim(),
        timeLimit,
        allowRetries,
        randomizeQuestions,
        maxAttempts,
        durationValue,
        durationUnit,
        questions: questions.map(({ tempId, id, ...q }) => q),
      };

      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update quiz");
      }

      toast({
        title: "Quiz Updated!",
        description: "Your quiz has been updated successfully",
      });

      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionEditor = (question: QuestionForm, index: number) => (
    <Card key={question.tempId} className="quiz-card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{question.points} pts</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(question.tempId)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`question-${question.tempId}`}>Question Text</Label>
          <Textarea
            id={`question-${question.tempId}`}
            placeholder="Enter your question..."
            value={question.question}
            onChange={(e) =>
              updateQuestion(question.tempId, { question: e.target.value })
            }
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`type-${question.tempId}`}>Question Type</Label>
            <Select
              value={question.type}
              onValueChange={(value: QuestionType) => {
                const updates: Partial<QuestionForm> = { type: value };
                if (value === "true-false") {
                  updates.options = ["True", "False"];
                  updates.correctAnswer = 0;
                } else if (value === "short-answer") {
                  updates.options = undefined;
                  updates.correctAnswer = "";
                } else if (value === "multiple-choice" && !question.options) {
                  updates.options = ["", "", "", ""];
                  updates.correctAnswer = 0;
                }
                updateQuestion(question.tempId, updates);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`points-${question.tempId}`}>Points</Label>
            <Input
              id={`points-${question.tempId}`}
              type="number"
              min="1"
              max="100"
              value={question.points}
              onChange={(e) =>
                updateQuestion(question.tempId, {
                  points: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        {question.type === "multiple-choice" && question.options && (
          <div>
            <Label>Answer Options</Label>
            <div className="space-y-2 mt-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`correct-${question.tempId}`}
                    checked={question.correctAnswer === optionIndex}
                    onChange={() =>
                      updateQuestion(question.tempId, {
                        correctAnswer: optionIndex,
                      })
                    }
                    className="text-primary"
                  />
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) =>
                      updateQuestionOption(
                        question.tempId,
                        optionIndex,
                        e.target.value,
                      )
                    }
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select the correct answer by clicking the radio button
            </p>
          </div>
        )}

        {question.type === "true-false" && (
          <div>
            <Label>Correct Answer</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`correct-${question.tempId}`}
                  checked={question.correctAnswer === 0}
                  onChange={() =>
                    updateQuestion(question.tempId, { correctAnswer: 0 })
                  }
                  className="text-primary"
                />
                <span>True</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`correct-${question.tempId}`}
                  checked={question.correctAnswer === 1}
                  onChange={() =>
                    updateQuestion(question.tempId, { correctAnswer: 1 })
                  }
                  className="text-primary"
                />
                <span>False</span>
              </label>
            </div>
          </div>
        )}

        {question.type === "short-answer" && (
          <div>
            <Label htmlFor={`answer-${question.tempId}`}>
              Sample Correct Answer
            </Label>
            <Input
              id={`answer-${question.tempId}`}
              placeholder="Enter a sample correct answer..."
              value={question.correctAnswer as string}
              onChange={(e) =>
                updateQuestion(question.tempId, {
                  correctAnswer: e.target.value,
                })
              }
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be used for manual grading reference
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!instructor) return null;

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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The quiz you're trying to edit doesn't exist or you don't have
              permission to edit it.
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
              <h1 className="text-xl font-semibold text-foreground">
                Edit Quiz
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" disabled>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
              <CardDescription>
                Update the basic details for your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the quiz content and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    max="180"
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(parseInt(e.target.value) || 30)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Settings */}
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
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Questions ({questions.length})
              </h2>
              <Button onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add questions to your quiz
                  </p>
                  <Button onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) =>
                  renderQuestionEditor(question, index),
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
