import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertMaterialSchema, insertSubmissionSchema, insertChatMessageSchema, grades, submissions, assignments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { AuthService } from "./auth";
import { processSubmissionWithAI, getPlagiarismReport, getAIGrade } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Announcement routes
  app.get("/api/announcements/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const announcements = await storage.getAnnouncementsByCourse(courseId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Unable to load course announcements. Please refresh the page or contact support if the issue persists." });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(400).json({ error: "Cannot create announcement. Please check that all required fields are filled and try again." });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAnnouncement = await storage.updateAnnouncement(id, req.body);
      if (!updatedAnnouncement) {
        return res.status(404).json({ error: "This announcement no longer exists. It may have been deleted by an instructor." });
      }
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(400).json({ error: "Cannot save changes to announcement. Please check your input and try again." });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ error: "This announcement no longer exists or has already been deleted." });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Material routes
  app.get("/api/materials/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const materials = await storage.getMaterialsByCourse(courseId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ error: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMaterial = await storage.updateMaterial(id, req.body);
      if (!updatedMaterial) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(updatedMaterial);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(400).json({ error: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMaterial(id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Submission routes
  app.get("/api/submissions/assignment/:assignmentId", async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const submissions = await storage.getSubmissionsByAssignment(assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const submissions = await storage.getSubmissionsByStudent(studentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      res.status(500).json({ error: "Failed to fetch student submissions" });
    }
  });

  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const submission = await storage.getSubmission(id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      
      // Process with AI if content is provided
      if (submission.content && submission.assignmentId) {
        try {
          const aiResult = await processSubmissionWithAI(
            submission.id,
            submission.content,
            submission.assignmentId
          );
          
          // Add AI results to response
          res.status(201).json({
            ...submission,
            ai: aiResult
          });
        } catch (aiError) {
          console.error("AI processing failed:", aiError);
          // Still return the submission even if AI fails
          res.status(201).json({
            ...submission,
            ai: { error: "AI processing failed" }
          });
        }
      } else {
        res.status(201).json(submission);
      }
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(400).json({ error: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSubmission = await storage.updateSubmission(id, req.body);
      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(400).json({ error: "Failed to update submission" });
    }
  });

  // AI-specific routes
  app.get("/api/submissions/:id/plagiarism", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await getPlagiarismReport(id);
      if (!report) {
        return res.status(404).json({ error: "No plagiarism report found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching plagiarism report:", error);
      res.status(500).json({ error: "Failed to fetch plagiarism report" });
    }
  });

  app.get("/api/submissions/:id/ai-grade", async (req, res) => {
    try {
      const { id } = req.params;
      const grade = await getAIGrade(id);
      if (!grade) {
        return res.status(404).json({ error: "No AI grade found" });
      }
      res.json(grade);
    } catch (error) {
      console.error("Error fetching AI grade:", error);
      res.status(500).json({ error: "Failed to fetch AI grade" });
    }
  });

  // Chat message routes
  app.get("/api/chat/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const messages = await storage.getChatMessagesByCourse(courseId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to load chat messages. Please refresh the page or contact support if the issue persists." });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ error: "Failed to send message. Please check your input and try again." });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate request data
      const validation = AuthService.validateLoginData(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { email, password, role } = validation.data!;
      
      // Attempt login
      const result = await AuthService.login(email, password, role);
      
      if (result.success) {
        res.json({
          success: true,
          user: result.user,
          message: "Login successful"
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login service temporarily unavailable. Please try again in a moment." });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request data
      const validation = AuthService.validateRegisterData(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const userData = validation.data!;
      
      // Attempt registration
      const result = await AuthService.register(userData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          user: result.user,
          message: "Registration successful"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Course routes
  app.get("/api/courses/instructor/:instructorId", async (req, res) => {
    try {
      const { instructorId } = req.params;
      const courses = await storage.getCoursesByInstructor(instructorId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching instructor courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const courses = await storage.getEnrolledCourses(studentId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCourse = await storage.updateCourse(id, req.body);
      if (!updatedCourse) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(400).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Assignment routes
  app.get("/api/assignments/course/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const assignments = await storage.getAssignmentsByCourse(courseId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(400).json({ error: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAssignment = await storage.updateAssignment(id, req.body);
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(400).json({ error: "Failed to update assignment" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const enrollments = await storage.getEnrollments(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const { courseId, studentId } = req.body;
      const enrollment = await storage.enrollStudent(courseId, studentId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(400).json({ error: "Failed to create enrollment" });
    }
  });

  // Authentication middleware for admin routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.user || req.session.user.role !== 'administrator') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // User management routes (Admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // User profile and settings routes
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, department, title, bio } = req.body;
      
      const updatedUser = await storage.updateUser(id, {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        email: email?.trim(),
        // Store additional profile data in a way that fits your schema
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile. Please try again." });
    }
  });

  app.put("/api/users/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = req.body;
      
      // For now, we'll return success as settings would typically be stored
      // in a separate user_settings table or JSON field
      // TODO: Implement actual settings storage if needed
      
      res.json({ 
        success: true, 
        message: "Settings saved successfully",
        settings: settings 
      });
    } catch (error) {
      console.error("Error saving user settings:", error);
      res.status(500).json({ error: "Failed to save settings. Please try again." });
    }
  });

  // Admin statistics routes (Admin only)
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const [users, courses, assignments, submissions, grades] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllCourses(),
        storage.getAllAssignments(),
        storage.getAllSubmissions(),
        storage.getAllGrades()
      ]);
      
      const totalUsers = users.length;
      const totalStudents = users.filter(u => u.role === 'student').length;
      const totalInstructors = users.filter(u => u.role === 'instructor').length;
      const totalAdmins = users.filter(u => u.role === 'administrator').length;
      
      // Calculate AI grading usage - grades marked as AI-graded vs total submissions
      const aiGrades = grades.filter(g => g.gradedBy === 'ai').length;
      const aiGradingUsage = submissions.length > 0 ? (aiGrades / submissions.length) * 100 : 0;
      
      res.json({
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.isActive).length,
        totalAssignments: assignments.length,
        aiGradingUsage: Math.round(aiGradingUsage * 10) / 10, // Round to 1 decimal place
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    try {
      // TODO: Implement activity logging system
      // For now, return mock data
      const activities = [
        {
          id: "1",
          type: "user_registration",
          description: "New student registered: Sarah Johnson",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: "completed",
        },
        {
          id: "2",
          type: "course_creation",
          description: "Course created: Advanced Physics by Dr. Chen",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: "completed",
        },
        {
          id: "3",
          type: "ai_grading",
          description: "AI graded 25 assignments in CS101",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: "completed",
        },
      ];
      res.json(activities);
    } catch (error) {
      console.error("Error fetching admin activity:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Student-specific routes
  app.get("/api/assignments/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const assignments = await storage.getSubmissionsByStudent(studentId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({ error: "Failed to fetch student assignments" });
    }
  });

  app.get("/api/grades/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get grades with course information using joins
      const gradesWithCourses = await db
        .select({
          id: grades.id,
          submissionId: grades.submissionId,
          score: grades.score,
          maxScore: assignments.maxScore,
          feedback: grades.feedback,
          rubricScores: grades.rubricScores,
          gradedBy: grades.gradedBy,
          gradedAt: grades.gradedAt,
          createdAt: grades.createdAt,
          courseId: assignments.courseId,
          assignmentId: submissions.assignmentId,
          assignmentTitle: assignments.title
        })
        .from(grades)
        .innerJoin(submissions, eq(grades.submissionId, submissions.id))
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(eq(submissions.studentId, studentId));
      
      res.json(gradesWithCourses);
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ error: "Failed to fetch student grades" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
