import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<'student' | 'instructor' | 'administrator'>().notNull(),
  studentId: text("student_id"), // Optional for students
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(), // e.g., "CS101" (no longer unique)
  section: text("section").notNull().default("A"), // e.g., "A", "B", "1", "2"
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint on code + section combination
  codeSectionUnique: unique("code_section_unique").on(table.code, table.section),
}));

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  maxScore: integer("max_score").default(100),
  dueDate: timestamp("due_date"),
  isPublished: boolean("is_published").default(false),
  rubric: jsonb("rubric"), // JSON object for grading criteria
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment submissions
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  content: text("content"), // Student's written submission
  fileName: text("file_name"), // If file uploaded
  filePath: text("file_path"), // Path to uploaded file
  status: text("status").$type<'draft' | 'submitted' | 'graded'>().default('draft'),
  embedding: jsonb("embedding"), // AI embedding for plagiarism detection
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grades and AI feedback
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => submissions.id),
  score: integer("score"),
  feedback: text("feedback"), // AI-generated feedback
  rubricScores: jsonb("rubric_scores"), // Detailed scoring per rubric criteria
  gradedBy: text("graded_by").$type<'ai' | 'instructor'>().default('ai'),
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isImportant: boolean("is_important").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Materials/Lessons table
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").$type<'lesson' | 'resource' | 'video' | 'document' | 'link'>().notNull(),
  content: text("content"), // For text-based materials
  filePath: text("file_path"), // For uploaded files
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  externalUrl: text("external_url"), // For links to external resources
  isPublished: boolean("is_published").default(false),
  orderIndex: integer("order_index").default(0), // For ordering materials
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plagiarism reports table
export const plagiarismReports = pgTable("plagiarism_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => submissions.id),
  matches: jsonb("matches").notNull(), // Array of {id, similarity, studentId, content}
  highestSimilarity: integer("highest_similarity").notNull(), // Highest similarity percentage
  isFlagged: boolean("is_flagged").default(false), // Whether to flag for review
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  submissions: many(submissions),
  chatMessages: many(chatMessages),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  assignments: many(assignments),
  announcements: many(announcements),
  materials: many(materials),
  chatMessages: many(chatMessages),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  submission: one(submissions, {
    fields: [grades.submissionId],
    references: [submissions.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [materials.createdBy],
    references: [users.id],
  }),
}));

export const plagiarismReportsRelations = relations(plagiarismReports, ({ one }) => ({
  submission: one(submissions, {
    fields: [plagiarismReports.submissionId],
    references: [submissions.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  course: one(courses, {
    fields: [chatMessages.courseId],
    references: [courses.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  email: true,
  password: true,
  role: true,
  studentId: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  code: true,
  section: true,
  instructorId: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  courseId: true,
  title: true,
  description: true,
  instructions: true,
  maxScore: true,
  dueDate: true,
  rubric: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  studentId: true,
  content: true,
  fileName: true,
  filePath: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  courseId: true,
  title: true,
  content: true,
  isImportant: true,
  createdBy: true,
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  courseId: true,
  title: true,
  description: true,
  type: true,
  content: true,
  filePath: true,
  fileName: true,
  fileSize: true,
  externalUrl: true,
  isPublished: true,
  orderIndex: true,
  createdBy: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  courseId: true,
  senderId: true,
  content: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Grade = typeof grades.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type PlagiarismReport = typeof plagiarismReports.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;