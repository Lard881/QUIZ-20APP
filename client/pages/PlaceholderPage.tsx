import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Construction } from "lucide-react";

interface PlaceholderPageProps {
  pageName: string;
}

export default function PlaceholderPage({ pageName }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
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
            <h1 className="text-xl font-semibold text-foreground">QuizMaster</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Construction className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">{pageName} - Coming Soon</CardTitle>
              <CardDescription className="text-base">
                This page is under development. Continue prompting to have us implement this specific functionality for your quiz management system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                <p>
                  The <strong>{pageName}</strong> page will include advanced functionality for managing your quizzes.
                  Ask us to implement specific features you need for this section.
                </p>
              </div>
              
              <div className="flex justify-center space-x-3">
                <Button asChild>
                  <Link to="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/quiz/create">
                    Create New Quiz
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
