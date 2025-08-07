import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Save, LogOut, User, Mail, Lock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const { instructor, logout, updateInstructor } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(instructor?.name || "");
  const [email, setEmail] = useState(instructor?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!instructor) {
    navigate("/auth/login");
    return null;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const updates: any = {};
      let hasChanges = false;

      // Check for profile changes
      if (name.trim() !== instructor.name) {
        updates.name = name.trim();
        hasChanges = true;
      }

      if (email.trim() !== instructor.email) {
        updates.email = email.trim();
        hasChanges = true;
      }

      // Check for password change
      if (newPassword) {
        if (newPassword.length < 6) {
          setError("New password must be at least 6 characters long");
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("New passwords do not match");
          return;
        }
        if (!currentPassword) {
          setError("Current password is required to change password");
          return;
        }

        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
        hasChanges = true;
      }

      if (!hasChanges) {
        setError("No changes to save");
        return;
      }

      const success = await updateInstructor(updates);
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully"
        });
        
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (error) {
      setError("An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully"
      });
      navigate("/");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
              <h1 className="text-xl font-semibold text-foreground">Account Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    View and update your account details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Account Created</Label>
                  <p className="font-medium">{formatDate(instructor.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <p className="font-medium">{formatDate(instructor.lastLogin)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account ID</Label>
                  <p className="font-mono text-xs">{instructor.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Quizzes</Label>
                  <p className="font-medium">{instructor.quizzes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your profile information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-base font-medium">Change Password</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isSaving}
                      placeholder="Enter current password"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSaving}
                      placeholder="Enter new password (min 6 characters)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSaving}
                      placeholder="Confirm new password"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security & Logout */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Active Session</h4>
                    <p className="text-sm text-muted-foreground">
                      You are currently logged in. Click logout to end your session.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    For your security, always logout when using shared or public computers.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
