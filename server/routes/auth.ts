import { RequestHandler } from "express";
import { 
  Instructor, 
  LoginRequest, 
  SignupRequest, 
  AuthResponse, 
  UpdateInstructorRequest,
  ErrorResponse 
} from "@shared/api";

// In-memory storage (replace with database in production)
let instructors: Instructor[] = [
  {
    id: "instructor1",
    name: "Demo Instructor",
    email: "demo@example.com",
    password: "password123", // In production, this should be hashed
    quizzes: [],
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: "2024-01-15T10:00:00Z"
  }
];

// Simple token generation (use proper JWT in production)
const generateToken = (instructorId: string): string => {
  return Buffer.from(`${instructorId}:${Date.now()}`).toString('base64');
};

// Hash password (simplified - use bcrypt in production)
const hashPassword = (password: string): string => {
  return Buffer.from(password).toString('base64');
};

// Verify password (simplified - use bcrypt in production)
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return Buffer.from(password).toString('base64') === hashedPassword;
};

// Login endpoint
export const login: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Email and password are required"
      };
      return res.status(400).json(errorResponse);
    }

    const instructor = instructors.find(i => i.email.toLowerCase() === email.toLowerCase());
    
    if (!instructor) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response);
    }

    // For demo purposes, allow simple password check or hashed
    const isValidPassword = password === instructor.password || 
                           (instructor.password && verifyPassword(password, instructor.password));

    if (!isValidPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response);
    }

    // Update last login
    instructor.lastLogin = new Date().toISOString();

    const token = generateToken(instructor.id);
    const { password: _, ...instructorWithoutPassword } = instructor;

    const response: AuthResponse = {
      success: true,
      instructor: instructorWithoutPassword,
      token
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "LOGIN_FAILED",
      message: "Login failed"
    };
    res.status(500).json(errorResponse);
  }
};

// Signup endpoint
export const signup: RequestHandler = (req, res) => {
  try {
    const { name, email, password } = req.body as SignupRequest;

    if (!name || !email || !password) {
      const errorResponse: ErrorResponse = {
        error: "VALIDATION_ERROR",
        message: "Name, email, and password are required"
      };
      return res.status(400).json(errorResponse);
    }

    if (password.length < 6) {
      const response: AuthResponse = {
        success: false,
        message: "Password must be at least 6 characters long"
      };
      return res.status(400).json(response);
    }

    // Check if email already exists
    const existingInstructor = instructors.find(i => i.email.toLowerCase() === email.toLowerCase());
    if (existingInstructor) {
      const response: AuthResponse = {
        success: false,
        message: "An account with this email already exists"
      };
      return res.status(409).json(response);
    }

    const newInstructor: Instructor = {
      id: `instructor_${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashPassword(password),
      quizzes: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    instructors.push(newInstructor);

    const token = generateToken(newInstructor.id);
    const { password: _, ...instructorWithoutPassword } = newInstructor;

    const response: AuthResponse = {
      success: true,
      instructor: instructorWithoutPassword,
      token
    };

    res.status(201).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "SIGNUP_FAILED",
      message: "Account creation failed"
    };
    res.status(500).json(errorResponse);
  }
};

// Update instructor profile
export const updateProfile: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "No valid token provided" });
    }

    // Simple token verification (use proper JWT verification in production)
    const token = authHeader.substring(7);
    let instructorId: string;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      instructorId = decoded.split(':')[0];
    } catch {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token" });
    }

    const instructor = instructors.find(i => i.id === instructorId);
    if (!instructor) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Instructor not found" });
    }

    const { name, email, currentPassword, newPassword } = req.body as UpdateInstructorRequest;

    // Update name if provided
    if (name) {
      instructor.name = name.trim();
    }

    // Update email if provided
    if (email) {
      const emailExists = instructors.find(i => i.id !== instructorId && i.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      instructor.email = email.toLowerCase().trim();
    }

    // Update password if provided
    if (newPassword && currentPassword) {
      const isCurrentPasswordValid = currentPassword === instructor.password || 
                                   (instructor.password && verifyPassword(currentPassword, instructor.password));
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
      }

      instructor.password = hashPassword(newPassword);
    }

    const { password: _, ...instructorWithoutPassword } = instructor;
    res.json({ success: true, instructor: instructorWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "UPDATE_FAILED", message: "Profile update failed" });
  }
};

// Get current instructor profile
export const getProfile: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "No valid token provided" });
    }

    const token = authHeader.substring(7);
    let instructorId: string;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      instructorId = decoded.split(':')[0];
    } catch {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token" });
    }

    const instructor = instructors.find(i => i.id === instructorId);
    if (!instructor) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Instructor not found" });
    }

    const { password: _, ...instructorWithoutPassword } = instructor;
    res.json({ instructor: instructorWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to get profile" });
  }
};
