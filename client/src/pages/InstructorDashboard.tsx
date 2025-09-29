import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, FileText, Brain, Plus, User, LogOut, Settings, BarChart3, Calendar, Eye, Clock, Edit, Trash2, CheckCircle, Menu, Megaphone, MessageSquare, Bell, Save, Upload, Download, Shield, Mail, Bell as BellIcon, Palette, Globe, Lock, Key, Trash, AlertTriangle, CheckCircle2, Camera, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import CourseManagement from "./CourseManagement";
import InstructorContentManagement from "./InstructorContentManagement";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";

// Helper function for GET requests that returns parsed JSON
const apiGet = async (url: string): Promise<any> => {
  const response = await apiRequest('GET', url);
  return await response.json();
};

// Type definitions
interface Course {
  id: string;
  title: string;
  code: string;
  section?: string;
  isActive?: boolean;
}

interface Submission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  courseCode?: string;
  courseTitle?: string;
  [key: string]: any;
}

// Mock user data - will be replaced with actual authentication
const mockInstructor = {
  id: "1",
  firstName: "Dr. Maria",
  lastName: "Martinez",
  email: "maria.martinez@ollc.edu",
  role: "instructor" as const,
};

// Assignment schema for form validation
const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.string().min(1, "Course is required"),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.number().min(1, "Max score must be at least 1"),
  isPublished: z.boolean().default(false),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

// Assignment type
interface Assignment {
  id: string;
  title: string;
  courseCode?: string;
  courseTitle?: string;
  courseId: string;
  description: string;
  dueDate: string;
  maxScore: number;
  isPublished: boolean;
  submissionsCount: number;
  gradedCount: number;
  createdAt: string;
}

