import { 
  users, courses, assignments, submissions, enrollments, grades, announcements, materials, chatMessages, systemLogs, plagiarismReports,
  type User, type InsertUser, type Course, type InsertCourse,
  type Assignment, type InsertAssignment, type Submission, type InsertSubmission,
  type Enrollment, type Grade, type Announcement, type InsertAnnouncement,
  type Material, type InsertMaterial, type ChatMessage, type InsertChatMessage,
  type SystemLog, type InsertSystemLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  forceDeleteUser(id: string): Promise<boolean>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByStatus(status: string): Promise<User[]>;
  
  // User-related data operations (for deletion checks)
  getAnnouncementsByUser(userId: string): Promise<Announcement[]>;
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  getMaterialsByUser(userId: string): Promise<Material[]>;
  
  // Course operations
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByInstructor(instructorId: string): Promise<Course[]>;
  getEnrolledCourses(studentId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;
  
  // Enrollment operations
  enrollStudent(courseId: string, studentId: string): Promise<Enrollment>;
  createEnrollment(enrollment: Omit<Enrollment, 'id' | 'enrolledAt'>): Promise<Enrollment>;
  getEnrollments(courseId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourses(courseIds: string[]): Promise<Enrollment[]>;
  deleteEnrollment(id: string): Promise<boolean>;
  deleteEnrollmentByCourseAndStudent(courseId: string, studentId: string): Promise<boolean>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  getAssignmentsByCourses(courseIds: string[]): Promise<Assignment[]>;
  getAssignmentsByStudent(studentId: string): Promise<any[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: string): Promise<boolean>;
  
  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  deleteSubmission(id: string): Promise<boolean>;
  
  // Grade operations
  getGradeBySubmission(submissionId: string): Promise<Grade | undefined>;
  getAllGrades(): Promise<Grade[]>;
  createGrade(grade: Omit<Grade, 'id' | 'createdAt'>): Promise<Grade>;
  deleteGradesBySubmission(submissionId: string): Promise<boolean>;
  
  // Announcement operations
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  getAnnouncementsByCourse(courseId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
  
  // Material operations
  getMaterial(id: string): Promise<Material | undefined>;
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;

  // Chat message operations
  getChatMessagesByCourse(courseId: string): Promise<ChatMessage[]>;
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  
  // System logs operations
  getSystemLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogsCount(filters?: { level?: string; source?: string }): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    console.log(`Looking up user with ID: ${id}`);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    console.log(`getUser result:`, user ? `Found user ${user.firstName} ${user.lastName}` : 'No user found');
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role as 'student' | 'instructor' | 'administrator',
        studentId: insertUser.studentId || null,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      // Handle both SQLite and PostgreSQL result formats
      return (result as any).changes > 0 || (result as any).rowCount > 0;
    } catch (error) {
      console.error("Error in deleteUser:", error);
      return false;
    }
  }

  async forceDeleteUser(id: string): Promise<boolean> {
    try {
      console.log(`Force deleting user ${id}`);
      
      // First, check if user exists
      const user = await this.getUser(id);
      console.log(`User lookup in forceDeleteUser:`, user ? `Found user ${user.firstName} ${user.lastName}` : 'User not found');
      
      if (!user) {
        console.log(`User ${id} not found in forceDeleteUser`);
        return false;
      }
      
      // Use Drizzle ORM to delete related data in the correct order
      try {
        // 1. Delete grades (references submissions)
        await db.delete(grades).where(
          sql`submission_id IN (SELECT id FROM submissions WHERE student_id = ${id} OR assignment_id IN (SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})))`
        );
        
        // 2. Delete plagiarism reports (references submissions)
        await db.delete(plagiarismReports).where(
          sql`submission_id IN (SELECT id FROM submissions WHERE student_id = ${id} OR assignment_id IN (SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})))`
        );
        
        // 3. Delete submissions (references assignments and users)
        await db.delete(submissions).where(
          sql`student_id = ${id} OR assignment_id IN (SELECT id FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = ${id}))`
        );
        
        // 4. Delete assignments (references courses)
        await db.delete(assignments).where(
          sql`course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})`
        );
        
        // 5. Delete enrollments (references courses and users)
        await db.delete(enrollments).where(
          sql`student_id = ${id} OR course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})`
        );
        
        // 6. Delete materials (references courses and users)
        await db.delete(materials).where(
          sql`created_by = ${id} OR course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})`
        );
        
        // 7. Delete announcements (references courses and users)
        await db.delete(announcements).where(
          sql`created_by = ${id} OR course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})`
        );
        
        // 8. Delete chat messages (references courses and users)
        await db.delete(chatMessages).where(
          sql`sender_id = ${id} OR course_id IN (SELECT id FROM courses WHERE instructor_id = ${id})`
        );
        
        // 9. Delete courses (references users)
        await db.delete(courses).where(eq(courses.instructorId, id));
        
        // 10. Delete system logs (references users)
        await db.delete(systemLogs).where(eq(systemLogs.userId, id));
        
        // 11. Finally delete the user
        const result = await db.delete(users).where(eq(users.id, id));
        
        // Check if deletion was successful
        const success = (result as any).changes > 0 || (result as any).rowCount > 0;
        
        if (success) {
          console.log(`User ${id} and all related data deleted successfully`);
          return true;
        } else {
          console.log(`User ${id} deletion failed - no rows affected`);
          return false;
        }
        
      } catch (deleteError) {
        console.error("Error during deletion process:", deleteError);
        return false;
      }
      
    } catch (error) {
      console.error("Error in forceDeleteUser:", error);
      return false;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as 'student' | 'instructor' | 'administrator'));
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, status as 'pending' | 'approved' | 'rejected'));
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.instructorId, instructorId));
  }

  async getEnrolledCourses(studentId: string): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        code: courses.code,
        instructorId: courses.instructorId,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.studentId, studentId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const [deletedCourse] = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();
    return !!deletedCourse;
  }

  // Enrollment operations
  async enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ courseId, studentId })
      .returning();
    return enrollment;
  }

  async getEnrollments(courseId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments);
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async getAssignmentsByCourses(courseIds: string[]): Promise<Assignment[]> {
    if (courseIds.length === 0) return [];
    return await db.select().from(assignments).where(inArray(assignments.courseId, courseIds));
  }

  async getAssignmentsByStudent(studentId: string): Promise<any[]> {
    return await db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        title: assignments.title,
        description: assignments.description,
        instructions: assignments.instructions,
        maxScore: assignments.maxScore,
        dueDate: assignments.dueDate,
        isPublished: assignments.isPublished,
        rubric: assignments.rubric,
        createdAt: assignments.createdAt,
        updatedAt: assignments.updatedAt,
        courseCode: courses.code,
        courseTitle: courses.title,
        courseSection: courses.section,
        instructorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('instructorName')
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
      .innerJoin(users, eq(courses.instructorId, users.id))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(assignments.isPublished, true)
        )
      )
      .orderBy(assignments.dueDate, assignments.createdAt);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment || undefined;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  // Grade operations
  async getGradeBySubmission(submissionId: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.submissionId, submissionId));
    return grade || undefined;
  }

  async getGradesBySubmission(submissionId: string): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.submissionId, submissionId));
  }

  async getAllGrades(): Promise<Grade[]> {
    return await db.select().from(grades);
  }

  async createGrade(grade: Omit<Grade, 'id' | 'createdAt'>): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  // Announcement operations
  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async getAnnouncementsByCourse(courseId: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.courseId, courseId))
      .orderBy(announcements.createdAt);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement || undefined;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount > 0;
  }

  // Material operations
  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.courseId, courseId))
      .orderBy(materials.orderIndex, materials.createdAt);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return result.rowCount > 0;
  }

  // Chat message operations
  async getChatMessagesByCourse(courseId: string): Promise<ChatMessage[]> {
    return await db
      .select({
        id: chatMessages.id,
        courseId: chatMessages.courseId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        }
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.courseId, courseId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(chatMessage).returning();
    return newMessage;
  }

  // User-related data operations (for deletion checks)
  async getAnnouncementsByUser(userId: string): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.createdBy, userId));
  }

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getMaterialsByUser(userId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.createdBy, userId));
  }

  async deleteSubmission(id: string): Promise<boolean> {
    const result = await db.delete(submissions).where(eq(submissions.id, id));
    return result.rowCount > 0;
  }

  async createEnrollment(enrollment: Omit<Enrollment, 'id' | 'enrolledAt'>): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async deleteEnrollment(id: string): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id));
    return result.rowCount > 0;
  }

  async deleteEnrollmentByCourseAndStudent(courseId: string, studentId: string): Promise<boolean> {
    const result = await db.delete(enrollments)
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.studentId, studentId)
      ));
    return result.rowCount > 0;
  }

  async deleteGradesBySubmission(submissionId: string): Promise<boolean> {
    const result = await db.delete(grades).where(eq(grades.submissionId, submissionId));
    return result.rowCount > 0;
  }

  async getEnrollmentsByCourses(courseIds: string[]): Promise<Enrollment[]> {
    if (courseIds.length === 0) return [];
    return await db.select().from(enrollments).where(inArray(enrollments.courseId, courseIds));
  }

  // System logs operations
  async getSystemLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<SystemLog[]> {
    let query = db.select().from(systemLogs);
    
    if (filters?.level) {
      query = query.where(eq(systemLogs.level, filters.level as 'info' | 'warning' | 'error' | 'debug'));
    }
    
    if (filters?.source) {
      query = query.where(eq(systemLogs.source, filters.source));
    }
    
    query = query.orderBy(systemLogs.createdAt);
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [newLog] = await db
      .insert(systemLogs)
      .values({
        ...log,
        level: log.level as 'info' | 'warning' | 'error' | 'debug',
        userId: log.userId || null,
        metadata: log.metadata || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
      })
      .returning();
    return newLog;
  }

  async getSystemLogsCount(filters?: { level?: string; source?: string }): Promise<number> {
    let query = db.select().from(systemLogs);
    
    if (filters?.level) {
      query = query.where(eq(systemLogs.level, filters.level as 'info' | 'warning' | 'error' | 'debug'));
    }
    
    if (filters?.source) {
      query = query.where(eq(systemLogs.source, filters.source));
    }
    
    const result = await query;
    return result.length;
  }
}

export const storage = new DatabaseStorage();
