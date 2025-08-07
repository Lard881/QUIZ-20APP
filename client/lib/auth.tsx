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

interface AuthContextType {
  instructor: Omit<Instructor, "password"> | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => void;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [instructor, setInstructor] = useState<Omit<
    Instructor,
    "password"
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("quiz_token");
    const savedInstructor = localStorage.getItem("quiz_instructor");

    if (token && savedInstructor) {
      try {
        setInstructor(JSON.parse(savedInstructor));
      } catch (error) {
        console.error("Failed to parse saved instructor data:", error);
        localStorage.removeItem("quiz_token");
        localStorage.removeItem("quiz_instructor");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.instructor && data.token) {
        setInstructor(data.instructor);
        localStorage.setItem("quiz_token", data.token);
        localStorage.setItem(
          "quiz_instructor",
          JSON.stringify(data.instructor),
        );
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const signup = async (signupData: SignupRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.instructor && data.token) {
        setInstructor(data.instructor);
        localStorage.setItem("quiz_token", data.token);
        localStorage.setItem(
          "quiz_instructor",
          JSON.stringify(data.instructor),
        );
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const logout = () => {
    setInstructor(null);
    localStorage.removeItem("quiz_token");
    localStorage.removeItem("quiz_instructor");
  };

  const updateInstructor = async (
    data: Partial<Instructor>,
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("quiz_token");
      const response = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedInstructor = { ...instructor, ...data };
        setInstructor(updatedInstructor);
        localStorage.setItem(
          "quiz_instructor",
          JSON.stringify(updatedInstructor),
        );
        return true;
      }
      return false;
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
