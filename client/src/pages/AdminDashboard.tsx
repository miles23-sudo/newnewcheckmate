import React, { useState, useEffect, useCallback } from "react";
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

// Helper function to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

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
  
  // System logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsRefreshing, setLogsRefreshing] = useState(false); // For background refresh
  const [logsFilters, setLogsFilters] = useState({ level: 'all', search: '' });
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Instructors state
  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsSearch, setActivityLogsSearch] = useState('');
  const [activityLogsFilter, setActivityLogsFilter] = useState('all');
  
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

  // Fetch system logs
  const fetchLogs = useCallback(async (page = logsPagination.page, level = logsFilters.level, isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setLogsRefreshing(true);
      } else {
        setLogsLoading(true);
      }
      
      const params = new URLSearchParams({
        limit: logsPagination.limit.toString(),
        offset: ((page - 1) * logsPagination.limit).toString(),
        ...(level !== 'all' && { level: level })
      });

      const response = await fetch(`/api/admin/logs?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      setLogs(data.logs || []);
      setLogsPagination(prev => ({ ...prev, total: data.totalCount || 0 }));
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      if (isBackgroundRefresh) {
        setLogsRefreshing(false);
      } else {
        setLogsLoading(false);
      }
    }
  }, [logsPagination.limit]);

  // Auto-refresh logs when tab changes
  useEffect(() => {
    if (activeAdminTab === 'logs') {
      fetchLogs();
      const interval = setInterval(() => {
        fetchLogs(logsPagination.page, logsFilters.level, true); // Background refresh
      }, 10000); // Increased to 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeAdminTab, logsPagination.page, logsFilters.level, fetchLogs]);

  // Fetch logs when pagination or filters change
  useEffect(() => {
    if (activeAdminTab === 'logs') {
      fetchLogs(logsPagination.page, logsFilters.level);
    }
  }, [logsPagination.page, logsFilters.level, activeAdminTab, fetchLogs]);

  // Fetch instructors on component mount
  useEffect(() => {
    fetchInstructors();
  }, []);

  // Manual refresh function
  const handleRefreshLogs = () => {
    fetchLogs(logsPagination.page, logsFilters.level);
  };

  // Fetch instructors
  const fetchInstructors = async () => {
    try {
      setInstructorsLoading(true);
      const response = await fetch('/api/instructors', {
        credentials: 'include'
      });
      const data = await response.json();
      setInstructors(data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setInstructorsLoading(false);
    }
  };

  // Helper function to get instructor name from ID
  const getInstructorName = (instructorId: string) => {
    const instructor = instructors.find((inst: any) => inst.id === instructorId) as any;
    return instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Unassigned';
  };

  // Fetch and format activity logs
  const fetchActivityLogs = async () => {
    try {
      setActivityLogsLoading(true);
      const response = await fetch('/api/admin/logs', {
        credentials: 'include'
      });
      const data = await response.json();
      
      // Format logs for activity display
      const formattedLogs = data.logs.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.createdAt).toLocaleString(),
        action: getActionFromLog(log),
        user: log.userId ? getInstructorName(log.userId) : 'System',
        details: log.message,
        level: log.level,
        source: log.source
      }));
      
      setActivityLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  // Helper function to get action from log
  const getActionFromLog = (log: any) => {
    if (log.source === 'User Management') {
      if (log.message.includes('created')) return 'User Registration';
      if (log.message.includes('deleted')) return 'User Deletion';
      if (log.message.includes('logged in')) return 'User Login';
      if (log.message.includes('logged out')) return 'User Logout';
    }
    if (log.source === 'Authentication') {
      if (log.message.includes('logged in')) return 'User Login';
      if (log.message.includes('logged out')) return 'User Logout';
      if (log.message.includes('Failed login')) return 'Failed Login';
    }
    return log.source;
  };


  // Filter activity logs based on search and filter
  const filteredActivityLogs = activityLogs.filter((log: any) => {
    const matchesSearch = log.details.toLowerCase().includes(activityLogsSearch.toLowerCase()) ||
                         log.user.toLowerCase().includes(activityLogsSearch.toLowerCase()) ||
                         log.action.toLowerCase().includes(activityLogsSearch.toLowerCase());
    
    const matchesFilter = activityLogsFilter === 'all' || 
                         (activityLogsFilter === 'registration' && log.action.includes('Registration')) ||
                         (activityLogsFilter === 'login' && log.action.includes('Login')) ||
                         (activityLogsFilter === 'deletion' && log.action.includes('Deletion')) ||
                         (activityLogsFilter === 'system' && log.action.includes('System'));
    
    return matchesSearch && matchesFilter;
  });
  
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
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Professor' as 'Professor', // Only allow instructor registration
    status: 'Active' as 'Active' | 'Inactive' | 'Pending',
    plagiarismFlags: 0
  });

  // Admin Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: "Administration",
    title: "System Administrator",
    language: "en"
  });

  // Update profile settings when user data changes
  useEffect(() => {
    if (user) {
      setProfileSettings({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        department: "Administration",
        title: "System Administrator",
        language: "en"
      });
    }
  }, [user]);



  // Loading states for settings save operations
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Fetch courses from API
  const { data: apiCourses = [], refetch: rerefetchCourses } = useQuery({
    queryKey: ['api', 'courses'],
    queryFn: () => fetch('/api/courses', { credentials: 'include' }).then(r => r.json()),
    initialData: [],
    refetchInterval: 5000, // Auto-refresh courses every 5 seconds
  });

  // Transform API courses to match UI format
        const courses = apiCourses.map((course: any) => ({
          id: course.id,
          name: course.title || course.name,
          code: course.code,
          description: course.description,
          instructor: course.instructorId || course.instructor || '',
          enrolledStudents: course.enrolledStudents || 0,
          maxStudents: 50, // TODO: Get from course data
          status: course.isActive ? 'Published' : 'Archived', // Map from database isActive field
          createdDate: new Date(course.createdAt).toISOString().split('T')[0],
          lastModified: new Date(course.updatedAt).toISOString().split('T')[0],
          startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
          endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
        }));

  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [courseStatusFilter, setCourseStatusFilter] = useState("All Status");
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    section: 'A',
    description: '',
    instructor: '', // This will now store the instructor ID
    maxStudents: 50,
    startDate: '',
    endDate: '',
    status: 'Draft'
  });

  // Reporting state
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'course' | 'student' | 'activity'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseReport, setCourseReport] = useState<any>(null);
  const [courseReportLoading, setCourseReportLoading] = useState(false);
  
  // Enrollment state
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Fetch course report when course is selected
  const fetchCourseReport = async (courseId: string) => {
    if (!courseId) return;
    
    try {
      setCourseReportLoading(true);
      const response = await fetch(`/api/admin/course-reports/${courseId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setCourseReport(data);
    } catch (error) {
      console.error('Error fetching course report:', error);
    } finally {
      setCourseReportLoading(false);
    }
  };

  // Fetch enrolled students for a course
  const fetchEnrolledStudents = async (courseId: string) => {
    try {
      console.log('Fetching enrolled students for course:', courseId);
      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Enrolled students response:', data);
      setEnrolledStudents(data);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  // Fetch available students (not enrolled in this course)
  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      const data = await response.json();
      const students = data.filter((user: any) => user.role === 'Student' || user.role === 'student');
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  // Enroll students in course
  const enrollStudents = async (courseId: string, studentIds: string[]) => {
    try {
      setEnrollmentLoading(true);
      console.log('Enrolling students:', { courseId, studentIds });
      
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ studentIds })
      });
      
      const data = await response.json();
      console.log('Enrollment response:', data);
      
      if (response.ok && (data.success || data.enrollments?.length > 0 || data.alreadyEnrolled?.length > 0)) {
        // Refresh enrolled students and courses list
        await Promise.all([
          fetchEnrolledStudents(courseId),
          rerefetchCourses()
        ]);
        setSelectedStudents([]);
        toast({ title: "Success", description: data.message || 'Students enrolled successfully' });
      } else {
        toast({ title: "Error", description: data.error || data.message || 'Failed to enroll students', variant: "destructive" });
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast({ title: "Error", description: 'Failed to enroll students', variant: "destructive" });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Unenroll student from course
  const unenrollStudent = async (courseId: string, studentId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll/${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh enrolled students and courses list
        await Promise.all([
          fetchEnrolledStudents(courseId),
          rerefetchCourses()
        ]);
        toast({ title: "Success", description: data.message || 'Student unenrolled successfully' });
      } else {
        toast({ title: "Error", description: data.error || data.message || 'Failed to unenroll student', variant: "destructive" });
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast({ title: "Error", description: 'Failed to unenroll student', variant: "destructive" });
    }
  };

  // Fetch activity logs when activity tab is selected
  useEffect(() => {
    if (selectedReportType === 'activity') {
      fetchActivityLogs();
    }
  }, [selectedReportType]);

  // Fetch course report when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseReport(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Mock reporting data - removed, now using real data
  const courseReports: any[] = [];
  const studentProgress: any[] = [];


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



  // User Management handlers

  const handleAddUser = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Professor' as 'Professor',
      status: 'Active' as 'Active' | 'Inactive' | 'Pending',
      plagiarismFlags: 0
    });
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      password: '', // Not needed for editing
      role: 'Professor' as 'Professor', // Fixed type
      status: user.status as 'Active' | 'Inactive' | 'Pending', // Fixed type
      plagiarismFlags: user.plagiarismFlags || 0
    });
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (isAddUserModalOpen) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            password: userForm.password,
            confirmPassword: userForm.password, // Required by registration schema
            role: 'instructor', // Always instructor for admin-created accounts
            studentId: null // Not needed for instructors
          })
        });

        const result = await response.json();

        if (result.success) {
          // Set status if not Active (approved by default)
          if (userForm.status !== 'Active') {
            const dbStatus = userForm.status === 'Inactive' ? 'rejected' : 'pending';
            await fetch(`/api/admin/users/${result.user.id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ status: dbStatus })
            });
          }

          await refetchUsers();
          setIsAddUserModalOpen(false);

          toast({
            title: "Instructor Created",
            description: "The instructor account has been successfully created.",
            variant: "default",
          });
        } else {
          throw new Error(result.error || 'Failed to create instructor');
        }
      } catch (error) {
        console.error('Error creating instructor:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create instructor. Please try again.",
          variant: "destructive",
        });
      }
    } else if (isEditUserModalOpen && selectedUser) {
      try {
        // Convert frontend status to database status
        const dbStatus = userForm.status === 'Active' ? 'approved' : 
                        userForm.status === 'Inactive' ? 'rejected' : 
                        userForm.status === 'Pending' ? 'pending' : 'approved';
        
        // Update user in database
        const response = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: dbStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }

        // Refresh users list from database
        await refetchUsers();
        setIsEditUserModalOpen(false);
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
      }
    }
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Professor' as 'Professor',
      status: 'Active' as 'Active' | 'Inactive' | 'Pending',
      plagiarismFlags: 0
    });
    setSelectedUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to delete user');
      }

      // Refresh users list from database
      await refetchUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted from the system.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Cannot Delete User",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
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
      section: 'A',
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
      name: course.name || course.title,
      code: course.code,
      section: course.section || 'A',
      description: course.description,
      instructor: course.instructorId || course.instructor, // Handle both ID and name
      maxStudents: course.maxStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status
    });
    setIsEditCourseModalOpen(true);
  };

  const handleSaveCourse = async () => {
    try {
      if (isCreateCourseModalOpen) {
        // Create new course
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: courseForm.name,
            code: courseForm.code,
            section: courseForm.section,
            description: courseForm.description,
            instructorId: courseForm.instructor, // Assuming this is the instructor ID
            startDate: courseForm.startDate,
            endDate: courseForm.endDate,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create course');
        }

        toast({
          title: "Course Created",
          description: "The course has been successfully created.",
          variant: "default",
        });
        await rerefetchCourses();
        setIsCreateCourseModalOpen(false);
      } else if (isEditCourseModalOpen && selectedCourse) {
        // Update existing course
        const response = await fetch(`/api/courses/${selectedCourse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: courseForm.name,
            code: courseForm.code,
            description: courseForm.description,
            instructorId: courseForm.instructor,
            startDate: courseForm.startDate,
            endDate: courseForm.endDate,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update course');
        }

        toast({
          title: "Course Updated",
          description: "The course has been successfully updated.",
          variant: "default",
        });
        await rerefetchCourses();
        setIsEditCourseModalOpen(false);
      }
      
      setCourseForm({
        name: '',
        code: '',
        section: 'A',
        description: '',
        instructor: '',
        maxStudents: 50,
        startDate: '',
        endDate: '',
        status: 'Draft'
      });
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      await rerefetchCourses();
      toast({
        title: "Course Deleted",
        description: "The course has been successfully deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isActive: false, // Set to false to archive the course
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive course');
      }

      await rerefetchCourses();
      toast({
        title: "Course Archived",
        description: "The course has been successfully archived.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error archiving course:', error);
      toast({
        title: "Error",
        description: "Failed to archive course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnarchiveCourse = async (course: any) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isActive: true, // Set to true to unarchive the course
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unarchive course');
      }

      await rerefetchCourses();
      toast({
        title: "Course Unarchived",
        description: "The course has been successfully unarchived.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error unarchiving course:', error);
      toast({
        title: "Error",
        description: "Failed to unarchive course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageEnrollment = async (course: any) => {
    console.log('Opening enrollment modal for course:', course);
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
    // Fetch enrolled students and available students
    await Promise.all([
      fetchEnrolledStudents(course.id),
      fetchAvailableStudents()
    ]);
  };

  // Filter courses based on search and filters
  const filteredCourses = courses.filter((course: any) => {
    const courseName = course.name || course.title || '';
    const courseCode = course.code || '';
    const instructorName = getInstructorName(course.instructorId || course.instructor) || '';
    
    const matchesSearch = courseName.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         courseCode.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                         instructorName.toLowerCase().includes(courseSearchQuery.toLowerCase());
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

  const { data: recentActivity = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ['api', 'admin', 'activity'],
    queryFn: () => fetch('/api/admin/activity?limit=10', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 3000, // Auto-refresh activity every 3 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
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

      {/* Add User Button */}
      <div className="flex justify-end">
        <Button onClick={handleAddUser} className="mb-4">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Instructor
        </Button>
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
      <div className="grid gap-6">
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

  const renderSystemLogs = () => {
    const getLevelBadge = (level: string) => {
      const variants: Record<string, any> = {
        info: "default",
        warning: "outline", 
        error: "destructive",
        debug: "secondary"
      };
      const colors: Record<string, string> = {
        info: "bg-green-500",
        warning: "border-yellow-500 text-yellow-500",
        error: "",
        debug: "bg-blue-500"
      };
      
      return (
        <Badge 
          variant={variants[level] as any} 
          className={colors[level]}
        >
          {level.toUpperCase()}
        </Badge>
      );
    };

    const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleString();
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Logs</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" data-testid="button-system-settings" onClick={handleSystemSettings}>
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
            <Button 
              data-testid="button-export-logs" 
              onClick={handleRefreshLogs}
              disabled={logsRefreshing}
              variant="outline"
            >
              {logsRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {logsRefreshing ? 'Refreshing...' : 'Refresh Logs'}
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
          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Total Logs: {logsPagination.total}</span>
              {lastRefreshTime && (
                <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
              )}
            </div>
            {logsRefreshing && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-10"
                value={logsFilters.search}
                onChange={(e) => setLogsFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select value={logsFilters.level} onValueChange={(value) => setLogsFilters(prev => ({ ...prev, level: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
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
                  {logsLoading && logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading logs...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: any) => (
                      <TableRow key={log.id} className={logsRefreshing ? 'opacity-75' : ''}>
                        <TableCell className="text-muted-foreground">
                          {formatTimestamp(log.createdAt)}
                        </TableCell>
                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell className="max-w-md truncate">{log.message}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.userId ? 'User' : 'System'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((logsPagination.page - 1) * logsPagination.limit) + 1} to {Math.min(logsPagination.page * logsPagination.limit, logsPagination.total)} of {logsPagination.total} log entries.
            </p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={logsPagination.page === 1}
                onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                {logsPagination.page}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={logsPagination.page * logsPagination.limit >= logsPagination.total}
                onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                <p className="text-2xl font-bold">{courses.filter((c: any) => c.status === 'Published').length}</p>
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
                <p className="text-2xl font-bold">{courses.filter((c: any) => c.status === 'Draft').length}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">{courses.filter((c: any) => c.status === 'Archived').length}</p>
              </div>
              <Archive className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                <p className="text-2xl font-bold">{courses.reduce((sum: any, c: any) => sum + c.enrolledStudents, 0)}</p>
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
              {filteredCourses.map((course: any) => (
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
                        course.status === 'Archived' ? 'destructive' :
                        'outline'
                      }
                      className={
                        course.status === 'Published' ? 'bg-green-500 hover:bg-green-600' :
                        course.status === 'Draft' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        course.status === 'Archived' ? 'bg-red-500 hover:bg-red-600' :
                        ''
                      }
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getInstructorName(course.instructor)}</TableCell>
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
                      {course.status === 'Published' ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleArchiveCourse(course)}
                          title="Archive Course"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnarchiveCourse(course)}
                          title="Unarchive Course"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
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
                    <p className="text-2xl font-bold">{courses.reduce((sum: any, c: any) => sum + c.enrolledStudents, 0)}</p>
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
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course to view detailed reports" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {/* Handle export course report */}}
              disabled={!courseReport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {courseReportLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading course report...
            </div>
          ) : courseReport ? (
            <div className="space-y-6">
              {/* Course Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-lg">{courseReport.course.title}</h3>
                      <p className="text-muted-foreground">{courseReport.course.code} - Section {courseReport.course.section}</p>
                      <p className="text-sm text-muted-foreground mt-2">{courseReport.course.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <span className="font-medium">{courseReport.course.instructor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={courseReport.course.status === 'Published' ? 'default' : 'secondary'}>
                          {courseReport.course.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(courseReport.course.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Enrolled Students</p>
                        <p className="text-2xl font-bold">{courseReport.metrics.totalEnrolled}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assignments</p>
                        <p className="text-2xl font-bold">{courseReport.metrics.totalAssignments}</p>
                        <p className="text-xs text-muted-foreground">{courseReport.metrics.publishedAssignments} published</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Grade</p>
                        <p className="text-2xl font-bold">{courseReport.metrics.averageGrade}/100</p>
                        <p className="text-xs text-muted-foreground">{courseReport.metrics.gradedSubmissions} graded</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Submission Rate</p>
                        <p className="text-2xl font-bold">{courseReport.metrics.submissionRate}%</p>
                        <p className="text-xs text-muted-foreground">{courseReport.metrics.totalSubmissions} submissions</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    {Object.entries(courseReport.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                        <div className="text-sm text-muted-foreground">Grade {grade}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers and Students at Risk */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courseReport.topPerformers.length > 0 ? (
                      <div className="space-y-2">
                        {courseReport.topPerformers.map((student: any, index: number) => (
                          <div key={student.studentId} className="flex justify-between items-center">
                            <span className="text-sm">Student {student.studentId.slice(-4)}</span>
                            <Badge variant="default">{student.averageGrade.toFixed(1)}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No grades available yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Students at Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courseReport.studentsAtRisk.length > 0 ? (
                      <div className="space-y-2">
                        {courseReport.studentsAtRisk.map((student: any, index: number) => (
                          <div key={student.studentId} className="flex justify-between items-center">
                            <span className="text-sm">Student {student.studentId.slice(-4)}</span>
                            <div className="text-right">
                              <Badge variant="destructive">{student.averageGrade.toFixed(1)}</Badge>
                              <p className="text-xs text-muted-foreground">{student.missingAssignments} missing</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">No students at risk</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Assignments Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignments Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseReport.assignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Submissions: </span>
                              <span className="font-medium">{assignment.submissions}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Avg Score: </span>
                              <span className="font-medium">{assignment.averageScore}/100</span>
                            </div>
                            <Badge variant={assignment.isPublished ? 'default' : 'secondary'}>
                              {assignment.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : selectedCourseId ? (
            <div className="text-center py-8 text-muted-foreground">
              No course selected
            </div>
          ) : null}
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
                value={activityLogsSearch}
                onChange={(e) => setActivityLogsSearch(e.target.value)}
              />
            </div>
            <Select value={activityLogsFilter} onValueChange={setActivityLogsFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="registration">Registrations</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="deletion">Deletions</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchActivityLogs} disabled={activityLogsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${activityLogsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading activity logs...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredActivityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivityLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.level === 'error' ? 'destructive' : 
                                   log.level === 'warning' ? 'secondary' : 'outline'}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell className="text-muted-foreground">{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to {filteredActivityLogs.length} of {filteredActivityLogs.length} activity logs.
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
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              {isActivityLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>Latest system events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isActivityLoading && recentActivity.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Loading activities...</span>
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.slice(0, 4).map((activity: any) => {
                  const timestamp = new Date(activity.timestamp);
                  const timeAgo = getTimeAgo(timestamp);
                  
                  return (
                    <div key={activity.id} className="border-b pb-2 last:border-0">
                      <div className="flex items-start space-x-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.level === 'error' ? 'bg-red-500' : 
                          activity.level === 'warning' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" data-testid={`text-activity-${activity.id}`}>
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
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
              <div className="flex items-center space-x-2">
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
            <DialogTitle>Add New Instructor</DialogTitle>
            <DialogDescription>
              Create a new instructor account for the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Surname</Label>
                <Input
                  id="lastName"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                  placeholder="Enter surname"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={userForm.status}
                onValueChange={(value) => setUserForm({ ...userForm, status: value as 'Active' | 'Inactive' | 'Pending' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Create Instructor
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Surname</Label>
                <Input
                  id="edit-lastName"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                  placeholder="Enter surname"
                />
              </div>
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
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value as 'Professor'})}>
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
              <Select value={userForm.status} onValueChange={(value) => setUserForm({...userForm, status: value as 'Active' | 'Inactive' | 'Pending'})}>
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
              <div>
                <Label htmlFor="course-section">Section</Label>
                <Input
                  id="course-section"
                  value={courseForm.section || 'A'}
                  onChange={(e) => setCourseForm({...courseForm, section: e.target.value})}
                  placeholder="e.g., A, B, 1, 2"
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
                <Select
                  value={courseForm.instructor}
                  onValueChange={(value) => setCourseForm({...courseForm, instructor: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorsLoading ? (
                      <SelectItem value="" disabled>Loading instructors...</SelectItem>
                    ) : instructors.length === 0 ? (
                      <SelectItem value="" disabled>No instructors available</SelectItem>
                    ) : (
                      instructors.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName} ({instructor.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                <Select
                  value={courseForm.instructor}
                  onValueChange={(value) => setCourseForm({...courseForm, instructor: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorsLoading ? (
                      <SelectItem value="" disabled>Loading instructors...</SelectItem>
                    ) : instructors.length === 0 ? (
                      <SelectItem value="" disabled>No instructors available</SelectItem>
                    ) : (
                      instructors.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName} ({instructor.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                <h3 className="font-medium mb-3">Enrolled Students ({enrolledStudents.length})</h3>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {enrolledStudents.length > 0 ? (
                    <div className="space-y-2">
                      {enrolledStudents.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">
                              {enrollment.student ? `${enrollment.student.firstName} ${enrollment.student.lastName}` : 'Unknown Student'}
                            </span>
                            <p className="text-xs text-muted-foreground">{enrollment.student?.email}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => unenrollStudent(selectedCourse.id, enrollment.studentId)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet</p>
                  )}
                </div>
                <Button 
                  className="w-full mt-3"
                  onClick={() => {
                    if (selectedStudents.length > 0) {
                      enrollStudents(selectedCourse.id, selectedStudents);
                    }
                  }}
                  disabled={selectedStudents.length === 0 || enrollmentLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {enrollmentLoading ? 'Enrolling...' : `Add ${selectedStudents.length} Students`}
                </Button>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Available Students</h3>
                <div className="border-2 border-blue-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-blue-50/10">
                  {availableStudents.length > 0 ? (
                    <div className="space-y-2">
                      {availableStudents
                        .filter(student => !enrolledStudents.some(enrollment => enrollment.studentId === student.id))
                        .map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-white/90 dark:bg-gray-800/90 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, student.id]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.firstName} {student.lastName}</span>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{student.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No available students</p>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudents(availableStudents
                      .filter(student => !enrolledStudents.some(enrollment => enrollment.studentId === student.id))
                      .map(student => student.id)
                    )}
                    className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  >
                    Select All Available
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudents([])}
                    className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Clear Selection
                  </Button>
                </div>
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