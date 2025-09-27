import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info, BookOpen, FileText, Clock, Plus, User, ChevronLeft, ChevronRight, ChevronDown, Home, BarChart3, Settings, LogOut, Calendar, Award, Upload, X, Download, Eye, CheckCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Mock course data matching CHECKmate style
const mockCourse = {
  id: "bsit",
  code: "BSIT",
  title: "Bachelor of Science in Information Technology",
  year: "Y2",
  instructor: "Luzviminda De Gula"
};

// Mock assignments and materials
const mockAssignments = [
  {
    id: "1",
    title: "Assignment 1: Research Paper on Rizal's Life",
    description: "Write a comprehensive research paper about Jose Rizal's life and contributions to Philippine history.",
    dueDate: "Nov 25, 2023",
    points: 100,
    status: "assigned",
    type: "assignment",
    attachments: [
      {
        id: "1",
        title: "Assignment Guidelines.pdf",
        type: "PDF Document",
        thumbnail: "📄"
      }
    ]
  },
  {
    id: "2", 
    title: "Quiz 1: Higher Education and Life Abroad",
    description: "Online quiz covering Rizal's higher education and life abroad based on the lecture materials.",
    dueDate: "Nov 22, 2023",
    points: 50,
    status: "assigned",
    type: "quiz"
  },
  {
    id: "3",
    title: "Group Project: Rizal's Literary Works",
    description: "Create a presentation analyzing Rizal's major literary works and their impact on Philippine society.",
    dueDate: "Dec 1, 2023",
    points: 150,
    status: "assigned",
    type: "project",
    attachments: [
      {
        id: "2",
        title: "Project Rubric.docx",
        type: "Word Document",
        thumbnail: "📝"
      }
    ]
  }
];