export default function InstructorDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'course-management' | 'assignments' | 'grading' | 'content' | 'settings'>('overview');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Review functionality state
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);
  const [gradingForm, setGradingForm] = useState({ score: '', feedback: '' });
  const [plagiarismResults, setPlagiarismResults] = useState<any>(null);
  const [autoGradingResults, setAutoGradingResults] = useState<any>(null);
  
  // Chat functionality state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Dr. Martinez", message: "Welcome to the instructor chat! Feel free to ask any questions.", timestamp: "2:30 PM" },
    { id: 2, sender: "System", message: "AI grading is now available for all assignments.", timestamp: "2:32 PM" },
  ]);

  // Notification functionality state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: "1", title: "New Assignment Submission", message: "Sarah Johnson submitted 'Essay on AI Ethics'", timestamp: "2:30 PM", isRead: false, type: "info" },
    { id: "2", title: "Grade Reminder", message: "3 assignments pending review in CS101", timestamp: "1:45 PM", isRead: false, type: "warning" },
    { id: "3", title: "System Update", message: "AI grading features have been updated", timestamp: "12:00 PM", isRead: true, type: "success" },
    { id: "4", title: "Student Question", message: "Mike Chen asked about assignment requirements", timestamp: "11:30 AM", isRead: true, type: "info" },
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

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: "Computer Science",
    title: "Associate Professor",
    bio: "Passionate educator with expertise in AI and machine learning. Committed to fostering student success through innovative teaching methods.",
    timezone: "America/New_York",
    language: "en"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    assignmentSubmissions: true,
    gradeReminders: true,
    systemUpdates: true,
    studentMessages: true,
    weeklyDigest: false,
    pushNotifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: true,
    showCourses: true,
    allowMessages: true,
    dataSharing: false
  });

  // Loading states for settings save operations
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  
  // Analytics and Settings state
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<any>(null);
  const [newRubric, setNewRubric] = useState<{ name: string; criteria: Array<{ name: string; weight: number; description: string }> }>({ name: '', criteria: [] });
  const [gradingSettings, setGradingSettings] = useState({
    aiGradingEnabled: true,
    plagiarismThreshold: 15,
    autoGradeThreshold: 80,
    feedbackTemplates: ['Excellent work!', 'Good effort, but needs improvement.', 'Please review the requirements.'],
    customRubrics: [
      {
        id: '1',
        name: 'Essay Writing Rubric',
        criteria: [
          { name: 'Thesis Statement', weight: 20, description: 'Clear, arguable thesis that guides the essay' },
          { name: 'Content & Analysis', weight: 30, description: 'Depth of analysis and quality of supporting evidence' },
          { name: 'Organization', weight: 20, description: 'Logical flow and clear paragraph structure' },
          { name: 'Grammar & Style', weight: 15, description: 'Proper grammar, punctuation, and writing style' },
          { name: 'Citations', weight: 15, description: 'Proper citation format and academic integrity' }
        ],
        isDefault: true
      },
      {
        id: '2',
        name: 'Research Paper Rubric',
        criteria: [
          { name: 'Research Quality', weight: 25, description: 'Quality and relevance of sources used' },
          { name: 'Argument Development', weight: 25, description: 'Strength and clarity of argumentation' },
          { name: 'Critical Thinking', weight: 20, description: 'Analysis and evaluation of information' },
          { name: 'Writing Quality', weight: 15, description: 'Clarity, coherence, and style' },
          { name: 'Format & Citations', weight: 15, description: 'Proper formatting and citation style' }
        ],
        isDefault: true
      }
    ],
    selectedRubricId: '1'
  });
  
  // Assignment management state
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "1",
      title: "Data Structures Project",
      courseCode: "CS201",
      courseTitle: "Data Structures and Algorithms",
      courseId: "cs201",
      description: "Implement a binary search tree with basic operations.",
      dueDate: "2024-11-15T23:59:00Z",
      maxScore: 100,
      isPublished: true,
      submissionsCount: 22,
      gradedCount: 18,
      createdAt: "2024-10-01T10:00:00Z"
    },
    {
      id: "2",
      title: "Machine Learning Quiz",
      courseCode: "CS401",
      courseTitle: "Machine Learning Fundamentals",
      courseId: "cs401",
      description: "Quiz covering supervised learning algorithms and neural networks.",
      dueDate: "2024-10-25T14:30:00Z",
      maxScore: 50,
      isPublished: true,
      submissionsCount: 28,
      gradedCount: 28,
      createdAt: "2024-10-10T09:00:00Z"
    },
    {
      id: "3",
      title: "Web Development Portfolio",
      courseCode: "CS201",
      courseTitle: "Web Development Fundamentals",
      courseId: "cs201",
      description: "Create a responsive portfolio website using HTML, CSS, and JavaScript.",
      dueDate: "2024-11-30T23:59:00Z",
      maxScore: 150,
      isPublished: true,
      submissionsCount: 15,
      gradedCount: 8,
      createdAt: "2024-09-15T14:00:00Z"
    },
    {
      id: "4",
      title: "Database Design Assignment",
      courseCode: "CS302",
      courseTitle: "Database Systems",
      courseId: "cs302",
      description: "Design a normalized database schema for an e-commerce system.",
      dueDate: "2024-10-20T17:00:00Z",
      maxScore: 75,
      isPublished: false,
      submissionsCount: 0,
      gradedCount: 0,
      createdAt: "2024-10-05T11:30:00Z"
    }
  ]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "drafts">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for creating/editing assignments
  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      dueDate: "",
      maxScore: 100,
      isPublished: false,
    },
  });

  // Mock courses for assignment form
  const courses = [
    { id: "cs201-a", code: "CS201", section: "A", title: "Data Structures and Algorithms" },
    { id: "cs201-b", code: "CS201", section: "B", title: "Data Structures and Algorithms" },
    { id: "cs401-a", code: "CS401", section: "A", title: "Machine Learning Fundamentals" },
    { id: "cs201-web", code: "CS201", section: "Web", title: "Web Development Fundamentals" },
    { id: "cs302-a", code: "CS302", section: "A", title: "Database Systems" },
  ];

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          instructions: data.description, // Use description as instructions for now
          maxScore: data.maxScore,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          rubric: null, // Default to null for now
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }
      
      return await response.json();
    },
    onSuccess: (newAssignment) => {
      // Refresh assignments list by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      assignmentForm.reset();
      setIsCreateDialogOpen(false);
      toast({
        title: "Assignment Created",
        description: "Assignment has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignmentFormData }) => {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          instructions: data.description, // Use description as instructions for now
          maxScore: data.maxScore,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          rubric: null, // Default to null for now
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }
      
      return await response.json();
    },
    onSuccess: (updatedAssignment) => {
      // Refresh assignments list by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      assignmentForm.reset();
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      toast({
        title: "Assignment Updated",
        description: "Assignment has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return id;
    },
    onSuccess: (id) => {
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      toast({
        title: "Assignment Deleted",
        description: "Assignment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleCreateAssignment = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const handleEditAssignment = (data: AssignmentFormData) => {
    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment.id, data });
    }
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      deleteAssignmentMutation.mutate(id);
    }
  };


  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    assignmentForm.reset({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      dueDate: assignment.dueDate.split('T')[0], // Convert to date input format
      maxScore: assignment.maxScore,
      isPublished: assignment.isPublished,
    });
    setIsEditDialogOpen(true);
  };

  // Filter and search assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                         (assignment.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "published" && assignment.isPublished) ||
                         (filterStatus === "drafts" && !assignment.isPublished);
    
    const matchesCourse = selectedCourseId === null || assignment.courseId === selectedCourseId;
    
    return matchesSearch && matchesFilter && matchesCourse;
  });

  // Sign out handler
  const handleSignOut = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Navigate back to login page
    setLocation('/login');
  };

  // Chat functionality handlers
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: user ? `${user.firstName} ${user.lastName}` : 'Instructor',
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Button handlers for submission actions
  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const handleGradeSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setGradingForm({ 
      score: submission.aiGrade?.toString() || '', 
      feedback: '' 
    });
    setIsGradingModalOpen(true);
  };

  const handleAutomaticGrading = (submission: any) => {
    setSelectedSubmission(submission);
    
    // Simulate AI grading process
    toast({
      title: "Automatic Grading Started",
      description: `Running AI grading for ${submission.assignmentTitle}...`,
    });

    // Simulate processing time
    setTimeout(() => {
      const mockGrade = Math.floor(Math.random() * 30) + 70; // 70-100
      const mockFeedback = `AI Analysis: The essay demonstrates ${mockGrade >= 85 ? 'strong' : 'adequate'} understanding of the topic. ${mockGrade >= 90 ? 'Excellent structure and argumentation.' : 'Good points made with room for improvement in organization.'}`;
      
      setAutoGradingResults({
        score: mockGrade,
        feedback: mockFeedback,
        criteria: {
          content: Math.floor(Math.random() * 20) + 80,
          structure: Math.floor(Math.random() * 20) + 80,
          grammar: Math.floor(Math.random() * 20) + 80,
          originality: Math.floor(Math.random() * 20) + 80
        }
      });
      
      toast({
        title: "Automatic Grading Complete",
        description: `AI grade: ${mockGrade}% - Ready for review`,
      });
    }, 2000);
  };

  const handleCheckPlagiarism = (submission: any) => {
    setSelectedSubmission(submission);
    
    toast({
      title: "Plagiarism Check Started",
      description: `Scanning ${submission.assignmentTitle} for plagiarism...`,
    });

    // Simulate plagiarism check
    setTimeout(() => {
      const plagiarismScore = Math.floor(Math.random() * 15); // 0-15%
      setPlagiarismResults({
        score: plagiarismScore,
        status: plagiarismScore < 5 ? 'Low Risk' : plagiarismScore < 10 ? 'Medium Risk' : 'High Risk',
        sources: plagiarismScore > 0 ? [
          { url: 'https://example.com/source1', similarity: Math.floor(Math.random() * 10) + 1 },
          { url: 'https://example.com/source2', similarity: Math.floor(Math.random() * 8) + 1 }
        ].slice(0, plagiarismScore > 5 ? 2 : 1) : []
      });
      
      setIsPlagiarismModalOpen(true);
      
      toast({
        title: "Plagiarism Check Complete",
        description: `Similarity: ${plagiarismScore}% - ${plagiarismScore < 5 ? 'Low Risk' : plagiarismScore < 10 ? 'Medium Risk' : 'High Risk'}`,
      });
    }, 1500);
  };

  const handleReviewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setIsReviewModalOpen(true);
  };

  const handleSaveGrade = () => {
    if (!gradingForm.score || !gradingForm.feedback) {
      toast({
        title: "Missing Information",
        description: "Please provide both score and feedback",
        variant: "destructive",
      });
      return;
    }

    // Update submission with new grade
    toast({
      title: "Grade Saved",
      description: `Grade of ${gradingForm.score}% saved for ${selectedSubmission?.assignmentTitle}`,
    });
    
    setIsGradingModalOpen(false);
    setGradingForm({ score: '', feedback: '' });
  };

  // Analytics and Settings handlers
  const handleViewAnalytics = () => {
    setIsAnalyticsModalOpen(true);
  };

  const handleGradingSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Grading settings have been updated successfully",
    });
    setIsSettingsModalOpen(false);
  };

  // Rubric management functions
  const handleCreateRubric = () => {
    setEditingRubric(null);
    setNewRubric({ name: '', criteria: [] });
    setIsRubricModalOpen(true);
  };

  const handleEditRubric = (rubric: any) => {
    setEditingRubric(rubric);
    setNewRubric({ name: rubric.name, criteria: [...rubric.criteria] });
    setIsRubricModalOpen(true);
  };

  const handleDeleteRubric = (rubricId: string) => {
    if (gradingSettings.customRubrics.find(r => r.id === rubricId)?.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default rubrics cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setGradingSettings({
      ...gradingSettings,
      customRubrics: gradingSettings.customRubrics.filter(r => r.id !== rubricId),
      selectedRubricId: gradingSettings.selectedRubricId === rubricId ? gradingSettings.customRubrics[0]?.id : gradingSettings.selectedRubricId
    });

    toast({
      title: "Rubric Deleted",
      description: "Rubric has been removed successfully",
    });
  };

  const handleAddCriterion = () => {
    setNewRubric({
      ...newRubric,
      criteria: [...newRubric.criteria, { name: '', weight: 20, description: '' }]
    });
  };

  const handleUpdateCriterion = (index: number, field: string, value: any) => {
    const updatedCriteria = [...newRubric.criteria];
    updatedCriteria[index] = { ...updatedCriteria[index], [field]: value };
    setNewRubric({ ...newRubric, criteria: updatedCriteria });
  };

  const handleRemoveCriterion = (index: number) => {
    setNewRubric({
      ...newRubric,
      criteria: newRubric.criteria.filter((_, i) => i !== index)
    });
  };

  const handleSaveRubric = () => {
    if (!newRubric.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a rubric name",
        variant: "destructive",
      });
      return;
    }

    if (newRubric.criteria.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one criterion",
        variant: "destructive",
      });
      return;
    }

    const totalWeight = newRubric.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      toast({
        title: "Invalid Weights",
        description: "Total weight must equal 100%",
        variant: "destructive",
      });
      return;
    }

    if (editingRubric) {
      // Update existing rubric
      setGradingSettings({
        ...gradingSettings,
        customRubrics: gradingSettings.customRubrics.map(r => 
          r.id === editingRubric.id 
            ? { ...r, name: newRubric.name, criteria: newRubric.criteria }
            : r
        )
      });
      toast({
        title: "Rubric Updated",
        description: "Rubric has been updated successfully",
      });
    } else {
      // Create new rubric
      const newId = Date.now().toString();
      setGradingSettings({
        ...gradingSettings,
        customRubrics: [...gradingSettings.customRubrics, {
          id: newId,
          name: newRubric.name,
          criteria: newRubric.criteria,
          isDefault: false
        }]
      });
      toast({
        title: "Rubric Created",
        description: "New rubric has been created successfully",
      });
    }

    setIsRubricModalOpen(false);
    setEditingRubric(null);
    setNewRubric({ name: '', criteria: [] });
  };

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    return {
      totalSubmissions: 45,
      gradedSubmissions: 38,
      pendingSubmissions: 7,
      averageGrade: 82.5,
      gradeDistribution: [
        { range: "90-100", count: 12, percentage: 31.6 },
        { range: "80-89", count: 15, percentage: 39.5 },
        { range: "70-79", count: 8, percentage: 21.1 },
        { range: "60-69", count: 2, percentage: 5.3 },
        { range: "Below 60", count: 1, percentage: 2.6 }
      ],
      plagiarismStats: {
        totalChecked: 45,
        lowRisk: 38,
        mediumRisk: 5,
        highRisk: 2,
        averageSimilarity: 8.2
      },
      gradingTime: {
        averageTime: 12.5, // minutes
        totalTime: 475, // minutes
        fastestGrade: 3.2,
        slowestGrade: 28.7
      },
      commonIssues: [
        { issue: "Grammar errors", count: 23, percentage: 51.1 },
        { issue: "Weak thesis statement", count: 18, percentage: 40.0 },
        { issue: "Poor organization", count: 15, percentage: 33.3 },
        { issue: "Insufficient evidence", count: 12, percentage: 26.7 },
        { issue: "Citation problems", count: 9, percentage: 20.0 }
      ],
      weeklyTrends: [
        { week: "Week 1", submissions: 8, averageGrade: 78.5 },
        { week: "Week 2", submissions: 12, averageGrade: 82.1 },
        { week: "Week 3", submissions: 15, averageGrade: 85.3 },
        { week: "Week 4", submissions: 10, averageGrade: 84.7 }
      ]
    };
  };

  // Fetch instructor's courses
  const { data: teachingCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses/instructor', mockInstructor.id],
    queryFn: () => apiGet(`/api/courses/instructor/${mockInstructor.id}`),
    enabled: true,
  });

  // Fetch course statistics (enrollments, assignments, pending grades)
  const { data: courseStats = {} } = useQuery({
    queryKey: ['/api/courses/stats', mockInstructor.id],
    queryFn: async () => {
      const stats: Record<string, { students: number; assignments: number; pendingGrades: number }> = {};
      
      for (const course of teachingCourses) {
        try {
          const [enrollments, assignments, pendingGrades] = await Promise.all([
            apiGet(`/api/courses/${course.id}/enrollments`).then(data => data.length).catch(() => 0),
            apiGet(`/api/courses/${course.id}/assignments`).then(data => data.length).catch(() => 0),
            apiGet(`/api/courses/${course.id}/pending-grades`).then(data => data.length).catch(() => 0),
          ]);
          
          stats[course.id] = { students: enrollments, assignments, pendingGrades };
        } catch (error) {
          console.error(`Error fetching stats for course ${course.id}:`, error);
          stats[course.id] = { students: 0, assignments: 0, pendingGrades: 0 };
        }
      }
      
      return stats;
    },
    enabled: teachingCourses.length > 0,
  });

  // Fetch assignments for all courses
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/instructor', mockInstructor.id],
    queryFn: async () => {
      const assignments: Assignment[] = [];
      for (const course of teachingCourses) {
        try {
          const courseAssignments = await apiGet(`/api/courses/${course.id}/assignments`);
          assignments.push(...courseAssignments.map((assignment: any) => ({
            ...assignment,
            courseTitle: course.title,
            courseCode: course.code
          })));
        } catch (error) {
          console.error(`Error fetching assignments for course ${course.id}:`, error);
        }
      }
      return assignments;
    },
    enabled: teachingCourses.length > 0,
  });

  // Fetch recent submissions
  const { data: recentSubmissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions/recent', mockInstructor.id],
    queryFn: async () => {
      const submissions: Submission[] = [];
      
      // Try to fetch real submissions if courses are available
      if (teachingCourses.length > 0) {
        for (const course of teachingCourses) {
          try {
            const courseSubmissions = await apiGet(`/api/courses/${course.id}/submissions/recent`);
            submissions.push(...courseSubmissions.map((submission: any) => ({
              ...submission,
              courseTitle: course.title,
              courseCode: course.code
            })));
          } catch (error) {
            console.error(`Error fetching submissions for course ${course.id}:`, error);
          }
        }
      }
      
      // If no real submissions, return sample data for demonstration
      if (submissions.length === 0) {
        return [
          {
            id: 'sample-1',
            studentName: 'John Smith',
            assignmentTitle: 'Essay on Climate Change',
            courseCode: 'ENV-101',
            courseTitle: 'Environmental Science',
            status: 'submitted',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            aiGrade: null,
            content: 'This is a sample essay about climate change and its impact on global ecosystems...',
            wordCount: 1250
          },
          {
            id: 'sample-2',
            studentName: 'Sarah Johnson',
            assignmentTitle: 'Critical Analysis of Modern Literature',
            courseCode: 'ENG-201',
            courseTitle: 'English Literature',
            status: 'graded',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            aiGrade: 87,
            content: 'A detailed analysis of contemporary literary themes and their social implications...',
            wordCount: 2100
          },
          {
            id: 'sample-3',
            studentName: 'Michael Chen',
            assignmentTitle: 'Research Paper on AI Ethics',
            courseCode: 'CS-301',
            courseTitle: 'Computer Science Ethics',
            status: 'submitted',
            submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            aiGrade: null,
            content: 'An analysis of ethical considerations in artificial intelligence development...',
            wordCount: 3200
          },
          {
            id: 'sample-4',
            studentName: 'Emily Davis',
            assignmentTitle: 'Reflective Essay on Social Psychology',
            courseCode: 'PSY-102',
            courseTitle: 'Introduction to Psychology',
            status: 'graded',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            aiGrade: 92,
            content: 'A personal reflection on social psychology concepts and their real-world applications...',
            wordCount: 1800
          },
          {
            id: 'sample-5',
            studentName: 'Alex Rodriguez',
            assignmentTitle: 'Argumentative Essay on Digital Privacy',
            courseCode: 'PHIL-201',
            courseTitle: 'Ethics and Technology',
            status: 'submitted',
            submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            aiGrade: null,
            content: 'An argumentative piece examining the balance between digital privacy and security...',
            wordCount: 1500
          }
        ];
      }
      
      return submissions.sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime()).slice(0, 10);
    },
    enabled: true, // Always enabled to show sample data
  });

  const renderAssignments = () => {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Assignments</h2>
              {selectedCourseId && (
                <Badge variant="secondary" className="text-sm">
                  {(() => {
                    const course = courses.find(c => c.id === selectedCourseId);
                    return course ? `${course.code}${course.section ? ` - Section ${course.section}` : ''}` : 'Selected Course';
                  })()}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {selectedCourseId 
                ? `Manage assignments for ${courses.find(c => c.id === selectedCourseId)?.title || 'selected course'}`
                : "Manage assignments across all your courses"
              }
            </p>
            {selectedCourseId && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedCourseId(null)}
                className="mt-1 p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              >
                ← View all courses
              </Button>
            )}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-assignment">
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Add a new assignment to one of your courses
                </DialogDescription>
              </DialogHeader>
              <Form {...assignmentForm}>
                <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="space-y-4">
                  <FormField
                    control={assignmentForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter assignment description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} - Section {course.section} - {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish Assignment</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Make this assignment visible to students
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Simple Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">
                {assignments.filter(a => a.isPublished).length} published
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.reduce((sum, a) => sum + a.submissionsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all assignments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.reduce((sum, a) => sum + (a.submissionsCount - a.gradedCount), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <Input 
            placeholder="Search assignments..." 
            className="max-w-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            variant={filterStatus === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All Courses
          </Button>
          <Button 
            variant={filterStatus === "published" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("published")}
          >
            Published
          </Button>
          <Button 
            variant={filterStatus === "drafts" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("drafts")}
          >
            Drafts
          </Button>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterStatus !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't created any assignments yet. Start by creating your first assignment."
                  }
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                          {assignment.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.courseCode || 'N/A'} - Section {courses.find(c => c.id === assignment.courseId)?.section || 'Unknown'} • {assignment.courseTitle || 'N/A'}
                      </p>
                      <p className="text-sm">{assignment.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Max Score: {assignment.maxScore}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Submissions: {assignment.submissionsCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(assignment)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={deleteAssignmentMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Assignment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>
                Update assignment details
              </DialogDescription>
            </DialogHeader>
            <Form {...assignmentForm}>
              <form onSubmit={assignmentForm.handleSubmit(handleEditAssignment)} className="space-y-4">
                <FormField
                  control={assignmentForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assignment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignmentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter assignment description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignmentForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} - {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignmentForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignmentForm.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignmentForm.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Assignment</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this assignment visible to students
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateAssignmentMutation.isPending}>
                    {updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderAIGrading = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Review Center</h2>
          <p className="text-muted-foreground">Review and grade student written assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewAnalytics}>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button variant="outline" onClick={handleGradingSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Grading Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSubmissions.filter(s => s.status === 'pending' || s.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">Submissions awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSubmissions.filter(s => s.status === 'graded').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSubmissions.length > 0 
                ? Math.round(recentSubmissions.reduce((sum, s) => sum + (s.aiGrade || 0), 0) / recentSubmissions.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {submissionsLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading submissions...</p>
          </CardContent>
        </Card>
      ) : recentSubmissions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No written assignments to review</h3>
            <p className="text-muted-foreground mb-4">
              Student essays and written assignments will appear here once they submit their work for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Written Assignments</CardTitle>
            <CardDescription>Review and grade student essays, papers, and written responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{submission.studentName || 'Unknown Student'}</h3>
                      <Badge variant={
                        submission.status === 'graded' ? 'default' : 
                        submission.status === 'submitted' ? 'secondary' : 
                        'outline'
                      }>
                        {submission.status === 'graded' ? 'Graded' : 
                         submission.status === 'submitted' ? 'Submitted' : 
                         submission.status === 'draft' ? 'Draft' : 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {submission.assignmentTitle || 'Unknown Assignment'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submission.courseCode || 'Unknown Course'} • 
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Unknown date'}
                      {submission.wordCount && ` • ${submission.wordCount} words`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-3">
                      {submission.status === 'graded' ? `${submission.aiGrade || 0}%` : '--'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        {submission.status === 'submitted' ? (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1"
                            onClick={() => handleGradeSubmission(submission)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Grade
                          </Button>
                        ) : submission.status === 'graded' ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleGradeSubmission(submission)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Regrade
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleAutomaticGrading(submission)}
                          className="text-xs"
                        >
                          <Brain className="mr-1 h-3 w-3" />
                          Auto Grade
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleCheckPlagiarism(submission)}
                          className="text-xs"
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Plagiarism
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleReviewSubmission(submission)}
                          className="text-xs"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );


  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-courses">
              {teachingCourses.filter((course: Course) => course.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-students">
              {Object.values(courseStats).reduce((sum, stats) => sum + stats.students, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-reviews">
              {Object.values(courseStats).reduce((sum, stats) => sum + stats.pendingGrades, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Graded Today</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-graded">
              {submissionsLoading ? '...' : recentSubmissions.filter(s => s.status === 'ai_graded').length}
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest student submissions and AI grading results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissionsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading submissions...</p>
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent submissions</p>
                </div>
              ) : (
                recentSubmissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium" data-testid={`text-submission-student-${submission.id}`}>
                        {submission.studentName || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {submission.assignmentTitle || 'Unknown Assignment'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.courseCode || 'Unknown Course'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={submission.status === 'ai_graded' ? 'default' : 'secondary'}>
                        {submission.status?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                      <p className="text-sm font-medium mt-1">AI: {submission.aiGrade || 0}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Overview</CardTitle>
            <CardDescription>Your active courses and their statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachingCourses.map((course: Course) => {
                const stats = courseStats[course.id] || { students: 0, assignments: 0, pendingGrades: 0 };
                return (
                  <div key={course.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-base" data-testid={`text-course-title-${course.id}`}>
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{course.code}{course.section ? ` - Section ${course.section}` : ''}</p>
                      </div>
                      <Badge variant="outline">{stats.students} students</Badge>
                    </div>
                    
                    <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {stats.assignments} assignments
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {stats.pendingGrades} pending
                      </span>
                    </div>

                    {/* Manage Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setSelectedTab('assignments');
                        }}
                        className="flex-1"
                        data-testid={`button-manage-assignments-${course.id}`}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Assignments
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setSelectedTab('course-management');
                        }}
                        className="flex-1"
                        data-testid={`button-manage-students-${course.id}`}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Students  
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setSelectedTab('grading');
                        }}
                        className="flex-1"
                        data-testid={`button-manage-grades-${course.id}`}
                      >
                        <BarChart3 className="mr-1 h-3 w-3" />
                        Grades
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <textarea
                id="bio"
                rows={3}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
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
              Choose how you want to be notified about course activities
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
                    <Label htmlFor="emailAssignments">Assignment Submissions</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when students submit assignments</p>
                  </div>
                  <Switch
                    id="emailAssignments"
                    checked={notificationSettings.assignmentSubmissions}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, assignmentSubmissions: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailGrades">Grade Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded about pending grades</p>
                  </div>
                  <Switch
                    id="emailGrades"
                    checked={notificationSettings.gradeReminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, gradeReminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailMessages">Student Messages</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when students send messages</p>
                  </div>
                  <Switch
                    id="emailMessages"
                    checked={notificationSettings.studentMessages}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, studentMessages: checked})}
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
                    <Label htmlFor="weeklyDigest">Weekly Summary</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly summary of course activities</p>
                  </div>
                  <Switch
                    id="weeklyDigest"
                    checked={notificationSettings.weeklyDigest}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyDigest: checked})}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to students</p>
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
                <Label htmlFor="allowMessages">Allow Messages</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow students to message you</p>
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
                  <div className="relative inline-block">
                    <Button variant="ghost" size="sm" data-testid="button-notifications">
                      <Bell className="h-5 w-5" />
                    </Button>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </div>
                </PopoverTrigger>
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
                          data-testid={`notification-${notification.id}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'info' && (
                                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {notification.type === 'warning' && (
                                <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {notification.type === 'success' && (
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full"></div>
                                </div>
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
                    <span className="text-xs text-muted-foreground">Instructor</span>
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
              onClick={() => setSelectedTab('overview')}
              data-testid="button-tab-overview"
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <BookOpen className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            <Button
              variant={selectedTab === 'course-management' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('course-management')}
              data-testid="button-tab-course-management"
              title={isSidebarCollapsed ? "Course Management" : ""}
            >
              <Settings className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Course Management"}
            </Button>
            <Button
              variant={selectedTab === 'assignments' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('assignments')}
              data-testid="button-tab-assignments"
              title={isSidebarCollapsed ? "Assignments" : ""}
            >
              <FileText className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Assignments"}
            </Button>
            <Button
              variant={selectedTab === 'grading' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('grading')}
              data-testid="button-tab-grading"
              title={isSidebarCollapsed ? "Review" : ""}
            >
              <Brain className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Review"}
            </Button>
            <Button
              variant={selectedTab === 'content' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSelectedTab('content')}
              data-testid="button-tab-content"
              title={isSidebarCollapsed ? "Content Management" : ""}
            >
              <Megaphone className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Content Management"}
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
            {selectedTab === 'course-management' && (
              <CourseManagement />
            )}
            {selectedTab === 'assignments' && renderAssignments()}
            {selectedTab === 'grading' && renderAIGrading()}
            {selectedTab === 'content' && <InstructorContentManagement />}
            {selectedTab === 'settings' && renderSettings()}
          </div>
        </main>
      </div>

      {/* View Submission Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Submission: {selectedSubmission?.assignmentTitle}</DialogTitle>
            <DialogDescription>
              Student: {selectedSubmission?.studentName} • Course: {selectedSubmission?.courseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Assignment Content:</h4>
              <p className="text-sm whitespace-pre-wrap">{selectedSubmission?.content}</p>
            </div>
            {selectedSubmission?.wordCount && (
              <div className="text-sm text-muted-foreground">
                Word Count: {selectedSubmission.wordCount} words
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grading Modal */}
      <Dialog open={isGradingModalOpen} onOpenChange={setIsGradingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Assignment: {selectedSubmission?.assignmentTitle}</DialogTitle>
            <DialogDescription>
              Student: {selectedSubmission?.studentName} • Course: {selectedSubmission?.courseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="score">Score (%)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={gradingForm.score}
                onChange={(e) => setGradingForm({ ...gradingForm, score: e.target.value })}
                placeholder="Enter score (0-100)"
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradingForm.feedback}
                onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                placeholder="Enter detailed feedback for the student..."
                rows={6}
              />
            </div>
            {/* Custom Rubric Scoring */}
            {(() => {
              const selectedRubric = gradingSettings.customRubrics.find(r => r.id === gradingSettings.selectedRubricId);
              if (selectedRubric) {
                return (
                  <div className="space-y-4">
                    <h4 className="font-medium">Rubric: {selectedRubric.name}</h4>
                    <div className="space-y-3">
                      {selectedRubric.criteria.map((criterion, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`rubric-${criterion.name}-${index}`}>
                              {criterion.name} ({criterion.weight}%)
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {criterion.description}
                            </span>
                          </div>
                          <Input
                            id={`rubric-${criterion.name}-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            placeholder={`Score for ${criterion.name}`}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {autoGradingResults && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">AI Grading Suggestion:</h4>
                <p className="text-sm mb-2">Score: {autoGradingResults.score}%</p>
                <p className="text-sm">{autoGradingResults.feedback}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>Content: {autoGradingResults.criteria.content}%</div>
                  <div>Structure: {autoGradingResults.criteria.structure}%</div>
                  <div>Grammar: {autoGradingResults.criteria.grammar}%</div>
                  <div>Originality: {autoGradingResults.criteria.originality}%</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade}>
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plagiarism Check Modal */}
      <Dialog open={isPlagiarismModalOpen} onOpenChange={setIsPlagiarismModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plagiarism Check Results</DialogTitle>
            <DialogDescription>
              Assignment: {selectedSubmission?.assignmentTitle} • Student: {selectedSubmission?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {plagiarismResults && (
              <>
                <div className={`p-4 rounded-lg ${
                  plagiarismResults.status === 'Low Risk' ? 'bg-green-50' :
                  plagiarismResults.status === 'Medium Risk' ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Similarity Score: {plagiarismResults.score}%</h4>
                    <Badge variant={
                      plagiarismResults.status === 'Low Risk' ? 'default' :
                      plagiarismResults.status === 'Medium Risk' ? 'secondary' : 'destructive'
                    }>
                      {plagiarismResults.status}
                    </Badge>
                  </div>
                </div>
                
                {plagiarismResults.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Similar Sources Found:</h4>
                    <div className="space-y-2">
                      {plagiarismResults.sources.map((source: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Source {index + 1}</span>
                            <span className="text-sm text-muted-foreground">{source.similarity}% similar</span>
                          </div>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {source.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlagiarismModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Review: {selectedSubmission?.assignmentTitle}</DialogTitle>
            <DialogDescription>
              Student: {selectedSubmission?.studentName} • Course: {selectedSubmission?.courseCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Assignment Content:</h4>
              <p className="text-sm whitespace-pre-wrap">{selectedSubmission?.content}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Review Criteria</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Content Quality</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Structure & Organization</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grammar & Style</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Originality</span>
                    <span className="text-sm font-medium">88%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Detailed Feedback</h4>
                <Textarea
                  placeholder="Add detailed feedback for the student..."
                  rows={6}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Review Saved",
                description: "Detailed review has been saved",
              });
              setIsReviewModalOpen(false);
            }}>
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Analytics Dashboard</DialogTitle>
            <DialogDescription>
              Comprehensive insights into student submissions and grading performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {(() => {
              const analytics = generateAnalyticsData();
              return (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Graded</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.gradedSubmissions}</div>
                        <p className="text-xs text-muted-foreground">{Math.round((analytics.gradedSubmissions / analytics.totalSubmissions) * 100)}% complete</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.averageGrade}%</div>
                        <p className="text-xs text-muted-foreground">Overall performance</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.pendingSubmissions}</div>
                        <p className="text-xs text-muted-foreground">Awaiting grading</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Grade Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Grade Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.gradeDistribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.range}</span>
                            <div className="flex items-center space-x-2 flex-1 mx-4">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12 text-right">
                                {item.count} ({item.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnalyticsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grading Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grading Settings</DialogTitle>
            <DialogDescription>
              Configure AI grading, plagiarism detection, and custom rubrics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8">
            {/* AI Grading Settings */}
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Grading Configuration
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="ai-enabled" className="text-base font-medium">Enable AI Grading</Label>
                      <p className="text-sm text-muted-foreground">Allow AI to automatically grade submissions</p>
                    </div>
                    <input
                      id="ai-enabled"
                      type="checkbox"
                      checked={gradingSettings.aiGradingEnabled}
                      onChange={(e) => setGradingSettings({
                        ...gradingSettings,
                        aiGradingEnabled: e.target.checked
                      })}
                      className="h-5 w-5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-threshold" className="text-base font-medium">Auto-Grade Threshold</Label>
                  <Input
                    id="auto-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={gradingSettings.autoGradeThreshold}
                    onChange={(e) => setGradingSettings({
                      ...gradingSettings,
                      autoGradeThreshold: parseInt(e.target.value) || 80
                    })}
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Submissions above this score will be auto-graded
                  </p>
                </div>
              </div>
            </div>

            {/* Plagiarism Settings */}
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Plagiarism Detection
                </h4>
              </div>
              <div className="max-w-md">
                <Label htmlFor="plagiarism-threshold" className="text-base font-medium">Similarity Threshold</Label>
                <Input
                  id="plagiarism-threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={gradingSettings.plagiarismThreshold}
                  onChange={(e) => setGradingSettings({
                    ...gradingSettings,
                    plagiarismThreshold: parseInt(e.target.value) || 15
                  })}
                  className="text-lg mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Submissions above this similarity percentage will be flagged for review
                </p>
              </div>
            </div>

            {/* Custom Rubrics */}
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Custom Rubrics
                  </h4>
                  <Button onClick={handleCreateRubric} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Rubric
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage custom grading rubrics for different assignment types
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {gradingSettings.customRubrics.map((rubric) => (
                  <Card key={rubric.id} className={`transition-all duration-200 ${
                    gradingSettings.selectedRubricId === rubric.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{rubric.name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{rubric.criteria.length} criteria</span>
                            <span>•</span>
                            <span className={`font-medium ${
                              rubric.criteria.reduce((sum, c) => sum + c.weight, 0) === 100 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {rubric.criteria.reduce((sum, c) => sum + c.weight, 0)}% total
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={gradingSettings.selectedRubricId === rubric.id ? "default" : "outline"}
                            onClick={() => setGradingSettings({
                              ...gradingSettings,
                              selectedRubricId: rubric.id
                            })}
                            className="text-xs"
                          >
                            {gradingSettings.selectedRubricId === rubric.id ? 'Active' : 'Select'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRubric(rubric)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!rubric.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRubric(rubric.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {rubric.criteria.map((criterion, index) => (
                          <div key={index} className="flex items-center justify-between py-1">
                            <span className="text-sm font-medium">{criterion.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {criterion.weight}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rubric Creation/Edit Modal */}
      <Dialog open={isRubricModalOpen} onOpenChange={setIsRubricModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRubric ? 'Edit Rubric' : 'Create New Rubric'}
            </DialogTitle>
            <DialogDescription>
              {editingRubric ? 'Modify your custom rubric' : 'Create a new grading rubric with custom criteria'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Rubric Name */}
            <div>
              <Label htmlFor="rubric-name">Rubric Name</Label>
              <Input
                id="rubric-name"
                value={newRubric.name}
                onChange={(e) => setNewRubric({ ...newRubric, name: e.target.value })}
                placeholder="e.g., Essay Writing Rubric"
              />
            </div>

            {/* Criteria List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Criteria</h4>
                <Button size="sm" onClick={handleAddCriterion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Criterion
                </Button>
              </div>

              {newRubric.criteria.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No criteria added yet. Click "Add Criterion" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newRubric.criteria.map((criterion, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Criterion {index + 1}</h5>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveCriterion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`criterion-name-${index}`}>Name</Label>
                          <Input
                            id={`criterion-name-${index}`}
                            value={criterion.name}
                            onChange={(e) => handleUpdateCriterion(index, 'name', e.target.value)}
                            placeholder="e.g., Thesis Statement"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`criterion-weight-${index}`}>Weight (%)</Label>
                          <Input
                            id={`criterion-weight-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={criterion.weight}
                            onChange={(e) => handleUpdateCriterion(index, 'weight', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`criterion-description-${index}`}>Description</Label>
                        <Textarea
                          id={`criterion-description-${index}`}
                          value={criterion.description}
                          onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                          placeholder="Describe what this criterion evaluates..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weight Summary */}
              {newRubric.criteria.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Weight:</span>
                    <span className={`font-bold ${
                      newRubric.criteria.reduce((sum, c) => sum + c.weight, 0) === 100 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {newRubric.criteria.reduce((sum, c) => sum + c.weight, 0)}%
                    </span>
                  </div>
                  {newRubric.criteria.reduce((sum, c) => sum + c.weight, 0) !== 100 && (
                    <p className="text-sm text-red-600 mt-1">
                      Total weight must equal 100%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRubricModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRubric}>
              {editingRubric ? 'Update Rubric' : 'Create Rubric'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Chat Modal */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="w-96 flex flex-col [&>button]:hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Instructor Chat</h3>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === (user ? `${user.firstName} ${user.lastName}` : 'Instructor') 
                    ? 'items-end' 
                    : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === (user ? `${user.firstName} ${user.lastName}` : 'Instructor')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{msg.sender}</div>
                  <div className="text-sm">{msg.message}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!chatMessage.trim()}
              data-testid="button-send-message"
            >
              Send
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}