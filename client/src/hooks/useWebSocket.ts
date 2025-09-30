import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  userId?: string;
  userRole?: 'student' | 'instructor' | 'administrator';
  courseIds?: string[];
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { userId, userRole, courseIds = [], onMessage, reconnectInterval = 3000 } = options;
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        if (userId && userRole) {
          ws.current?.send(JSON.stringify({
            type: 'auth',
            userId,
            userRole,
          }));

          courseIds.forEach((courseId) => {
            ws.current?.send(JSON.stringify({
              type: 'subscribe_course',
              courseId,
            }));
          });
        }

        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (onMessage) {
            onMessage(message);
          }

          switch (message.type) {
            case 'chat_message':
              if (message.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['/api/chat/course', message.data.courseId] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
              break;
            case 'announcement_created':
              if (message.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['/api/announcements/course', message.data.courseId] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
              break;
            case 'assignment_updated':
              if (message.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['/api/courses', message.data.courseId] });
                queryClient.invalidateQueries({ queryKey: ['/api/courses', message.data.courseId, 'assignments'] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
              queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
              break;
            case 'grade_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
              queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
              break;
            case 'submission_created':
              if (message.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['/api/courses', message.data.courseId, 'submissions'] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
              queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
              break;
            case 'course_updated':
              if (message.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['/api/courses', message.data.courseId] });
              }
              queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        reconnectTimer.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [userId, userRole, courseIds, onMessage, reconnectInterval, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return {
    isConnected,
    send,
    reconnect: connect,
  };
}
