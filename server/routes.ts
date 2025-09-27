import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertMaterialSchema, insertSubmissionSchema } from "@shared/schema";
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
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(400).json({ error: "Failed to create announcement" });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAnnouncement = await storage.updateAnnouncement(id, req.body);
      if (!updatedAnnouncement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(400).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ error: "Announcement not found" });
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
      res.status(500).json({ error: "Internal server error" });
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
