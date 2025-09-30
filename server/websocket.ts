import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';
import { log } from './vite';
import { storage } from './storage';
import { db } from './db';
import { enrollments } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: 'student' | 'instructor' | 'administrator';
  subscribedCourses?: Set<string>;
  allowedCourses?: Set<string>;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<AuthenticatedWebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: async (info, callback) => {
        // For now, accept all connections
        // Session validation will happen after connection via auth message
        callback(true);
      }
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      log('WebSocket client connected');
      ws.subscribedCourses = new Set();
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    log('WebSocket server initialized on /ws');
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'auth':
        await this.authenticateSocket(ws, data.userId, data.userRole);
        break;
      case 'subscribe_course':
        if (data.courseId && ws.subscribedCourses && ws.allowedCourses) {
          if (ws.allowedCourses.has(data.courseId)) {
            ws.subscribedCourses.add(data.courseId);
            ws.send(JSON.stringify({ type: 'subscribed', courseId: data.courseId }));
          } else {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Access denied to course',
              courseId: data.courseId 
            }));
          }
        } else if (!ws.userId) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Authentication required before subscribing to courses' 
          }));
        }
        break;
      case 'unsubscribe_course':
        if (data.courseId && ws.subscribedCourses) {
          ws.subscribedCourses.delete(data.courseId);
          ws.send(JSON.stringify({ type: 'unsubscribed', courseId: data.courseId }));
        }
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private async authenticateSocket(ws: AuthenticatedWebSocket, userId: string, userRole: string) {
    try {
      // Verify user exists in database
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== userRole) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Invalid user credentials' 
        }));
        ws.close();
        return;
      }

      ws.userId = userId;
      ws.userRole = userRole as 'student' | 'instructor' | 'administrator';
      ws.allowedCourses = new Set();

      // Load user's allowed courses based on role
      if (userRole === 'student') {
        const studentEnrollments = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.studentId, userId));
        studentEnrollments.forEach((enrollment: { courseId: string }) => {
          ws.allowedCourses?.add(enrollment.courseId);
        });
      } else if (userRole === 'instructor') {
        const courses = await storage.getCoursesByInstructor(userId);
        courses.forEach(course => {
          ws.allowedCourses?.add(course.id);
        });
      } else if (userRole === 'administrator') {
        // Admins have access to all courses
        const allCourses = await storage.getAllCourses();
        allCourses.forEach(course => {
          ws.allowedCourses?.add(course.id);
        });
      }

      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        userId: userId,
        allowedCourses: Array.from(ws.allowedCourses)
      }));
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  broadcast(event: string, data: any, filter?: (ws: AuthenticatedWebSocket) => boolean) {
    const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (!filter || filter(client)) {
          client.send(message);
        }
      }
    });
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.broadcast(event, data, (ws) => ws.userId === userId);
  }

  broadcastToCourse(courseId: string, event: string, data: any) {
    this.broadcast(event, { ...data, courseId }, (ws) => {
      return ws.subscribedCourses?.has(courseId) || false;
    });
  }

  notifyAssignmentUpdate(assignmentId: string, courseId: string, data: any) {
    this.broadcastToCourse(courseId, 'assignment_updated', { assignmentId, ...data });
  }

  notifyGradeUpdate(studentId: string, assignmentId: string, data: any) {
    this.broadcastToUser(studentId, 'grade_updated', { assignmentId, ...data });
  }

  notifyChatMessage(courseId: string, message: any) {
    this.broadcastToCourse(courseId, 'chat_message', message);
  }

  notifyAnnouncementCreated(courseId: string, announcement: any) {
    this.broadcastToCourse(courseId, 'announcement_created', announcement);
  }

  notifyCourseUpdate(courseId: string, data: any) {
    this.broadcastToCourse(courseId, 'course_updated', data);
  }

  notifySubmissionCreated(courseId: string, assignmentId: string, submission: any) {
    this.broadcastToCourse(courseId, 'submission_created', { assignmentId, ...submission });
  }
}

export let wsService: WebSocketService;

export function initializeWebSocket(server: Server): WebSocketService {
  wsService = new WebSocketService(server);
  return wsService;
}