const mockMaterials = [
  {
    id: "1",
    title: "Database Design Principles",
    type: "document",
    uploadedDate: "Nov 15, 2024"
  },
  {
    id: "2",
    title: "SQL Tutorial Video",
    type: "video",
    uploadedDate: "Nov 14, 2024"
  },
  {
    id: "3",
    title: "Sample Database Schema",
    type: "file",
    uploadedDate: "Nov 13, 2024"
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

export default function ClassroomClasswork() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'stream' | 'classwork' | 'people'>('classwork');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'overview' | 'courses' | 'assignments' | 'grades' | 'settings'>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionComment, setSubmissionComment] = useState('');
  const [submittedAssignments, setSubmittedAssignments] = useState<Set<string>>(new Set());

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

  const handleViewAssignmentDetails = (assignment: any) => {
    setSelectedAssignment(assignment);
  };

  const handleSubmitAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsSubmissionModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSubmissionFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmissionSubmit = () => {
    if (selectedAssignment) {
      // Add to submitted assignments
      setSubmittedAssignments(prev => new Set([...prev, selectedAssignment.id]));
      
      // Reset form
      setSubmissionFiles([]);
      setSubmissionComment('');
      setIsSubmissionModalOpen(false);
      setSelectedAssignment(null);
      
      // Show success message
      alert(`Assignment "${selectedAssignment.title}" submitted successfully!\n\nFiles uploaded: ${submissionFiles.length}\nComment: ${submissionComment ? 'Yes' : 'No'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <FileText className="h-4 w-4" />;
      case 'quiz': return <BookOpen className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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
              variant={sidebarTab === 'assignments' ? "default" : "ghost"}
              className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setSidebarTab('assignments')}
              title={isSidebarCollapsed ? "Assignments" : ""}
            >
              <FileText className={`h-4 w-4 ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
              {!isSidebarCollapsed && "Assignments"}
            </Button>
            
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
                  className={`py-4 text-sm font-medium border-b-2 ${
                    selectedTab === 'classwork'
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  Classwork
                </button>
                <button
                  onClick={() => setLocation('/class/bsit/people')}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    'text-muted-foreground border-transparent hover:text-foreground'
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
            {/* Classwork Content */}
            <div className="space-y-6">
              {/* Assignments Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Assignments</h2>
                  <div className="text-sm text-muted-foreground">
                    {mockAssignments.length} assignments
                  </div>
                </div>
                <div className="space-y-4">
                  {mockAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover-elevate transition-all">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Assignment Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </div>

                          {/* Assignment Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Due: {assignment.dueDate}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Award className="h-4 w-4 text-muted-foreground" />
                              <span>{assignment.points} points</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{assignment.type}</span>
                            </div>
                          </div>

                          {/* Attachments */}
                          {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Attachments:</h4>
                              <div className="space-y-2">
                                {assignment.attachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent">
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                      <span className="text-lg">{attachment.thumbnail}</span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{attachment.title}</p>
                                      <p className="text-xs text-muted-foreground">{attachment.type}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" onClick={() => handleViewAssignmentDetails(assignment)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
                                  <DialogDescription>
                                    Due: {assignment.dueDate} • {assignment.points} points • {assignment.type}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Assignment Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">Due Date</p>
                                        <p className="text-sm text-muted-foreground">{assignment.dueDate}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Award className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">Points</p>
                                        <p className="text-sm text-muted-foreground">{assignment.points}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className={getStatusColor(assignment.status)}>
                                        {assignment.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                    <p className="text-muted-foreground leading-relaxed">{assignment.description}</p>
                                  </div>

                                  {/* Attachments */}
                                  {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div>
                                      <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                                      <div className="space-y-2">
                                        {assignment.attachments.map((attachment: any) => (
                                          <div key={attachment.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer">
                                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                              <span className="text-lg">{attachment.thumbnail}</span>
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{attachment.title}</p>
                                              <p className="text-xs text-muted-foreground">{attachment.type}</p>
                                            </div>
                                            <Button size="sm" variant="outline">
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Instructions */}
                                  <div>
                                    <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                                    <div className="space-y-2 text-sm">
                                      <p>• Read all attached materials carefully</p>
                                      <p>• Follow the formatting guidelines provided</p>
                                      <p>• Submit your work before the due date</p>
                                      <p>• Include proper citations and references</p>
                                      <p>• Contact the instructor if you have questions</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSubmitAssignment(assignment)}
                              disabled={submittedAssignments.has(assignment.id)}
                            >
                              {submittedAssignments.has(assignment.id) ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Submitted
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Submit Work
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Materials</h2>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add materials
                  </Button>
                </div>
                <div className="space-y-3">
                  {mockMaterials.map((material) => (
                    <Card key={material.id} className="hover-elevate transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{material.title}</h3>
                            <p className="text-sm text-muted-foreground">Added {material.uploadedDate}</p>
                          </div>
                          <Badge variant="outline">{material.type}</Badge>
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
                <h3 className="font-semibold text-lg mb-4">Upcoming</h3>
                <div className="space-y-3">
                  {mockAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="p-2 hover:bg-accent rounded">
                      <p className="text-sm font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">Due {assignment.dueDate}</p>
                    </div>
                  ))}
                  <Button variant="link" className="text-primary p-0 h-auto text-sm">
                    View all
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          </div>
        </main>
      </div>

      {/* Submission Modal */}
      <Dialog open={isSubmissionModalOpen} onOpenChange={setIsSubmissionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title} • Due: {selectedAssignment?.dueDate}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload" className="text-base font-medium">Upload Files</Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each)
                </p>
              </div>
              
              {/* File List */}
              {submissionFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  {submissionFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <Label htmlFor="submission-comment" className="text-base font-medium">
                Comments (Optional)
              </Label>
              <Textarea
                id="submission-comment"
                placeholder="Add any comments or notes about your submission..."
                value={submissionComment}
                onChange={(e) => setSubmissionComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            {/* Submission Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Submission Deadline</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Due: {selectedAssignment?.dueDate} at 11:59 PM
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Late submissions will be accepted with a 10% penalty per day.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSubmissionModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmissionSubmit}
                disabled={submissionFiles.length === 0}
              >
                Submit Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}