import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Instructor,
  AuthResponse,
  LoginRequest,
  SignupRequest,
} from "@shared/api";
import app, { auth } from "@/lib/firebase";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  signOut as fbSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

interface AuthContextType {
  instructor: Omit<Instructor, "password"> | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateInstructor: (data: Partial<Instructor>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

function mapFirebaseUserToInstructor(user: User): Omit<Instructor, "password"> {
  const createdAt = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toISOString()
    : new Date().toISOString();
  const lastLogin = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toISOString()
    : new Date().toISOString();

  return {
    id: user.uid,
    name: user.displayName || user.email || "Instructor",
    email: user.email || "",
    quizzes: [],
    createdAt,
    lastLogin,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [instructor, setInstructor] = useState<Omit<Instructor, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const mapped = mapFirebaseUserToInstructor(user);
        setInstructor(mapped);
        try {
          const token = await user.getIdToken();
          localStorage.setItem("quiz_token", token);
          localStorage.setItem("quiz_instructor", JSON.stringify(mapped));
        } catch (err) {
          // Ignore token persistence issues
        }
      } else {
        setInstructor(null);
        localStorage.removeItem("quiz_token");
        localStorage.removeItem("quiz_instructor");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      const token = await user.getIdToken();
      const mapped = mapFirebaseUserToInstructor(user);
      setInstructor(mapped);
      localStorage.setItem("quiz_token", token);
      localStorage.setItem("quiz_instructor", JSON.stringify(mapped));
      return {
        success: true,
        instructor: mapped,
        token,
      };
    } catch (error: any) {
      let message = "Login failed. Please try again.";
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/invalid-email") {
        message = "Invalid email or password";
      }
      return { success: false, message };
    }
  };

  const signup = async (signupData: SignupRequest): Promise<AuthResponse> => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password,
      );

      if (signupData.name) {
        await fbUpdateProfile(user, { displayName: signupData.name });
      }

      const token = await user.getIdToken();
      const mapped = mapFirebaseUserToInstructor({ ...user, displayName: signupData.name } as User);
      setInstructor(mapped);
      localStorage.setItem("quiz_token", token);
      localStorage.setItem("quiz_instructor", JSON.stringify(mapped));

      return {
        success: true,
        instructor: mapped,
        token,
      };
    } catch (error: any) {
      let message = "Account creation failed. Please try again.";
      if (error?.code === "auth/email-already-in-use") {
        message = "An account with this email already exists";
      } else if (error?.code === "auth/weak-password") {
        message = "Password must be at least 6 characters long";
      }
      return { success: false, message };
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setInstructor(null);
    localStorage.removeItem("quiz_token");
    localStorage.removeItem("quiz_instructor");
  };

  const updateInstructor = async (data: Partial<Instructor>): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      let requiresReauth = false;
      const extra = data as any;
      const currentPassword: string | undefined = extra.currentPassword;
      const newPassword: string | undefined = extra.newPassword;

      // Update display name
      if (typeof data.name === "string" && data.name.trim() && data.name !== user.displayName) {
        await fbUpdateProfile(user, { displayName: data.name.trim() });
      }

      // Determine if reauth is needed (email or password change)
      if ((typeof data.email === "string" && data.email.trim() && data.email !== user.email) || newPassword) {
        requiresReauth = true;
      }

      if (requiresReauth) {
        const emailForCred = user.email || data.email || "";
        if (!currentPassword || !emailForCred) {
          return false;
        }
        const credential = EmailAuthProvider.credential(emailForCred, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (typeof data.email === "string" && data.email.trim() && data.email !== user.email) {
        await fbUpdateEmail(user, data.email.trim());
      }

      if (newPassword) {
        await fbUpdatePassword(user, newPassword);
      }

      // Refresh token and context
      const refreshedUser = auth.currentUser as User;
      const mapped = mapFirebaseUserToInstructor(refreshedUser);
      setInstructor(mapped);
      try {
        const token = await refreshedUser.getIdToken(true);
        localStorage.setItem("quiz_token", token);
        localStorage.setItem("quiz_instructor", JSON.stringify(mapped));
      } catch {}

      return true;
    } catch (error) {
      return false;
    }
  };

  const value: AuthContextType = {
    instructor,
    isLoading,
    login,
    signup,
    logout,
    updateInstructor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
