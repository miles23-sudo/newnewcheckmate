import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: 'student' | 'instructor' | 'administrator';
      status: 'pending' | 'approved' | 'rejected';
      studentId?: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    };
  }
}
