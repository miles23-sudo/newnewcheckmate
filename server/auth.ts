import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'instructor', 'administrator'])
});

// Register schema
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export class AuthService {
  /**
   * Authenticate user login
   */
  static async login(email: string, password: string, role: string) {
    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user role matches
      if (user.role !== role) {
        throw new Error(`Access denied. This account is registered as a ${user.role}, but you're trying to sign in as a ${role}.`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterData) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user data for database
      const userToCreate = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        studentId: userData.studentId || null
      };

      // Create user in database
      const newUser = await storage.createUser(userToCreate);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = newUser;
      return {
        success: true,
        user: userWithoutPassword
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Validate login data
   */
  static validateLoginData(data: any): { success: boolean; data?: LoginData; error?: string } {
    try {
      const validatedData = loginSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Invalid login data' };
    }
  }

  /**
   * Validate registration data
   */
  static validateRegisterData(data: any): { success: boolean; data?: RegisterData; error?: string } {
    try {
      const validatedData = registerSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Invalid registration data' };
    }
  }
}
