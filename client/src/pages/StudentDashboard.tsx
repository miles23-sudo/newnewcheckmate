import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, FileText, Settings, BarChart3, Calendar, Eye, Clock, Edit, Trash2, CheckCircle, Menu, Megaphone, MessageSquare, Bell, Save, Upload, Download, Shield, Mail, Bell as BellIcon, Palette, Globe, Lock, Key, Trash, AlertTriangle, CheckCircle2, Camera, ChevronLeft, ChevronRight, ChevronDown, X, User, LogOut, Home, GraduationCap, BookOpenCheck, Target, Award, TrendingUp, Plus, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { useUser } from "@/contexts/UserContext";

// Mock user data - will be replaced with actual authentication
const mockStudent = {
  id: "1",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@ollc.edu",
  role: "student" as const,
};

// Mock enrolled courses data
const mockEnrolledCourses = [
  {
    id: "bsit-y2",
    code: "BSIT",
    title: "Y2",
    instructor: "Dr. Maria Martinez",
    progress: 75,
    currentGrade: 88,
    nextDue: "3 days",
    isActive: true
  },
  {
    id: "discrete-structures",
    code: "Discrete Structures",
    title: "SY23-24 Y2B",
    instructor: "Dr. John Smith",
    progress: 60,
    currentGrade: 92,
    nextDue: "1 week",
    isActive: false
  },
  {
    id: "lite-bsit",
    code: "LITE BSIT Y2-B",
    title: "",
    instructor: "Dr. Sarah Johnson",
    progress: 45,
    currentGrade: 85,
    nextDue: "5 days",
    isActive: false
  },
  {
    id: "bsit-1b",
    code: "BSIT 1B (10:30 AM-1:30 PM)",
    title: "Art Appreciation",
    instructor: "Dr. Alex Chen",
    progress: 30,
    currentGrade: 78,
    nextDue: "2 days",
    isActive: false
  },
  {
    id: "ethics-bsit",
    code: "ETHICS || BSIT @OLLC",
    title: "SECT B",
    instructor: "Dr. Lisa Wang",
    progress: 55,
    currentGrade: 90,
    nextDue: "4 days",
    isActive: false
  }
];

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();

  // Query to fetch student's enrolled courses with auto-refresh every 5 seconds
  const { data: enrolledCourses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses/student', user?.id],
    queryFn: () => fetch(`/api/courses/student/${user?.id}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
  
  // Initialize tab from URL hash, localStorage, or default to 'overview'
  const getInitialTab = (): 'overview' | 'courses' | 'assignments' | 'grades' | 'settings' => {
    // Check URL hash first
    const hash = window.location.hash.replace('#', '');
    if (['overview', 'courses', 'assignments', 'grades', 'settings'].includes(hash)) {
      return hash as 'overview' | 'courses' | 'assignments' | 'grades' | 'settings';
    }
    
    // Fall back to localStorage
    const savedTab = localStorage.getItem('student-dashboard-tab');
    if (savedTab && ['overview', 'courses', 'assignments', 'grades', 'settings'].includes(savedTab)) {
      return savedTab as 'overview' | 'courses' | 'assignments' | 'grades' | 'settings';
    }
    
    // Default to overview
    return 'overview';
  };

  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'assignments' | 'grades' | 'settings'>(getInitialTab());

  // Set initial URL hash if not present
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (!currentHash || !['overview', 'courses', 'assignments', 'grades', 'settings'].includes(currentHash)) {
      window.history.replaceState(null, '', `#${selectedTab}`);
    }
  }, []); // Run only on mount
  
  // Custom function to handle tab changes with URL and localStorage persistence
  const handleTabChange = (tab: 'overview' | 'courses' | 'assignments' | 'grades' | 'settings') => {
    setSelectedTab(tab);
    // Update URL hash
    window.history.pushState(null, '', `#${tab}`);
    // Save to localStorage as backup
    localStorage.setItem('student-dashboard-tab', tab);
  };

  // Listen for hash changes (browser back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'courses', 'assignments', 'grades', 'settings'].includes(hash)) {
        setSelectedTab(hash as 'overview' | 'courses' | 'assignments' | 'grades' | 'settings');
        localStorage.setItem('student-dashboard-tab', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Set default course for chat when courses load
  useEffect(() => {
    if (enrolledCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(enrolledCourses[0].id);
    }
  }, [enrolledCourses, selectedCourseId]);

  // Query to fetch chat messages for selected course
  const { data: chatMessages = [], isLoading: isChatLoading, refetch: refetchChatMessages } = useQuery({
    queryKey: ['/api/chat/course', selectedCourseId],
    queryFn: () => fetch(`/api/chat/course/${selectedCourseId}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!selectedCourseId,
    refetchInterval: 5000, // Auto-refresh chat messages every 5 seconds
  });

  // Query to fetch announcements for notification generation
  const { data: allAnnouncements = [] } = useQuery({
    queryKey: ['/api/announcements', 'all-courses'],
    queryFn: async () => {
      if (!enrolledCourses.length) return [];
      const promises = enrolledCourses.map((course: any) =>
        fetch(`/api/announcements/course/${course.id}`, { credentials: 'include' }).then(r => r.json())
      );
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!enrolledCourses.length,
    refetchInterval: 5000, // Auto-refresh announcements every 5 seconds
  });

  // Query to fetch assignments for notification generation
  const { data: allAssignments = [] } = useQuery({
    queryKey: ['/api/assignments', 'all-courses'],
    queryFn: async () => {
      if (!enrolledCourses.length) return [];
      const promises = enrolledCourses.map((course: any) =>
        fetch(`/api/assignments/course/${course.id}`, { credentials: 'include' }).then(r => r.json())
      );
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!enrolledCourses.length,
    refetchInterval: 5000, // Auto-refresh assignments every 5 seconds
  });

  // Query to fetch student assignments for the assignments tab
  const { data: studentAssignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['/api/assignments/student', user?.id],
    queryFn: () => fetch(`/api/assignments/student/${user?.id}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh assignments every 5 seconds
  });

  // Fetch student grades
  const { data: studentGrades = [], isLoading: isGradesLoading } = useQuery({
    queryKey: ['/api/grades/student', user?.id],
    queryFn: () => fetch(`/api/grades/student/${user?.id}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh grades every 5 seconds
  });

  // Settings state management
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    major: 'Computer Science'
  });

  // Update profile settings when user data changes
  useEffect(() => {
    if (user) {
      setProfileSettings({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        major: 'Computer Science'
      });
    }
  }, [user]);
  
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Mock notifications data with state management
  // Generate base notifications from course data (immutable)
  const baseNotifications = useMemo(() => {
    const notifications: any[] = [];
    
    if (!enrolledCourses.length) return notifications;

    // Generate notifications from real announcements
    allAnnouncements.forEach((announcement: any) => {
      const course = enrolledCourses.find((c: any) => c.id === announcement.courseId);
      if (course) {
        const timeSince = new Date(announcement.createdAt);
        const hoursAgo = Math.floor((Date.now() - timeSince.getTime()) / (1000 * 60 * 60));
        
        notifications.push({
          id: `announcement-${announcement.id}`,
          type: announcement.isImportant ? "warning" : "info",
          title: "New Announcement",
          message: `${course.code}: ${announcement.title}`,
          timestamp: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
          isRead: false,
          priority: announcement.isImportant ? "high" : "medium",
          courseId: course.id,
          sourceId: announcement.id,
          sourceType: 'announcement'
        });
      }
    });

    // Generate notifications from assignments
    allAssignments.forEach((assignment: any) => {
      const course = enrolledCourses.find((c: any) => c.id === assignment.courseId);
      if (course && assignment.isPublished) {
        const timeSince = new Date(assignment.createdAt);
        const hoursAgo = Math.floor((Date.now() - timeSince.getTime()) / (1000 * 60 * 60));
        
        // New assignment notification
        notifications.push({
          id: `assignment-${assignment.id}`,
          type: "info",
          title: "New Assignment",
          message: `${course.code}: ${assignment.title}`,
          timestamp: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
          isRead: false,
          priority: "medium",
          courseId: course.id,
          sourceId: assignment.id,
          sourceType: 'assignment'
        });

        // Due date warning if assignment has a due date
        if (assignment.dueDate) {
          const dueDate = new Date(assignment.dueDate);
          const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 3 && daysUntilDue >= 0) {
            notifications.push({
              id: `due-${assignment.id}`,
              type: "warning",
              title: "Assignment Due Soon",
              message: `${course.code}: ${assignment.title} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
              timestamp: "Now",
              isRead: false,
              priority: "high", 
              courseId: course.id,
              sourceId: assignment.id,
              sourceType: 'assignment-due'
            });
          }
        }
      }
    });

    // Sort by priority and date
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }, [enrolledCourses, allAnnouncements, allAssignments]);

  // Persistent notification UI state (read/deleted)
  const [notificationState, setNotificationState] = useState<{
    readIds: Set<string>;
    deletedIds: Set<string>;
  }>(() => {
    const saved = localStorage.getItem('student-notification-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        readIds: new Set(parsed.readIds || []),
        deletedIds: new Set(parsed.deletedIds || [])
      };
    }
    return { readIds: new Set(), deletedIds: new Set() };
  });

  // Save notification state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('student-notification-state', JSON.stringify({
      readIds: Array.from(notificationState.readIds),
      deletedIds: Array.from(notificationState.deletedIds)
    }));
  }, [notificationState]);

  // Merge base notifications with UI state
  const notifications = useMemo(() => {
    return baseNotifications
      .filter(notification => !notificationState.deletedIds.has(notification.id))
      .map(notification => ({
        ...notification,
        isRead: notificationState.readIds.has(notification.id)
      }));
  }, [baseNotifications, notificationState]);

  const handleLogout = () => {
    // Use the logout function from context
    logout();
    
    // Navigate back to login page
    setLocation('/login');
  };

  const handleCourseClick = (courseId: string) => {
    setLocation(`/class/${courseId}`);
  };

  // Notification handlers - now work with persistent state
  const markNotificationAsRead = (notificationId: string) => {
    setNotificationState(prev => ({
      ...prev,
      readIds: new Set([...prev.readIds, notificationId])
    }));
  };

  const deleteNotification = (notificationId: string) => {
    setNotificationState(prev => ({
      ...prev,
      deletedIds: new Set([...prev.deletedIds, notificationId])
    }));
  };

  const markAllAsRead = () => {
    const allNotificationIds = notifications.map(n => n.id);
    setNotificationState(prev => ({
      ...prev,
      readIds: new Set([...prev.readIds, ...allNotificationIds])
    }));
  };

  // Chat handlers
  const sendMessage = async () => {
    if (chatMessage.trim() && user && selectedCourseId) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            courseId: selectedCourseId,
            senderId: user.id,
            content: chatMessage.trim()
          })
        });

        if (response.ok) {
          // Clear input and refetch messages to get the new message
          setChatMessage("");
          refetchChatMessages();
        } else {
          console.error('Failed to send message');
          toast({
            title: "Error",
            description: "Failed to send message. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error", 
          description: "Failed to send message. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  };

  // Settings save handlers
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsProfileSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileSettings),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate assignments due this week
  const assignmentsDueThisWeek = useMemo(() => {
    if (!studentAssignments.length) return 0;
    
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return studentAssignments.filter((assignment: any) => {
      if (!assignment.dueDate) return false;
      const dueDate = new Date(assignment.dueDate);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    }).length;
  }, [studentAssignments]);

  // Calculate study statistics from real data
  const studyStats = useMemo(() => {
    const completedAssignments = studentAssignments.filter((assignment: any) => 
      assignment.status === 'submitted' || assignment.status === 'graded'
    ).length;
    
    const totalSubmissions = studentGrades.length;
    
    // Calculate average grade
    const averageGrade = studentGrades.length > 0 
      ? studentGrades.reduce((sum: number, grade: any) => sum + (grade.score || 0), 0) / studentGrades.length
      : 0;
    
    // Calculate current streak (simplified - based on recent submissions)
    const recentSubmissions = studentGrades.filter((grade: any) => {
      const gradedAt = new Date(grade.gradedAt || grade.createdAt);
      const daysDiff = Math.floor((Date.now() - gradedAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7; // Last 7 days
    }).length;
    
    return {
      completedAssignments,
      totalSubmissions,
      averageGrade: Math.round(averageGrade * 10) / 10,
      currentStreak: Math.min(recentSubmissions, 30) // Cap at 30 days
    };
  }, [studentAssignments, studentGrades]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentsDueThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Learning Progress</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
              <CardDescription>Your progress across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.map((course: any) => {
                  // Calculate progress based on completed assignments
                  const courseAssignments = studentAssignments.filter((assignment: any) => 
                    assignment.courseId === course.id
                  );
                  const completedAssignments = courseAssignments.filter((assignment: any) => 
                    assignment.status === 'submitted' || assignment.status === 'graded'
                  );
                  const progress = courseAssignments.length > 0 
                    ? Math.round((completedAssignments.length / courseAssignments.length) * 100)
                    : 0;
                  
                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{course.code || course.title}</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Study Statistics</CardTitle>
              <CardDescription>Your learning patterns and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Assignments Completed</span>
                  <span className="font-medium">{studyStats.completedAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Submissions</span>
                  <span className="font-medium">{studyStats.totalSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Grade</span>
                  <span className="font-medium">{studyStats.averageGrade > 0 ? `${studyStats.averageGrade}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Days</span>
                  <span className="font-medium">{studyStats.currentStreak} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Badge variant="outline">{enrolledCourses.length} courses</Badge>
      </div>
      
      {isCoursesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
          <span className="text-muted-foreground">Loading your courses...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrolledCourses.map((course: any, index: number) => (
          <Card 
            key={course.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCourseClick(course.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.code}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {course.title || 'No description available'}
                  </CardDescription>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  index === 0 ? 'bg-blue-600' : 
                  index === 1 ? 'bg-gray-500' : 
                  index === 2 ? 'bg-green-600' : 
                  index === 3 ? 'bg-gray-500' : 
                  'bg-blue-600'
                }`}>
                  {course.code.charAt(0)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {course.description || 'No description available'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <span>{course.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Grade: --</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Course ID: {course.id}</span>
                  <span>•</span>
                  <span>{course.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {enrolledCourses.length === 0 && !isCoursesLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Courses Enrolled</h3>
            <p className="text-muted-foreground text-center">
              You haven't enrolled in any courses yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {isAssignmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
          <span className="text-muted-foreground">Loading assignments...</span>
        </div>
      ) : studentAssignments.length > 0 ? (
        <div className="space-y-4">
          {studentAssignments.map((assignment: any) => {
            const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
            const isOverdue = dueDate && dueDate < new Date();
            const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            
            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.courseCode} - {assignment.courseTitle} ({assignment.courseSection})
                        {dueDate && (
                          <span className={isOverdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : ''}>
                            {' '}- Due {isOverdue ? 'Overdue' : daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isOverdue ? "destructive" : daysUntilDue <= 3 ? "secondary" : "outline"}>
                        {isOverdue ? 'Overdue' : daysUntilDue <= 3 ? 'Due Soon' : 'Not Started'}
                      </Badge>
                      <Badge variant="outline">
                        {assignment.maxScore} points
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {assignment.description}
                    </p>
                  )}
                  {assignment.instructions && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Instructions:</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignment.instructions}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Instructor: {assignment.instructorName}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assignments</h3>
            <p className="text-muted-foreground text-center">
              You don't have any assignments yet. Check back later or contact your instructors.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Calculate course grades by grouping submissions
  const courseGrades = useMemo(() => {
    if (!studentGrades.length || !enrolledCourses.length) return [];
    
    const gradesByCourse: { [courseId: string]: { grades: any[], courseInfo: any } } = {};
    
    // Group grades by course (now using courseId directly from API)
    studentGrades.forEach((grade: any) => {
      const courseId = grade.courseId;
      
      if (courseId) {
        const courseInfo = enrolledCourses.find((c: any) => c.id === courseId);
        if (courseInfo) {
          if (!gradesByCourse[courseId]) {
            gradesByCourse[courseId] = { grades: [], courseInfo };
          }
          gradesByCourse[courseId].grades.push(grade);
        }
      }
    });
    
    // Calculate average grades per course
    return Object.values(gradesByCourse).map(({ grades, courseInfo }) => {
      const totalScore = grades.reduce((sum, g) => sum + (g.score || 0), 0);
      const totalPossible = grades.reduce((sum, g) => sum + (g.maxScore || 100), 0);
      const average = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      
      return {
        ...courseInfo,
        averageGrade: average,
        totalGrades: grades.length
      };
    });
  }, [studentGrades, enrolledCourses]);

  const renderGrades = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Grades</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Transcript
        </Button>
      </div>
      
      {isGradesLoading || isCoursesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courseGrades.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courseGrades.map((course: any) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  {course.instructor} • {course.totalGrades} assignment{course.totalGrades !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    course.averageGrade >= 90 ? 'text-green-600' : 
                    course.averageGrade >= 80 ? 'text-blue-600' : 
                    course.averageGrade >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {course.averageGrade}%
                  </div>
                  <p className="text-sm text-muted-foreground">Current Grade</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No grades available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete assignments to see your grades here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );


  const renderSettings = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {/* Handle photo change */}}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, max 5MB
                </p>
              </div>
            </div>

            {/* Profile Form - Read-only for students */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileSettings.firstName}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileSettings.lastName}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileSettings.email}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={user?.studentId || ''}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={profileSettings.major}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700"
                />
              </div>
            </div>


            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Lock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Profile information is read-only for students. Contact an administrator to update your profile.
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Account Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Password</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 2 months ago</p>
              </div>
              <Button variant="outline" onClick={() => {/* Handle change password */}}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentSection('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">CHECKmate</span>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsNotificationsOpen(true)}
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsChatOpen(true)}
              data-testid="button-chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex bg-background border-r h-[calc(100vh-4rem)] flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                    </span>
                  </div>
                </div>
              )}
              {isSidebarCollapsed && (
                <div className="flex justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-8 w-8 p-0"
                data-testid="button-toggle-sidebar"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Button
              variant={selectedTab === 'overview' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => handleTabChange('overview')}
              data-testid="button-tab-overview"
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            {/* My Courses Section */}
            <Button
              variant={selectedTab === 'courses' ? "default" : "ghost"}
              onClick={() => {
                handleTabChange('courses');
                setIsCoursesExpanded(!isCoursesExpanded);
              }}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isSidebarCollapsed ? "My Courses" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">My Courses</span>
                  {isCoursesExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </>
              )}
            </Button>
            {!isSidebarCollapsed && isCoursesExpanded && (
              <div className="space-y-1 ml-6">
                {isCoursesLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading courses...</span>
                  </div>
                ) : (
                  enrolledCourses.map((course: any, index: number) => (
                    <Button
                    key={course.id}
                    variant="ghost"
                    onClick={() => handleCourseClick(course.id)}
                    className={`w-full justify-start h-auto p-2 ${
                      course.isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                      index === 0 ? 'bg-blue-600' : 
                      index === 1 ? 'bg-gray-500' : 
                      index === 2 ? 'bg-green-600' : 
                      index === 3 ? 'bg-gray-500' : 
                      'bg-blue-600'
                    }`}>
                      {course.code.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">
                        {course.code}
                      </div>
                      {course.title && (
                        <div className="text-xs text-muted-foreground truncate">
                          {course.title}
                        </div>
                      )}
                    </div>
                    </Button>
                  ))
                )}
              </div>
            )}
            <Button
              variant={selectedTab === 'assignments' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => handleTabChange('assignments')}
              data-testid="button-tab-assignments"
              title={isSidebarCollapsed ? "Assignments" : ""}
            >
              <FileText className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Assignments"}
            </Button>
            <Button
              variant={selectedTab === 'grades' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => handleTabChange('grades')}
              data-testid="button-tab-grades"
              title={isSidebarCollapsed ? "Grades" : ""}
            >
              <BarChart3 className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Grades"}
            </Button>
            <Button
              variant={selectedTab === 'settings' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => handleTabChange('settings')}
              data-testid="button-tab-settings"
              title={isSidebarCollapsed ? "Settings" : ""}
            >
              <Settings className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Settings"}
            </Button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t flex-shrink-0">
            <Button
              variant="ghost"
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={handleLogout}
              data-testid="button-logout"
              title={isSidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Logout"}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-6">
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'courses' && renderCourses()}
            {selectedTab === 'assignments' && renderAssignments()}
            {selectedTab === 'grades' && renderGrades()}
            {selectedTab === 'settings' && renderSettings()}
          </div>
        </main>
      </div>

      {/* Notifications Popover */}
      <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stay updated with your course activities
                </p>
              </div>
              {notifications.some(n => !n.isRead) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    notification.isRead 
                      ? 'bg-background' 
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'info' && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                      {notification.type === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      {notification.type === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      {!notification.isRead && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-2">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Course Chat</DialogTitle>
                <DialogDescription>
                  Chat with your classmates and instructors
                </DialogDescription>
              </div>
              {enrolledCourses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground">Course:</label>
                  <select 
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm bg-background border-border"
                  >
                    {enrolledCourses.map((course: any) => (
                      <option key={course.id} value={course.id}>
                        {course.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="flex flex-col h-96">
            {/* Chat Messages */}
            <div className="flex-1 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto space-y-3">
              {isChatLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Loading chat messages...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">Start a conversation with your classmates and instructors!</p>
                </div>
              ) : (
                chatMessages.map((message: any) => {
                  const isInstructor = message.sender?.role === 'instructor';
                  const senderName = message.sender ? 
                    `${message.sender.firstName} ${message.sender.lastName}` : 
                    'Unknown';
                  const timestamp = new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const isCurrentUser = message.senderId === user?.id;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white' 
                          : isInstructor
                          ? 'bg-green-100 dark:bg-green-900 text-gray-900 dark:text-gray-100'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${
                            isCurrentUser
                              ? 'text-blue-100'
                              : isInstructor 
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {isCurrentUser ? 'You' : senderName}
                            {isInstructor && !isCurrentUser && (
                              <span className="ml-1 text-xs bg-green-200 dark:bg-green-700 px-1 py-0.5 rounded text-green-800 dark:text-green-200">
                                Instructor
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${
                            isCurrentUser
                              ? 'text-blue-200'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {timestamp}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Chat Input */}
            <div className="mt-4 flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!chatMessage.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
