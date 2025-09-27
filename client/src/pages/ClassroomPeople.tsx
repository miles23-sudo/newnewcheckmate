import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Info, Users, Mail, Shield, UserPlus, User, ChevronLeft, ChevronRight, ChevronDown, Home, BookOpen, FileText, BarChart3, Settings, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Mock course data matching CHECKmate style
const mockCourse = {
  id: "bsit",
  code: "BSIT",
  title: "Bachelor of Science in Information Technology",
  year: "Y2",
  instructor: "Luzviminda De Gula"
};

// Mock course instructor
const mockInstructors = [
  {
    id: "1",
    name: "Luzviminda De Gula",
    email: "luzviminda.degula@university.edu",
    role: "Instructor",
    avatar: "LD"
  }
];

// Mock enrolled students
const mockStudents = [
  {
    id: "2",
    name: "John Smith",
    email: "john.smith@student.edu",
    role: "Student",
    avatar: "JS"
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.johnson@student.edu",
    role: "Student",
    avatar: "SJ"
  },
  {
    id: "4",
    name: "Mike Davis",
    email: "mike.davis@student.edu",
    role: "Student",
    avatar: "MD"
  },
  {
    id: "5",
    name: "Emily Wilson",
    email: "emily.wilson@student.edu",
    role: "Student",
    avatar: "EW"
  },
  {
    id: "6",
    name: "Alex Chen",
    email: "alex.chen@student.edu",
    role: "Student",
    avatar: "AC"
  }
];

// Mock enrolled courses data
const mockEnrolledCourses = [
  {
    id: "bsit-y2",
    code: "BSIT",
    title: "Y2",
    instructor: "Luzviminda De Gula",
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
  }
];

// Mock user data
const mockUser = {
  firstName: "Sarah",
  lastName: "Johnson",
  role: "student"
};

export default function ClassroomPeople() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'stream' | 'classwork' | 'people'>('people');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'courses' | 'grades' | 'settings'>('overview');

  const handleBackToDashboard = () => {
    setLocation('/student-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const handleCourseClick = (courseId: string) => {
    setLocation(`/class/${courseId}`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Instructor': return 'bg-purple-100 text-purple-800';
      case 'Student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'Instructor': return 'bg-purple-600';
      case 'Student': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="bg-card border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">CHECKmate</span>
          </div>
          <div className="ml-auto flex items-center space-x-2">
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
                    <span className="text-sm font-medium">{mockUser.firstName} {mockUser.lastName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{mockUser.role}</span>
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
              variant={sidebarTab === 'overview' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => {
                setSidebarTab('overview');
                setLocation('/student-dashboard');
              }}
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </Button>
            
            {/* My Courses Section */}
            <div className="space-y-2">
              <Button
                variant={sidebarTab === 'courses' ? "default" : "ghost"}
                onClick={() => {
                  setSidebarTab('courses');
                  setIsCoursesExpanded(!isCoursesExpanded);
                }}
                className={`w-full justify-start h-auto p-2 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
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
                  {mockEnrolledCourses.map((course, index) => (
                    <Button
                      key={course.id}
                      variant="ghost"
                      onClick={() => handleCourseClick(course.id)}
                      className={`w-full justify-start h-auto p-2 ${
                        course.isActive ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                        index === 0 ? 'bg-primary' : 
                        index === 1 ? 'bg-gray-500' : 
                        index === 2 ? 'bg-green-600' : 
                        'bg-primary'
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
                  ))}
                </div>
              )}
            </div>
            
            
            <Button
              variant={sidebarTab === 'grades' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSidebarTab('grades')}
              title={isSidebarCollapsed ? "Grades" : ""}
            >
              <BarChart3 className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Grades"}
            </Button>
            
            <Button
              variant={sidebarTab === 'settings' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSidebarTab('settings')}
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
              title={isSidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Logout"}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Course Banner */}
          <div className="bg-primary text-primary-foreground">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{mockCourse.code}</h1>
                  <h2 className="text-2xl font-medium mt-1">{mockCourse.year}</h2>
                </div>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card border-b">
            <div className="px-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setLocation('/class/bsit')}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  Stream
                </button>
                <button
                  onClick={() => setLocation('/class/bsit/classwork')}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  Classwork
                </button>
                <button
                  className={`py-4 text-sm font-medium border-b-2 ${
                    selectedTab === 'people'
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  People
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Class Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Class Roster
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span>1 Instructor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>4 Students</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Instructor */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Course Instructor</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${getAvatarColor(mockInstructors[0].role)} text-white`}>
                          {mockInstructors[0].avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{mockInstructors[0].name}</h3>
                        <p className="text-sm text-muted-foreground">{mockInstructors[0].email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enrolled Students */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Students ({mockStudents.length})</h2>
                <div className="space-y-2">
                  {mockStudents.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${getAvatarColor(student.role)} text-white`}>
                              {student.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Sidebar */}
          <div className="w-80">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">Class Info</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Class Code</p>
                    <p className="text-muted-foreground">BSIT-2024-Y2</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Instructor</p>
                    <p className="text-muted-foreground">Luzviminda De Gula</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Students</p>
                    <p className="text-muted-foreground">4 enrolled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}