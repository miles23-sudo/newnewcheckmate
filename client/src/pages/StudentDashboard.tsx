import { useState, useEffect } from "react";
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

  // Query to fetch student's enrolled courses
  const { data: enrolledCourses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses/student', user?.id],
    queryFn: () => fetch(`/api/courses/student/${user?.id}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!user?.id,
  });
  
  // Initialize tab from URL hash, localStorage, or default to 'overview'
  const getInitialTab = (): 'overview' | 'courses' | 'grades' | 'settings' => {
    // Check URL hash first
    const hash = window.location.hash.replace('#', '');
    if (['overview', 'courses', 'grades', 'settings'].includes(hash)) {
      return hash as 'overview' | 'courses' | 'grades' | 'settings';
    }
    
    // Fall back to localStorage
    const savedTab = localStorage.getItem('student-dashboard-tab');
    if (savedTab && ['overview', 'courses', 'grades', 'settings'].includes(savedTab)) {
      return savedTab as 'overview' | 'courses' | 'grades' | 'settings';
    }
    
    // Default to overview
    return 'overview';
  };

  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'grades' | 'settings'>(getInitialTab());

  // Set initial URL hash if not present
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (!currentHash || !['overview', 'courses', 'grades', 'settings'].includes(currentHash)) {
      window.history.replaceState(null, '', `#${selectedTab}`);
    }
  }, []); // Run only on mount
  
  // Custom function to handle tab changes with URL and localStorage persistence
  const handleTabChange = (tab: 'overview' | 'courses' | 'grades' | 'settings') => {
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
      if (['overview', 'courses', 'grades', 'settings'].includes(hash)) {
        setSelectedTab(hash as 'overview' | 'courses' | 'grades' | 'settings');
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
  });

  // Settings state management
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    major: 'Computer Science',
    bio: 'Passionate computer science student with interests in web development and machine learning.'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailAssignments: true,
    emailGrades: true,
    emailAnnouncements: true,
    pushAssignments: true,
    pushGrades: false,
    pushAnnouncements: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showGrades: false,
    allowMessages: true
  });
  
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);

  // Mock notifications data with state management
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "info",
      title: "New Assignment Posted",
      message: "Assignment 3: Data Structures is now available",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: "2",
      type: "warning",
      title: "Assignment Due Soon",
      message: "Assignment 2: Algorithms is due in 2 days",
      timestamp: "1 day ago",
      isRead: false,
      priority: "high"
    },
    {
      id: "3",
      type: "success",
      title: "Grade Posted",
      message: "Your grade for Assignment 1 has been posted",
      timestamp: "3 days ago",
      isRead: true,
      priority: "low"
    },
    {
      id: "4",
      type: "info",
      title: "Course Announcement",
      message: "Midterm exam schedule has been updated",
      timestamp: "4 hours ago",
      isRead: false,
      priority: "medium"
    }
  ]);

  const handleLogout = () => {
    // Use the logout function from context
    logout();
    
    // Navigate back to login page
    setLocation('/login');
  };

  const handleCourseClick = (courseId: string) => {
    setLocation(`/class/${courseId}`);
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
            <div className="text-2xl font-bold">2</div>
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
                {enrolledCourses.map((course: any) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{course.code}</span>
                      <span className="text-sm text-muted-foreground">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `0%` }}
                      ></div>
                    </div>
                  </div>
                ))}
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
                  <span>Total Study Hours</span>
                  <span className="font-medium">127 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Assignments Completed</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span>Quizzes Taken</span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Streak</span>
                  <span className="font-medium">12 days</span>
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assignment 3: Data Structures</CardTitle>
                <CardDescription>CS101 - Due in 3 days</CardDescription>
              </div>
              <Badge variant="outline">Not Started</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Implement a binary search tree with insertion, deletion, and search operations.
            </p>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assignment 2: Algorithms</CardTitle>
                <CardDescription>CS201 - Due in 1 week</CardDescription>
              </div>
              <Badge variant="destructive">Overdue</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze the time complexity of various sorting algorithms.
            </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGrades = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Grades</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Transcript
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>CS101 - Introduction to Computer Science</CardTitle>
            <CardDescription>Dr. Maria Martinez</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">88%</div>
              <p className="text-sm text-muted-foreground">Current Grade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CS201 - Data Structures and Algorithms</CardTitle>
            <CardDescription>Dr. John Smith</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">92%</div>
              <p className="text-sm text-muted-foreground">Current Grade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CS301 - Web Development</CardTitle>
            <CardDescription>Dr. Sarah Johnson</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">85%</div>
              <p className="text-sm text-muted-foreground">Current Grade</p>
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
                  onChange={(e) => setProfileSettings({...profileSettings, major: e.target.value})}
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
                    <Label htmlFor="emailAssignments">Assignment Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about upcoming assignment deadlines</p>
                  </div>
                  <Switch
                    id="emailAssignments"
                    checked={true}
                    onCheckedChange={(checked) => {/* Handle change */}}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailGrades">Grade Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when grades are posted</p>
                  </div>
                  <Switch
                    id="emailGrades"
                    checked={true}
                    onCheckedChange={(checked) => {/* Handle change */}}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailAnnouncements">Course Announcements</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about course announcements</p>
                  </div>
                  <Switch
                    id="emailAnnouncements"
                    checked={true}
                    onCheckedChange={(checked) => {/* Handle change */}}
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
                    checked={true}
                    onCheckedChange={(checked) => {/* Handle change */}}
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
                    checked={false}
                    onCheckedChange={(checked) => {/* Handle change */}}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to classmates</p>
              </div>
              <Switch
                id="profileVisible"
                checked={true}
                onCheckedChange={(checked) => {/* Handle change */}}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showEmail">Show Email Address</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display your email on your profile</p>
              </div>
              <Switch
                id="showEmail"
                checked={false}
                onCheckedChange={(checked) => {/* Handle change */}}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowMessages">Allow Messages</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow classmates to message you</p>
              </div>
              <Switch
                id="allowMessages"
                checked={true}
                onCheckedChange={(checked) => {/* Handle change */}}
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
