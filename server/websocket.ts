import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { log } from './vite';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: 'student' | 'instructor' | 'administrator';
  subscribedCourses?: Set<string>;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<AuthenticatedWebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

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

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'auth':
        ws.userId = data.userId;
        ws.userRole = data.userRole;
        ws.send(JSON.stringify({ type: 'auth_success', userId: data.userId }));
        break;
      case 'subscribe_course':
        if (data.courseId && ws.subscribedCourses) {
          ws.subscribedCourses.add(data.courseId);
          ws.send(JSON.stringify({ type: 'subscribed', courseId: data.courseId }));
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
