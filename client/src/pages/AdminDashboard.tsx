import React, { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, FileText, Settings, TrendingUp, Shield, User, Plus, LogOut, ChevronLeft, ChevronRight, Search, Edit, Trash2, Lock, Eye, FileText as FileTextIcon, X, Camera, Save, Mail, MessageSquare, Calendar, Bell, AlertTriangle, CheckCircle, Clock, Archive, Download, Upload, Filter, SortAsc, SortDesc, MoreHorizontal, UserPlus, UserMinus, Copy, RefreshCw, BarChart3, PieChart, Activity, Target, Award, Clock3, TrendingDown, UserCheck, BookOpenCheck, GraduationCap, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Mock user data - will be replaced with actual authentication
const mockAdmin = {
  id: "1",
  firstName: "Dr. Patricia",
  lastName: "Rodriguez",
  email: "patricia.rodriguez@ollc.edu",
  role: "administrator" as const,
};

// Mock user data for User Management
const mockUsers = [
  {
    id: "1",
    name: "Jovilyn Saging",
    email: "j.saging@example.edu",
    role: "Student",
    status: "Active",
    plagiarismFlags: 1,
    lastLogin: "Today, 10:30 AM"
  },
  {
    id: "2",
    name: "Marc Lhester John Sagun",
    email: "m.sagun@example.edu",
    role: "Professor",
    status: "Active",
    plagiarismFlags: 0,
    lastLogin: "Yesterday, 3:15 PM"
  },
  {
    id: "3",
    name: "Amanda Rodriguez",
    email: "a.rodriguez@example.edu",
    role: "Student",
    status: "Inactive",
    plagiarismFlags: 3,
    lastLogin: "Jan 15, 12:45 PM"
  },
  {
    id: "4",
    name: "Jhomari Perkins",
    email: "j.perkins@example.edu",
    role: "Admin",
    status: "Active",
    plagiarismFlags: 0,
    lastLogin: "Today, 9:10 AM"
  }
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'courses' | 'reports' | 'settings'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'pending' | 'permissions' | 'detection' | 'logs'>('users');
  
  // Fetch users from API
  const { data: apiUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['api', 'users'],
    queryFn: () => fetch('/api/users', { credentials: 'include' }).then(r => r.json()),
    initialData: [],
    refetchInterval: 5000, // Auto-refresh users every 5 seconds
  });

  // Fetch pending registrations from API
  const { data: pendingUsers = [], refetch: refetchPendingUsers } = useQuery({
    queryKey: ['api', 'admin', 'pending-registrations'],
    queryFn: () => fetch('/api/admin/pending-registrations', { credentials: 'include' }).then(r => r.json()),
    initialData: [],
    refetchInterval: 5000, // Auto-refresh pending registrations every 5 seconds
  });
  
  // Transform API user data to match UI expectations
  const transformedUsers = React.useMemo(() => {
    // Check if apiUsers is an array (not an error object)
    if (!Array.isArray(apiUsers)) {
      return [];
    }
    
    return apiUsers.map((user: any) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role === 'student' ? 'Student' : user.role === 'instructor' ? 'Professor' : 'Admin',
      status: user.status === 'approved' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Rejected',
      plagiarismFlags: 0, // Default value since it's not in database schema
      lastLogin: 'Today', // Default value since it's not in database schema
      firstName: user.firstName,
      lastName: user.lastName,
      originalRole: user.role,
      originalStatus: user.status
    }));
  }, [apiUsers]);
  
  // User Management states
  const [users, setUsers] = useState(transformedUsers);
  
  // Update users state when API data changes
  React.useEffect(() => {
    setUsers(transformedUsers);
  }, [transformedUsers]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Student',
    status: 'Active',
    plagiarismFlags: 0
  });

  // Admin Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: "Administration",
    title: "System Administrator",
    bio: "Experienced administrator managing the CHECKmate learning management system.",
    language: "en"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    userRegistrations: true,
    systemAlerts: true,
    securityAlerts: true,
    weeklyReports: true,
    pushNotifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: true,
    showActivity: false,
    allowMessages: true
  });

  // Loading states for settings save operations
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);

  // Course Management state
  const [courses, setCourses] = useState([
    {
      id: "1",
      name: "Introduction to Computer Science",
      code: "CS101",
      status: "Published",
      instructor: "Dr. Maria Martinez",
      enrolledStudents: 45,
      maxStudents: 50,
      createdDate: "2024-01-15",
      lastModified: "2024-01-18",
      startDate: "2024-02-01",
      endDate: "2024-05-31",
      description: "Fundamental concepts of computer science and programming"
    },
    {
      id: "2",
      name: "Data Structures and Algorithms",
      code: "CS201",
      status: "Published",
      instructor: "Dr. John Smith",
      enrolledStudents: 32,
      maxStudents: 40,
      createdDate: "2024-01-10",
      lastModified: "2024-01-17",
      startDate: "2024-02-15",
      endDate: "2024-06-15",
      description: "Advanced data structures and algorithmic problem solving"
    },
    {
      id: "3",
      name: "Web Development Fundamentals",
      code: "CS301",
      status: "Draft",
      instructor: "Dr. Sarah Johnson",
      enrolledStudents: 0,
      maxStudents: 35,
      createdDate: "2024-01-20",
      lastModified: "2024-01-20",
      startDate: "2024-03-01",
      endDate: "2024-07-01",
      description: "Modern web development with HTML, CSS, and JavaScript"
    },
    {
      id: "4",
      name: "Machine Learning Basics",
      code: "CS401",
      status: "Archived",
      instructor: "Dr. Michael Chen",
      enrolledStudents: 28,
      maxStudents: 30,
      createdDate: "2023-09-01",
      lastModified: "2023-12-15",
      startDate: "2023-09-15",
      endDate: "2023-12-15",
      description: "Introduction to machine learning concepts and applications"
    }
  ]);

  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseStatusFilter, setCourseStatusFilter] = useState("All Status");
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    instructor: '',
    maxStudents: 50,
    startDate: '',
    endDate: '',
    status: 'Draft'
  });

  // Reporting state
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'course' | 'student' | 'activity'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Mock reporting data
  const [courseReports] = useState([
    {
      courseId: "1",
      courseName: "Introduction to Computer Science",
      courseCode: "CS101",
      enrollmentRate: 90,
      completionRate: 78,
      averageGrade: 85.2,
      totalStudents: 45,
      completedStudents: 35,
      averageTimeSpent: 42.5,
      engagementScore: 8.2,
      quizAverage: 82.1,
      assignmentAverage: 88.3,
      discussionPosts: 156,
      lastActivity: "2024-01-18"
    },
    {
      courseId: "2",
      courseName: "Data Structures and Algorithms",
      courseCode: "CS201",
      enrollmentRate: 80,
      completionRate: 65,
      averageGrade: 79.8,
      totalStudents: 32,
      completedStudents: 21,
      averageTimeSpent: 38.2,
      engagementScore: 7.5,
      quizAverage: 76.4,
      assignmentAverage: 83.1,
      discussionPosts: 98,
      lastActivity: "2024-01-17"
    }
  ]);

  const [studentProgress] = useState([
    {
      studentId: "1",
      studentName: "John Doe",
      courseId: "1",
      courseName: "Introduction to Computer Science",
      modulesCompleted: 8,
      totalModules: 12,
      progressPercentage: 67,
      currentGrade: 88.5,
      timeSpent: 45.2,
      lastActivity: "2024-01-18",
      assignmentsSubmitted: 6,
      quizzesCompleted: 4,
      discussionPosts: 12
    },
    {
      studentId: "2",
      studentName: "Jane Smith",
      courseId: "1",
      courseName: "Introduction to Computer Science",
      modulesCompleted: 12,
      totalModules: 12,
      progressPercentage: 100,
      currentGrade: 92.3,
      timeSpent: 52.8,
      lastActivity: "2024-01-18",
      assignmentsSubmitted: 8,
      quizzesCompleted: 6,
      discussionPosts: 18
    }
  ]);

  const [activityLogs] = useState([
    {
      id: "1",
      timestamp: "2024-01-18 14:30:25",
      action: "Student Enrollment",
      user: "John Doe",
      course: "CS101 - Introduction to Computer Science",
      details: "Student enrolled in course"
    },
    {
      id: "2",
      timestamp: "2024-01-18 14:25:12",
      action: "Assignment Submission",
      user: "Jane Smith",
      course: "CS101 - Introduction to Computer Science",
      details: "Submitted assignment: Programming Basics"
    },
    {
      id: "3",
      timestamp: "2024-01-18 14:20:45",
      action: "Quiz Completion",
      user: "Mike Johnson",
      course: "CS201 - Data Structures and Algorithms",
      details: "Completed quiz: Arrays and Linked Lists (Score: 85%)"
    },
    {
      id: "4",
      timestamp: "2024-01-18 14:15:33",
      action: "Content Update",
      user: "Dr. Maria Martinez",
      course: "CS101 - Introduction to Computer Science",
      details: "Updated module 3: Variables and Data Types"
    },
    {
      id: "5",
      timestamp: "2024-01-18 14:10:18",
      action: "Discussion Post",
      user: "Sarah Wilson",
      course: "CS201 - Data Structures and Algorithms",
      details: "Posted in discussion: Algorithm Complexity"
    }
  ]);

  // Notification state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "2",
      type: "warning",
      title: "Instructor Interface Problem",
      message: "Assignment creation form validation failing",
      timestamp: "15 minutes ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: "4",
      type: "error",
      title: "Login Issue",
      message: "Multiple students reporting login failures",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "high"
    },
    {
      id: "5",
      type: "warning",
      title: "Instructor Dashboard",
      message: "Course management interface not loading properly",
      timestamp: "3 hours ago",
      isRead: true,
      priority: "medium"
    }
  ]);

  // Notification handlers
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Sign out handler
  const handleSignOut = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Navigate back to login page
    setLocation('/login');
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

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    
    setIsNotificationsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'notifications', ...notificationSettings }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Notification Settings Updated",
          description: "Your notification preferences have been saved.",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Failed to save notification settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsNotificationsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user?.id) return;
    
    setIsPrivacySaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'privacy', ...privacySettings }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Privacy Settings Updated",
          description: "Your privacy settings have been saved.",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Failed to save privacy settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrivacySaving(false);
    }
  };

  // User Management handlers
  const handleAddUser = () => {
    setUserForm({
      name: '',
      email: '',
      role: 'Student',
      status: 'Active',
      plagiarismFlags: 0
    });
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      plagiarismFlags: user.plagiarismFlags
    });
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (isAddUserModalOpen) {
      const newUser = {
        id: (users.length + 1).toString(),
        ...userForm,
        lastLogin: "Just now"
      };
      setUsers([...users, newUser]);
      setIsAddUserModalOpen(false);
    } else if (isEditUserModalOpen) {
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userForm }
          : user
      ));
      setIsEditUserModalOpen(false);
    }
    setUserForm({
      name: '',
      email: '',
      role: 'Student',
      status: 'Active',
      plagiarismFlags: 0
    });
    setSelectedUser(null);
  };

  const handleConfirmDelete = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSystemSettings = () => {
    setIsSystemSettingsOpen(true);
  };

  const handleTabChange = (tab: 'users' | 'pending' | 'permissions' | 'detection' | 'logs') => {
    setActiveAdminTab(tab);
  };

  // Pending registrations handlers
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "User Approved",
          description: "The user has been approved and can now access the system.",
          variant: "default",
        });
        refetchPendingUsers();
        refetchUsers();
      } else {
        throw new Error(result.error || 'Failed to approve user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected' }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "User Rejected",
          description: "The user registration has been rejected.",
          variant: "default",
        });
        refetchPendingUsers();
        refetchUsers();
      } else {
        throw new Error(result.error || 'Failed to reject user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Course Management handlers
  const handleCreateCourse = () => {
    setCourseForm({
      name: '',
      code: '',
      description: '',
      instructor: '',
      maxStudents: 50,
      startDate: '',
      endDate: '',
      status: 'Draft'
    });
    setIsCreateCourseModalOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description,
      instructor: course.instructor,
      maxStudents: course.maxStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status
    });
    setIsEditCourseModalOpen(true);
  };

  const handleSaveCourse = () => {
    if (isCreateCourseModalOpen) {
      const newCourse = {
        id: (courses.length + 1).toString(),
        ...courseForm,
        enrolledStudents: 0,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      setCourses([...courses, newCourse]);
      setIsCreateCourseModalOpen(false);
    } else if (isEditCourseModalOpen) {
      setCourses(courses.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, ...courseForm, lastModified: new Date().toISOString().split('T')[0] }
          : course
      ));
      setIsEditCourseModalOpen(false);
    }
    setCourseForm({
      name: '',
      code: '',
      description: '',
      instructor: '',
      maxStudents: 50,
      startDate: '',
      endDate: '',
      status: 'Draft'
    });
    setSelectedCourse(null);
  };

  const handleDeleteCourse = (course: any) => {
    setSelectedCourse(course);
    // This would open a confirmation dialog
    setCourses(courses.filter(c => c.id !== course.id));
  };

  const handleArchiveCourse = (course: any) => {
    setCourses(courses.map(c => 
      c.id === course.id 
        ? { ...c, status: 'Archived' }
        : c
    ));
  };

  const handleManageEnrollment = (course: any) => {
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
  };

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(courseSearchQuery.toLowerCase());
    const matchesStatus = courseStatusFilter === "All Status" || course.status === courseStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // System statistics data from API
  const { data: systemStats } = useQuery({
    queryKey: ['api', 'admin', 'stats'],
    queryFn: () => fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()),
    initialData: {
      totalUsers: 156,
      totalStudents: 128,
      totalInstructors: 24,
      totalAdmins: 4,
      totalCourses: 18,
      activeCourses: 15,
      totalAssignments: 87,
      aiGradingUsage: 92.5,
    },
    refetchInterval: 5000, // Auto-refresh system stats every 5 seconds
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['api', 'admin', 'activity'],
    queryFn: () => fetch('/api/admin/activity', { credentials: 'include' }).then(r => r.json()),
    initialData: [
      {
        id: "1",
        type: "user_registration",
        description: "New student registered: Sarah Johnson",
        timestamp: "2024-09-18 14:30",
        status: "completed",
      },
      {
        id: "2",
        type: "course_creation",
        description: "Course created: Advanced Physics by Dr. Chen",
        timestamp: "2024-09-18 13:15",
        status: "completed",
      },
      {
        id: "3",
        type: "ai_grading",
        description: "AI graded 25 assignments in CS101",
        timestamp: "2024-09-18 12:45",
        status: "completed",
      },
    ],
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
    const matchesStatus = statusFilter === "All Status" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Administration</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-add-user" onClick={handleAddUser}>
            <User className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'pending' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('pending')}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Pending Registrations
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
              {pendingUsers.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Roles">All Roles</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
            <SelectItem value="Professor">Professor</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plagiarism Flags</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === "Active" ? "default" : "destructive"}
                      className={user.status === "Active" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.plagiarismFlags > 0 ? "destructive" : "default"}
                      className={user.plagiarismFlags === 0 ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {user.plagiarismFlags === 0 ? "None" : `${user.plagiarismFlags} Flag${user.plagiarismFlags > 1 ? 's' : ''}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        data-testid={`button-edit-user-${user.id}`}
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        data-testid={`button-delete-user-${user.id}`}
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredUsers.length} of {filteredUsers.length} users.
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPendingRegistrations = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pending Registrations</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {pendingUsers.length} Pending
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'pending' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('pending')}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Pending Registrations
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
              {pendingUsers.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant="ghost"
          className="rounded-none border-b-2 border-transparent"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Pending Registrations Content */}
      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Registrations</h3>
            <p className="text-muted-foreground">
              All user registrations have been processed. New registrations will appear here for your approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>User Registration Requests</CardTitle>
            <CardDescription>
              Review and approve or reject new user registrations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role === 'student' ? 'Student' : user.role === 'instructor' ? 'Instructor' : 'Administrator'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.studentId || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRejectUser(user.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPermissionsAccess = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Permissions & Access</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-add-role">
            <Plus className="mr-2 h-4 w-4" />
            Add New Role
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant={activeAdminTab === 'detection' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant={activeAdminTab === 'logs' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Permissions Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Manage permissions for different user roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Student</span>
                <Badge variant="outline">Limited Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• View assigned courses</p>
                <p>• Submit assignments</p>
                <p>• View grades</p>
                <p>• Access course materials</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Professor</span>
                <Badge variant="outline">Full Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Create and manage courses</p>
                <p>• Grade assignments</p>
                <p>• Access AI grading tools</p>
                <p>• View student analytics</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Administrator</span>
                <Badge variant="outline">System Access</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Manage all users</p>
                <p>• System configuration</p>
                <p>• Access all data</p>
                <p>• Security controls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Controls</CardTitle>
            <CardDescription>Configure system-wide access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Require 2FA</span>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="2fa" defaultChecked />
                  <Label htmlFor="2fa">Enabled</Label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session Timeout</span>
                <Select defaultValue="30">
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IP Restrictions</span>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="ip-restrict" />
                  <Label htmlFor="ip-restrict">Enabled</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetectionSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detection Settings</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-test-detection">
            <Eye className="mr-2 h-4 w-4" />
            Test Detection
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant={activeAdminTab === 'detection' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant={activeAdminTab === 'logs' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Detection Settings Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plagiarism Detection</CardTitle>
            <CardDescription>Configure plagiarism detection algorithms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Detection Sensitivity</span>
                <Select defaultValue="medium">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (60%)</SelectItem>
                    <SelectItem value="medium">Medium (80%)</SelectItem>
                    <SelectItem value="high">High (95%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-flag Threshold</span>
                <Input type="number" defaultValue="85" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Check External Sources</span>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="external-check" defaultChecked />
                  <Label htmlFor="external-check">Enabled</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Grading Settings</CardTitle>
            <CardDescription>Configure AI-powered grading features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-grading</span>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-grade" defaultChecked />
                  <Label htmlFor="auto-grade">Enabled</Label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Threshold</span>
                <Input type="number" defaultValue="75" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Human Review Required</span>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="human-review" defaultChecked />
                  <Label htmlFor="human-review">Enabled</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detection Statistics</CardTitle>
          <CardDescription>Current detection performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <p className="text-sm text-muted-foreground">Documents Scanned</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">23</div>
              <p className="text-sm text-muted-foreground">Flags This Week</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2.1s</div>
              <p className="text-sm text-muted-foreground">Avg. Processing Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemLogs = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button data-testid="button-export-logs">
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeAdminTab === 'users' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          User Management
        </Button>
        <Button
          variant={activeAdminTab === 'permissions' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('permissions')}
        >
          <Lock className="mr-2 h-4 w-4" />
          Permissions & Access
        </Button>
        <Button
          variant={activeAdminTab === 'detection' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('detection')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Detection Settings
        </Button>
        <Button
          variant={activeAdminTab === 'logs' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => handleTabChange('logs')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          System Logs
        </Button>
      </div>

      {/* Logs Content */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="today">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:30:25</TableCell>
                  <TableCell><Badge variant="default" className="bg-green-500">INFO</Badge></TableCell>
                  <TableCell>User Management</TableCell>
                  <TableCell>User Jovilyn Saging logged in successfully</TableCell>
                  <TableCell>j.saging@example.edu</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:28:12</TableCell>
                  <TableCell><Badge variant="destructive">ERROR</Badge></TableCell>
                  <TableCell>Plagiarism Detection</TableCell>
                  <TableCell>Failed to process document: timeout</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:25:45</TableCell>
                  <TableCell><Badge variant="outline" className="border-yellow-500 text-yellow-500">WARNING</Badge></TableCell>
                  <TableCell>AI Grading</TableCell>
                  <TableCell>Low confidence score for assignment CS101-001</TableCell>
                  <TableCell>m.sagun@example.edu</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:20:33</TableCell>
                  <TableCell><Badge variant="default" className="bg-green-500">INFO</Badge></TableCell>
                  <TableCell>System</TableCell>
                  <TableCell>Database backup completed successfully</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">2024-01-18 14:15:18</TableCell>
                  <TableCell><Badge variant="destructive">ERROR</Badge></TableCell>
                  <TableCell>Authentication</TableCell>
                  <TableCell>Failed login attempt for unknown user</TableCell>
                  <TableCell>Unknown</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1 to 5 of 247 log entries.
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourseManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {/* Handle bulk actions */}}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => {/* Handle import */}}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleCreateCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={courseSearchQuery}
            onChange={(e) => setCourseSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseStatusFilter} onValueChange={setCourseStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Course Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.status === 'Published').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{courses.filter(c => c.status === 'Draft').length}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.enrolledStudents, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-muted-foreground">{course.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{course.code}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        course.status === 'Published' ? 'default' : 
                        course.status === 'Draft' ? 'secondary' : 
                        'outline'
                      }
                      className={
                        course.status === 'Published' ? 'bg-green-500 hover:bg-green-600' :
                        course.status === 'Draft' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        ''
                      }
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{course.enrolledStudents} / {course.maxStudents}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(course.enrolledStudents / course.maxStudents) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{course.createdDate}</TableCell>
                  <TableCell className="text-muted-foreground">{course.lastModified}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                        title="Edit Course"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManageEnrollment(course)}
                        title="Manage Enrollment"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleArchiveCourse(course)}
                        title="Archive Course"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCourse(course)}
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredCourses.length} of {filteredCourses.length} courses.
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporting and Analytics</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {/* Handle export all reports */}}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="outline" onClick={() => {/* Handle schedule reports */}}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={selectedReportType === 'overview' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('overview')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={selectedReportType === 'course' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('course')}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Course Reports
        </Button>
        <Button
          variant={selectedReportType === 'student' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('student')}
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Student Transcripts
        </Button>
        <Button
          variant={selectedReportType === 'activity' ? "default" : "ghost"}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          onClick={() => setSelectedReportType('activity')}
        >
          <Activity className="mr-2 h-4 w-4" />
          Activity Logs
        </Button>
      </div>

      {/* Overview Reports */}
      {selectedReportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.enrolledStudents, 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Completion Rate</p>
                    <p className="text-2xl font-bold">{Math.round(courseReports.reduce((sum, c) => sum + c.completionRate, 0) / courseReports.length)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Grade</p>
                    <p className="text-2xl font-bold">{Math.round(courseReports.reduce((sum, c) => sum + c.averageGrade, 0) / courseReports.length)}%</p>
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Overview</CardTitle>
              <CardDescription>Enrollment and completion rates by course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseReports.map((course) => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.courseName} ({course.courseCode})</span>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Enrollment: {course.enrollmentRate}%</span>
                        <span>Completion: {course.completionRate}%</span>
                        <span>Avg Grade: {course.averageGrade}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Enrollment Rate</span>
                        <span>{course.enrollmentRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${course.enrollmentRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{course.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course-Level Reports */}
      {selectedReportType === 'course' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedCourse?.courseId || ""} onValueChange={(value) => setSelectedCourse(courseReports.find(c => c.courseId === value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course to view detailed reports" />
              </SelectTrigger>
              <SelectContent>
                {courseReports.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseName} ({course.courseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {/* Handle export course report */}}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {selectedCourse && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Enrollment and Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment & Completion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Students</span>
                    <span className="font-bold">{selectedCourse.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed Students</span>
                    <span className="font-bold">{selectedCourse.completedStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enrollment Rate</span>
                    <span className="font-bold text-blue-600">{selectedCourse.enrollmentRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completion Rate</span>
                    <span className="font-bold text-green-600">{selectedCourse.completionRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Grade</span>
                    <span className="font-bold">{selectedCourse.averageGrade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiz Average</span>
                    <span className="font-bold">{selectedCourse.quizAverage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assignment Average</span>
                    <span className="font-bold">{selectedCourse.assignmentAverage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Score</span>
                    <span className="font-bold">{selectedCourse.engagementScore}/10</span>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Time Spent</span>
                    <span className="font-bold">{selectedCourse.averageTimeSpent} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discussion Posts</span>
                    <span className="font-bold">{selectedCourse.discussionPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Activity</span>
                    <span className="font-bold">{selectedCourse.lastActivity}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Student Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentProgress.filter(s => s.courseId === selectedCourse.courseId).map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.modulesCompleted}/{student.totalModules} modules completed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{student.progressPercentage}%</div>
                          <div className="text-sm text-muted-foreground">Grade: {student.currentGrade}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Student Transcripts */}
      {selectedReportType === 'student' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedStudent?.studentId || ""} onValueChange={(value) => setSelectedStudent(studentProgress.find(s => s.studentId === value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a student to view transcript" />
              </SelectTrigger>
              <SelectContent>
                {studentProgress.map((student) => (
                  <SelectItem key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Download Transcript
            </Button>
          </div>

          {selectedStudent && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Student Name</span>
                    <span className="font-bold">{selectedStudent.studentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Course</span>
                    <span className="font-bold">{selectedStudent.courseName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current Grade</span>
                    <span className="font-bold text-green-600">{selectedStudent.currentGrade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Progress</span>
                    <span className="font-bold">{selectedStudent.progressPercentage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Time Spent</span>
                    <span className="font-bold">{selectedStudent.timeSpent} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assignments Submitted</span>
                    <span className="font-bold">{selectedStudent.assignmentsSubmitted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quizzes Completed</span>
                    <span className="font-bold">{selectedStudent.quizzesCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discussion Posts</span>
                    <span className="font-bold">{selectedStudent.discussionPosts}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Module Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Modules Completed</span>
                      <span className="font-bold">{selectedStudent.modulesCompleted}/{selectedStudent.totalModules}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${selectedStudent.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs */}
      {selectedReportType === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity logs..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="enrollment">Enrollments</SelectItem>
                <SelectItem value="submission">Submissions</SelectItem>
                <SelectItem value="quiz">Quizzes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {/* Handle export logs */}}>
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.course}</TableCell>
                      <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to {activityLogs.length} of {activityLogs.length} activity logs.
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your admin profile and preferences</p>
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
                {profileSettings.firstName[0]}{profileSettings.lastName[0]}
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

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileSettings.firstName}
                  onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileSettings.lastName}
                  onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileSettings.email}
                  onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileSettings.department}
                  onChange={(e) => setProfileSettings({...profileSettings, department: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="title">Title/Position</Label>
                <Input
                  id="title"
                  value={profileSettings.title}
                  onChange={(e) => setProfileSettings({...profileSettings, title: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                className="w-full mt-1"
                value={profileSettings.bio}
                onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={isProfileSaving}>
              {isProfileSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified about system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for system events</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="userRegistrations">User Registrations</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new users register</p>
                  </div>
                  <Switch
                    id="userRegistrations"
                    checked={notificationSettings.userRegistrations}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, userRegistrations: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about system maintenance and updates</p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="securityAlerts">Security Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about security-related events</p>
                  </div>
                  <Switch
                    id="securityAlerts"
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, securityAlerts: checked})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Push Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Push Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Digest Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Digest Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly summary of system activities and statistics</p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveNotifications} disabled={isNotificationsSaving}>
              {isNotificationsSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control your privacy and visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profileVisible">Profile Visibility</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to other users</p>
              </div>
              <Switch
                id="profileVisible"
                checked={privacySettings.profileVisibility === "public"}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, profileVisibility: checked ? "public" : "private"})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showEmail">Show Email Address</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display your email on your profile</p>
              </div>
              <Switch
                id="showEmail"
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showEmail: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showActivity">Show Activity Status</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display when you're online or offline</p>
              </div>
              <Switch
                id="showActivity"
                checked={privacySettings.showActivity}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showActivity: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowMessages">Allow Messages</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow other users to message you</p>
              </div>
              <Switch
                id="allowMessages"
                checked={privacySettings.allowMessages}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowMessages: checked})}
              />
            </div>

            <Button onClick={handleSavePrivacy} disabled={isPrivacySaving}>
              {isPrivacySaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Privacy Settings
                </>
              )}
            </Button>
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
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" onClick={() => {/* Handle 2FA setup */}}>
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-courses">{systemStats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalCourses} total courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plagiarism</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-plagiarism-detected">12</div>
            <p className="text-xs text-muted-foreground">
              Cases detected this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-usage">{systemStats.aiGradingUsage}%</div>
            <p className="text-xs text-muted-foreground">
              Grading efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown of user roles in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Students</span>
                <Badge variant="secondary" data-testid="text-student-count">{systemStats.totalStudents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Instructors</span>
                <Badge variant="secondary" data-testid="text-instructor-count">{systemStats.totalInstructors}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Administrators</span>
                <Badge variant="secondary" data-testid="text-admin-count">{systemStats.totalAdmins}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm font-medium" data-testid={`text-activity-${activity.id}`}>
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" data-testid="button-create-user">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-system-settings">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-view-reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-backup-system">
                <Shield className="mr-2 h-4 w-4" />
                Backup System
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
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="button-notifications"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center">
                        <Bell className="h-5 w-5 mr-2" />
                        System Notifications
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Issues and alerts that need your attention
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
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        notification.isRead 
                          ? 'bg-background' 
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                      data-testid={`notification-${notification.id}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'error' && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          {notification.type === 'warning' && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          {notification.type === 'info' && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.timestamp}
                              </span>
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
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant={
                                notification.priority === 'high' ? 'destructive' : 
                                notification.priority === 'medium' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {notification.priority} priority
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t bg-muted/50">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {/* Handle mark all as read */}}
                  >
                    Mark All as Read
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
                <Shield className="h-6 w-6 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </div>
              </div>
              )}
              {isSidebarCollapsed && (
                <div className="flex justify-center">
                  <Shield className="h-6 w-6 text-primary" />
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
                        onClick={() => setSelectedTab('overview')}
                        data-testid="button-tab-overview"
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <TrendingUp className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            <Button
              variant={selectedTab === 'users' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('users')}
                        data-testid="button-tab-users"
              title={isSidebarCollapsed ? "User Management" : ""}
            >
              <Users className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "User Management"}
            </Button>
            <Button
              variant={selectedTab === 'courses' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('courses')}
                        data-testid="button-tab-courses"
              title={isSidebarCollapsed ? "Course Management" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Course Management"}
            </Button>
            <Button
              variant={selectedTab === 'reports' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('reports')}
                        data-testid="button-tab-reports"
              title={isSidebarCollapsed ? "Reports" : ""}
            >
              <FileText className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Reports"}
            </Button>
            <Button
              variant={selectedTab === 'settings' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                        onClick={() => setSelectedTab('settings')}
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
              variant="destructive" 
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              data-testid="button-logout" 
                  onClick={handleSignOut}
              title={isSidebarCollapsed ? "Logout" : ""}
                >
              <LogOut className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
              {!isSidebarCollapsed && "Logout"}
                </Button>
              </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'users' && (
              activeAdminTab === 'users' && renderUserManagement() ||
              activeAdminTab === 'pending' && renderPendingRegistrations() ||
              activeAdminTab === 'permissions' && renderPermissionsAccess() ||
              activeAdminTab === 'detection' && renderDetectionSettings() ||
              activeAdminTab === 'logs' && renderSystemLogs()
          )}
            {selectedTab === 'courses' && renderCourseManagement()}
          {selectedTab === 'reports' && renderReports()}
            {selectedTab === 'settings' && renderSettings()}
          </div>
            </main>
        </div>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Enter full name"
              />
      </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={userForm.status} onValueChange={(value) => setUserForm({...userForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plagiarismFlags">Plagiarism Flags</Label>
              <Input
                id="plagiarismFlags"
                type="number"
                min="0"
                value={userForm.plagiarismFlags}
                onChange={(e) => setUserForm({...userForm, plagiarismFlags: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={userForm.status} onValueChange={(value) => setUserForm({...userForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-plagiarismFlags">Plagiarism Flags</Label>
              <Input
                id="edit-plagiarismFlags"
                type="number"
                min="0"
                value={userForm.plagiarismFlags}
                onChange={(e) => setUserForm({...userForm, plagiarismFlags: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for {selectedUser?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* System Settings Modal */}
      <Dialog open={isSystemSettingsOpen} onOpenChange={setIsSystemSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>System Settings</DialogTitle>
            <DialogDescription>
              Configure system-wide settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>System Name</Label>
              <Input placeholder="CHECKmate Learning Management System" />
            </div>
            <div className="space-y-2">
              <Label>Plagiarism Detection Sensitivity</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-grading Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-grade" defaultChecked />
                  <Label htmlFor="auto-grade">Enable automatic grading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="ai-feedback" defaultChecked />
                  <Label htmlFor="ai-feedback">Enable AI-generated feedback</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSystemSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSystemSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Course Modal */}
      <Dialog open={isCreateCourseModalOpen} onOpenChange={setIsCreateCourseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Set up a new course with all the necessary details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="course-code">Course Code</Label>
                <Input
                  id="course-code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  placeholder="e.g., CS101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <Label htmlFor="max-students">Max Students</Label>
                <Input
                  id="max-students"
                  type="number"
                  value={courseForm.maxStudents}
                  onChange={(e) => setCourseForm({...courseForm, maxStudents: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={courseForm.startDate}
                  onChange={(e) => setCourseForm({...courseForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={courseForm.endDate}
                  onChange={(e) => setCourseForm({...courseForm, endDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-status">Status</Label>
              <Select value={courseForm.status} onValueChange={(value) => setCourseForm({...courseForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse}>
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={isEditCourseModalOpen} onOpenChange={setIsEditCourseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-course-name">Course Name</Label>
                <Input
                  id="edit-course-name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="edit-course-code">Course Code</Label>
                <Input
                  id="edit-course-code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  placeholder="e.g., CS101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course-description">Description</Label>
              <Textarea
                id="edit-course-description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-instructor">Instructor</Label>
                <Input
                  id="edit-instructor"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <Label htmlFor="edit-max-students">Max Students</Label>
                <Input
                  id="edit-max-students"
                  type="number"
                  value={courseForm.maxStudents}
                  onChange={(e) => setCourseForm({...courseForm, maxStudents: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={courseForm.startDate}
                  onChange={(e) => setCourseForm({...courseForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={courseForm.endDate}
                  onChange={(e) => setCourseForm({...courseForm, endDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course-status">Status</Label>
              <Select value={courseForm.status} onValueChange={(value) => setCourseForm({...courseForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Management Modal */}
      <Dialog open={isEnrollmentModalOpen} onOpenChange={setIsEnrollmentModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Enrollment - {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Manage student enrollments and instructor assignments for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Enrolled Students ({selectedCourse?.enrolledStudents})</h3>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">John Doe</span>
                      <Button variant="ghost" size="sm">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Jane Smith</span>
                      <Button variant="ghost" size="sm">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Mike Johnson</span>
                      <Button variant="ghost" size="sm">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-3">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Students
                </Button>
              </div>
              <div>
                <h3 className="font-medium mb-3">Course Instructors</h3>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{selectedCourse?.instructor}</span>
                      <Button variant="ghost" size="sm">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-3">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Instructor
                </Button>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Bulk Actions</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Roster
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Students
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Course
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollmentModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsEnrollmentModalOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Transcript Modal */}
      <Dialog open={isTranscriptModalOpen} onOpenChange={setIsTranscriptModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Transcript - {selectedStudent?.studentName}</DialogTitle>
            <DialogDescription>
              Complete academic record and progress summary
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStudent.studentName}</h3>
                    <p className="text-muted-foreground">Student ID: {selectedStudent.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.currentGrade}%</p>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Course:</span>
                      <span className="text-sm font-medium">{selectedStudent.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Progress:</span>
                      <span className="text-sm font-medium">{selectedStudent.progressPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Modules Completed:</span>
                      <span className="text-sm font-medium">{selectedStudent.modulesCompleted}/{selectedStudent.totalModules}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Time Spent:</span>
                      <span className="text-sm font-medium">{selectedStudent.timeSpent} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assignments:</span>
                      <span className="text-sm font-medium">{selectedStudent.assignmentsSubmitted} submitted</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quizzes:</span>
                      <span className="text-sm font-medium">{selectedStudent.quizzesCompleted} completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Discussions:</span>
                      <span className="text-sm font-medium">{selectedStudent.discussionPosts} posts</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Module Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-bold">{selectedStudent.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium" 
                        style={{ width: `${selectedStudent.progressPercentage}%` }}
                      >
                        {selectedStudent.progressPercentage}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{selectedStudent.modulesCompleted}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{selectedStudent.totalModules - selectedStudent.modulesCompleted}</div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{selectedStudent.totalModules}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Grade Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Current Overall Grade</span>
                      <span className="text-xl font-bold text-green-600">{selectedStudent.currentGrade}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Assignments</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Quizzes</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Participation</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Final Exam</span>
                        <span className="font-medium">Pending</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {/* Handle download transcript */}}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}