import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Timer,
  QrCode,
  CheckCircle,
  BarChart3,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 quiz-gradient rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  QuizMaster
                </h1>
                <p className="text-sm text-muted-foreground">
                  Interactive Quiz Platform
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link to="/auth/login">Instructor Login</Link>
              </Button>
              <Button asChild>
                <Link to="/student">
                  <QrCode className="w-4 h-4 mr-2" />
                  Join Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Create & Manage
            <span className="quiz-gradient bg-clip-text text-transparent block">
              Interactive Quizzes
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A powerful platform for educators to create engaging quizzes with
            real-time participation, automatic grading, and comprehensive
            analytics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link to="/auth/signup">
                <BookOpen className="w-5 h-5 mr-2" />
                Get Started as Instructor
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="min-w-[200px]"
            >
              <Link to="/student">
                <Users className="w-5 h-5 mr-2" />
                Join as Student
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Easy Quiz Creation</CardTitle>
              <CardDescription>
                Create multiple choice, true/false, and short answer questions
                with our intuitive builder
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Real-time Participation</CardTitle>
              <CardDescription>
                Students join instantly with QR codes or room codes, with live
                timer and auto-submission
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Automatic Grading</CardTitle>
              <CardDescription>
                Instant results with detailed analytics and performance tracking
                for every participant
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-quiz-info/10 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-quiz-info" />
              </div>
              <CardTitle>QR Code Access</CardTitle>
              <CardDescription>
                Students can quickly join quizzes by scanning QR codes with
                their mobile devices
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-quiz-warning/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-quiz-warning" />
              </div>
              <CardTitle>Multiple Attempts</CardTitle>
              <CardDescription>
                Configure retries and randomize question order for fair and
                flexible assessment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="quiz-card-hover">
            <CardHeader>
              <div className="w-12 h-12 bg-quiz-success/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-quiz-success" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive reports with student performance, question
                analytics, and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Teaching?
          </h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of educators using QuizMaster to create engaging,
            interactive learning experiences for their students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth/login">Already have an account?</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 quiz-gradient rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                QuizMaster
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link
                to="/student"
                className="hover:text-foreground transition-colors"
              >
                Student Access
              </Link>
              <Link
                to="/auth/login"
                className="hover:text-foreground transition-colors"
              >
                Instructor Login
              </Link>
              <span>© 2024 QuizMaster. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
