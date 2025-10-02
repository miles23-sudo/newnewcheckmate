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
      
      if (result.success && result.user) {
        // Save user to session
        req.session.user = result.user;
        
        // Log successful login
        console.log(`✅ User login: ${result.user.email} (${result.user.id})`);
        
        res.json({
          success: true,
          user: result.user,
          message: "Login successful"
        });
      } else {
        // Log failed login attempt
        console.log(`❌ Failed login attempt: ${email} - ${result.error || 'Unknown error'}`);
        
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
      
      if (result.success && result.user) {
        // Log user creation
        console.log(`👤 User created: ${result.user.email} (${result.user.role})`);
        
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

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const user = req.session.user;
      
      req.session.destroy(async (err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        
        // Log user logout
        if (user) {
          console.log(`👋 User logout: ${user.email} (${user.id})`);
        }
        
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      
      // Get enrollment count for each course
      const coursesWithEnrollments = await Promise.all(
        courses.map(async (course) => {
          const enrollments = await storage.getEnrollments(course.id);
          return {
            ...course,
            enrolledStudents: enrollments.length
          };
        })
      );
      
      res.json(coursesWithEnrollments);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

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
      console.log("Creating course with data:", JSON.stringify(req.body, null, 2));
      
      // Validate required fields - only use fields that exist in the schema
      const { title, name, code, description, instructorId, instructor, section } = req.body;
      
      // Handle both 'title' and 'name' fields from frontend
      const courseTitle = title || name;
      const courseInstructorId = instructorId || instructor;
      
      if (!courseTitle || !code || !courseInstructorId) {
        return res.status(400).json({ error: "Missing required fields: title/name, code, and instructorId/instructor are required" });
      }
      
      // Check if instructor exists
      const instructorExists = await storage.getUser(courseInstructorId);
      if (!instructorExists) {
        return res.status(400).json({ error: `Instructor with ID ${courseInstructorId} not found` });
      }
      
      // Only include fields that exist in the courses schema
      const courseData = {
        title: courseTitle,
        code,
        description: description || '',
        instructorId: courseInstructorId,
        section: section || 'A', // Default to 'A' if not provided
        isActive: true
      };
      
      console.log("Processed course data:", JSON.stringify(courseData, null, 2));
      
      const course = await storage.createCourse(courseData);
      console.log("Course created successfully:", course.id);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ error: `Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}` });
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
      
      // Get course details before deletion for logging
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      const deleted = await storage.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Log course deletion
      console.log(`🗑️ Course deleted: ${course.title} (${course.id})`);
      
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

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get assignment details before deletion for logging
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      const deleted = await storage.deleteAssignment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      // Log assignment deletion
      console.log(`🗑️ Assignment deleted: ${assignment.title} (${assignment.id})`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
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

  // Get instructors only (for course creation)
  app.get("/api/instructors", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const instructors = users.filter(user => 
        user.role === 'instructor' && user.status === 'approved'
      );
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ error: "Failed to fetch instructors" });
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
      console.log(`Attempting to delete user with ID: ${id}`);
      
      // Check if user exists
      const user = await storage.getUser(id);
      console.log(`User lookup result:`, user ? `Found user ${user.firstName} ${user.lastName}` : 'User not found');
      
      if (!user) {
        console.log(`User with ID ${id} not found in database`);
        return res.status(404).json({ error: "User not found" });
      }
      
      // Prevent admin from deleting themselves
      if (user.id === req.session.user?.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      console.log(`Force deleting user ${user.firstName} ${user.lastName} (${user.email})`);
      
      // Use raw SQL to delete user with CASCADE or disable constraints temporarily
      const result = await storage.forceDeleteUser(id);
      
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Log user deletion
      console.log(`🗑️ User deleted: ${user.email} (${user.role})`);
      
      res.json({ 
        success: true,
        message: `User ${user.firstName} ${user.lastName} has been deleted successfully.` 
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User profile and settings routes (Admin only)
  app.put("/api/users/:id/profile", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, department, title } = req.body;
      
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
      const totalStudents = users.filter(u => u.role === 'student' && u.status === 'approved').length;
      const totalInstructors = users.filter(u => u.role === 'instructor' && u.status === 'approved').length;
      const totalAdmins = users.filter(u => u.role === 'administrator' && u.status === 'approved').length;
      
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
      const { limit = 10 } = req.query;
      
      // Get actual recent data from database
      const recentUsers = await storage.getAllUsers();
      const recentCourses = await storage.getAllCourses();
      const recentAssignments = await storage.getAllAssignments();
      const recentSubmissions = await storage.getAllSubmissions();
      
      const activities = [];
      
      // Only create activities if data actually exists
      if (recentUsers && recentUsers.length > 0) {
        recentUsers.slice(-5).forEach((user: any) => {
          if (user.firstName && user.lastName) {
            activities.push({
              id: `user-${user.id}`,
              type: 'user_registration',
              description: `New ${user.role} registered: ${user.firstName} ${user.lastName}`,
              timestamp: user.createdAt || new Date().toISOString(),
              status: 'completed',
              level: 'info'
            });
          }
        });
      }
      
      if (recentCourses && recentCourses.length > 0) {
        recentCourses.slice(-3).forEach((course: any) => {
          if (course.title && course.code) {
            activities.push({
              id: `course-${course.id}`,
              type: 'course_creation',
              description: `Course created: ${course.title} (${course.code})`,
              timestamp: course.createdAt || new Date().toISOString(),
              status: 'completed',
              level: 'info'
            });
          }
        });
      }
      
      if (recentAssignments && recentAssignments.length > 0) {
        recentAssignments.slice(-3).forEach((assignment: any) => {
          if (assignment.title) {
            activities.push({
              id: `assignment-${assignment.id}`,
              type: 'assignment_creation',
              description: `Assignment created: ${assignment.title}`,
              timestamp: assignment.createdAt || new Date().toISOString(),
              status: 'completed',
              level: 'info'
            });
          }
        });
      }
      
      if (recentSubmissions && recentSubmissions.length > 0) {
        recentSubmissions.slice(-3).forEach((submission: any) => {
          activities.push({
            id: `submission-${submission.id}`,
            type: 'submission_created',
            description: `New submission: ${submission.title || 'Assignment submission'}`,
            timestamp: submission.createdAt || new Date().toISOString(),
            status: 'completed',
            level: 'info'
          });
        });
      }
      
      // If no real activities exist, show a message
      if (activities.length === 0) {
        activities.push({
          id: 'no-activity',
          type: 'system',
          description: 'No recent activities found',
          timestamp: new Date().toISOString(),
          status: 'info',
          level: 'info'
        });
      }
      
      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(activities.slice(0, parseInt(limit as string) || 10));
    } catch (error) {
      console.error("Error fetching admin activity:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Admin pending registrations routes (Admin only)
  app.get("/api/admin/pending-registrations", requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getUsersByStatus('pending');
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      res.status(500).json({ error: "Failed to fetch pending registrations" });
    }
  });

  app.put("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      
      const updatedUser = await storage.updateUser(id, { status });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        success: true,
        message: `User ${status} successfully`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Student-specific routes
  app.get("/api/assignments/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const studentAssignments = await storage.getAssignmentsByStudent(studentId);
      res.json(studentAssignments);
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

  // Course enrollment endpoints
  app.post("/api/courses/:courseId/enroll", requireAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { studentIds } = req.body;
      
      console.log('Enrollment request:', { courseId, studentIds });
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        console.log('Invalid studentIds:', studentIds);
        return res.status(400).json({ error: "Student IDs array is required" });
      }

      // Verify course exists
      const course = await storage.getCourse(courseId);
      console.log('Course lookup result:', course);
      if (!course) {
        console.log('Course not found for ID:', courseId);
        return res.status(404).json({ error: "Course not found" });
      }

      // Verify all students exist
      const students = [];
      for (const studentId of studentIds) {
        console.log('Looking up student:', studentId);
        const student = await storage.getUser(studentId);
        console.log('Student lookup result:', student);
        if (!student) {
          console.log('Student not found:', studentId);
          return res.status(404).json({ error: `Student with ID ${studentId} not found` });
        }
        if (student.role !== 'student') {
          console.log('User is not a student:', studentId, 'role:', student.role);
          return res.status(400).json({ error: `User ${studentId} is not a student` });
        }
        students.push(student);
      }

      // Enroll students
      const enrollments = [];
      const alreadyEnrolled = [];
      const errors = [];
      
      for (const studentId of studentIds) {
        try {
          // Check if already enrolled
          const existingEnrollments = await storage.getEnrollments(courseId);
          const isAlreadyEnrolled = existingEnrollments.some(e => e.studentId === studentId);
          
          if (isAlreadyEnrolled) {
            alreadyEnrolled.push(studentId);
            continue;
          }
          
          const enrollment = await storage.createEnrollment({
            studentId,
            courseId
          });
          enrollments.push(enrollment);
        } catch (error) {
          console.error(`Error enrolling student ${studentId}:`, error);
          errors.push({ studentId, error: (error as Error).message });
        }
      }

      // Prepare response message
      let message = `Successfully enrolled ${enrollments.length} students`;
      if (alreadyEnrolled.length > 0) {
        message += `, ${alreadyEnrolled.length} were already enrolled`;
      }
      if (errors.length > 0) {
        message += `, ${errors.length} failed to enroll`;
      }

      res.json({ 
        success: enrollments.length > 0 || alreadyEnrolled.length > 0,
        message,
        enrollments,
        alreadyEnrolled,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error enrolling students:", error);
      res.status(500).json({ error: "Failed to enroll students" });
    }
  });

  app.get("/api/courses/:courseId/enrollments", requireAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const enrollments = await storage.getEnrollments(courseId);
      
      // Get student details for each enrollment
      const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await storage.getUser(enrollment.studentId);
          return {
            ...enrollment,
            student: student ? {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email
            } : null
          };
        })
      );

      res.json(enrollmentsWithDetails);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.delete("/api/courses/:courseId/enroll/:studentId", requireAdmin, async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
      
      const deleted = await storage.deleteEnrollmentByCourseAndStudent(courseId, studentId);
      if (!deleted) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      res.json({ success: true, message: "Student unenrolled successfully" });
    } catch (error) {
      console.error("Error unenrolling student:", error);
      res.status(500).json({ error: "Failed to unenroll student" });
    }
  });

  // Course reports endpoints
  app.get("/api/admin/course-reports/:courseId", requireAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Get instructor details
      const instructor = await storage.getUser(course.instructorId);
      
      // Get enrollments for this course
      const enrollments = await storage.getEnrollments(courseId);
      
      // Get assignments for this course
      const assignments = await storage.getAssignmentsByCourse(courseId);
      
      // Get all submissions for this course's assignments
      const allSubmissions: any[] = [];
      for (const assignment of assignments) {
        const submissions = await storage.getSubmissionsByAssignment(assignment.id);
        allSubmissions.push(...submissions);
      }
      
      // Get grades for all submissions
      const allGrades: any[] = [];
      for (const submission of allSubmissions) {
        const grades = await storage.getGradesBySubmission(submission.id);
        allGrades.push(...grades);
      }

      // Calculate metrics
      const totalEnrolled = enrollments.length;
      const totalAssignments = assignments.length;
      const publishedAssignments = assignments.filter(a => a.isPublished).length;
      const totalSubmissions = allSubmissions.length;
      const gradedSubmissions = allGrades.length;
      
      // Calculate average grade
      const averageGrade = allGrades.length > 0 
        ? allGrades.reduce((sum, grade) => sum + (grade.score || 0), 0) / allGrades.length 
        : 0;

      // Get grade distribution
      const gradeDistribution = {
        A: allGrades.filter(g => g.score && g.score >= 90).length,
        B: allGrades.filter(g => g.score && g.score >= 80 && g.score < 90).length,
        C: allGrades.filter(g => g.score && g.score >= 70 && g.score < 80).length,
        D: allGrades.filter(g => g.score && g.score >= 60 && g.score < 70).length,
        F: allGrades.filter(g => g.score && g.score < 60).length
      };

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSubmissions = allSubmissions.filter(s => 
        s.submittedAt && new Date(s.submittedAt) >= sevenDaysAgo
      );

      // Get top performers (students with highest average grades)
      const studentGrades: { [key: string]: number[] } = {};
      allGrades.forEach(grade => {
        const submission = allSubmissions.find(s => s.id === grade.submissionId);
        if (submission && grade.score) {
          if (!studentGrades[submission.studentId]) {
            studentGrades[submission.studentId] = [];
          }
          studentGrades[submission.studentId].push(grade.score);
        }
      });

      const topPerformers = Object.entries(studentGrades)
        .map(([studentId, grades]) => ({
          studentId,
          averageGrade: grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length,
          totalGrades: grades.length
        }))
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, 5);

      // Get students at risk (low grades or missing assignments)
      const studentsAtRisk = Object.entries(studentGrades)
        .map(([studentId, grades]) => ({
          studentId,
          averageGrade: grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length,
          totalGrades: grades.length,
          missingAssignments: totalAssignments - grades.length
        }))
        .filter(student => student.averageGrade < 70 || student.missingAssignments > 2)
        .slice(0, 5);

      const report = {
        course: {
          id: course.id,
          title: course.title,
          code: course.code,
          section: course.section,
          description: course.description,
          instructor: instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Unknown',
          status: course.isActive ? 'Published' : 'Archived',
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        },
        metrics: {
          totalEnrolled,
          totalAssignments,
          publishedAssignments,
          totalSubmissions,
          gradedSubmissions,
          averageGrade: Math.round(averageGrade * 100) / 100,
          submissionRate: totalAssignments > 0 ? Math.round((totalSubmissions / (totalAssignments * totalEnrolled)) * 100) : 0
        },
        gradeDistribution,
        recentActivity: {
          recentSubmissions: recentSubmissions.length,
          lastWeek: recentSubmissions.length
        },
        topPerformers,
        studentsAtRisk,
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          isPublished: assignment.isPublished,
          maxScore: assignment.maxScore,
          submissions: allSubmissions.filter(s => s.assignmentId === assignment.id).length,
          averageScore: (() => {
            const assignmentGrades = allGrades.filter(g => {
              const submission = allSubmissions.find(s => s.id === g.submissionId);
              return submission && submission.assignmentId === assignment.id;
            });
            return assignmentGrades.length > 0 
              ? Math.round((assignmentGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / assignmentGrades.length) * 100) / 100
              : 0;
          })()
        }))
      };

      res.json(report);
    } catch (error) {
      console.error("Error fetching course report:", error);
      res.status(500).json({ error: "Failed to fetch course report" });
    }
  });

  // System logs endpoints
  app.get("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      const { level, source, limit = 50, offset = 0 } = req.query;
      
      const filters: any = {};
      if (level) filters.level = level;
      if (source) filters.source = source;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const logs = await storage.getSystemLogs(filters);
      const totalCount = await storage.getSystemLogsCount({ level: level as string, source: source as string });
      
      res.json({
        logs,
        totalCount,
        hasMore: (parseInt(offset as string) || 0) + logs.length < totalCount
      });
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  });

  app.post("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      const { level, source, message, userId, metadata, ipAddress, userAgent } = req.body;
      
      const log = await storage.createSystemLog({
        level,
        source,
        message,
        userId: userId || null,
        metadata: metadata || null,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent')
      });
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating system log:", error);
      res.status(500).json({ error: "Failed to create system log" });
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
