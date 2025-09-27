import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  MessageSquare, 
  BookOpen,
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  X,
  User
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface ClassroomLayoutProps {
  children: React.ReactNode;
  courseId?: string;
}

// Get user data from localStorage
const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('Loaded user data from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  
  // Fallback to default student data
  console.log('Using fallback user data');
  return {
    firstName: "Sarah",
    lastName: "Johnson", 
    email: "sarah.johnson@student.ollc.edu",
    role: "student"
  };
};

// Mock courses for dropdown
const mockCourses = [
  { id: "course1", title: "Introduction to Computer Science", code: "CS101" },
  { id: "course2", title: "Advanced Mathematics", code: "MATH301" },
];

export default function ClassroomLayout({ children, courseId = "course1" }: ClassroomLayoutProps) {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const currentCourse = mockCourses.find(c => c.id === courseId) || mockCourses[0];
  const userData = getUserData();
  
  // Navigation items for sidebar - role-aware
  const getNavigationItems = () => {
    if (userData.role === 'student') {
      // Minimal navigation for students
      return [
        { 
          path: `/class/${courseId}`, 
          label: "Dashboard", 
          icon: Home, 
          isActive: location === `/class/${courseId}` || location === `/class/${courseId}/` 
        },
        { 
          path: `/class/${courseId}/courses`, 
          label: "My Courses", 
          icon: BookOpen, 
          isActive: location.includes('/courses') 
        }
      ];
    }

    // Full navigation for instructors and administrators
    const baseItems = [
      { 
        path: `/class/${courseId}`, 
        label: "Stream", 
        icon: Home, 
        isActive: location === `/class/${courseId}` || location === `/class/${courseId}/` 
      },
      { 
        path: `/class/${courseId}/classwork`, 
        label: "Classwork", 
        icon: FileText, 
        isActive: location.includes('/classwork') 
      },
      { 
        path: `/class/${courseId}/people`, 
        label: "People", 
        icon: Users, 
        isActive: location.includes('/people') 
      },
    ];

    if (userData.role === 'instructor') {
      baseItems.push(
        { 
          path: `/class/${courseId}/grades`, 
          label: "Grades", 
          icon: BarChart3, 
          isActive: location.includes('/grades') 
        }
      );
    }

    // Settings available for all roles
    baseItems.push({
      path: `/class/${courseId}/settings`, 
      label: "Settings", 
      icon: Settings, 
      isActive: location.includes('/settings') 
    });

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // Mock notifications - reduced data for header
  const [mockNotifications, setMockNotifications] = useState([
    { id: "1", title: "New Assignment Posted", message: "Data Structures Project has been posted", isRead: false, type: "info" },
    { id: "2", title: "Grade Released", message: "Your grade for Calculus Problem Set 2 is available", isRead: true, type: "success" },
    { id: "3", title: "Course Announcement", message: "Office hours moved to Thursday 2-4 PM", isRead: false, type: "warning" },
  ]);

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  // Notification handlers
  const markNotificationAsRead = (notificationId: string) => {
    setMockNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setMockNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const markAllAsRead = () => {
    setMockNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Close any open sheets when navigating to chat room
  useEffect(() => {
    if (location.includes('/chat')) {
      setIsMobileMenuOpen(false);
      setIsNotificationsOpen(false);
    }
  }, [location]);

  // Sign out handler
  const handleSignOut = () => {
    // Clear any stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Navigate back to login page
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Logo + Course Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - Hidden for students */}
            {userData.role !== 'student' && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            )}
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">CHECKmate</span>
            </div>

            {/* Course Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex items-center space-x-2" data-testid="button-course-dropdown">
                  <span className="font-medium">{currentCourse.code}</span>
                  <span className="text-gray-600 dark:text-gray-300">{currentCourse.title}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                {mockCourses.map((course) => (
                  <DropdownMenuItem
                    key={course.id}
                    onClick={() => navigate(`/class/${course.id}`)}
                    data-testid={`option-course-${course.id}`}
                  >
                    <div>
                      <div className="font-medium">{course.code}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{course.title}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Right: Theme Toggle, Notifications, Messages, Profile */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {userData.role !== 'student' && (
              <>
                {/* Notifications - only for instructors and admins */}
                <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative inline-block">
                      <Button variant="ghost" size="sm" data-testid="button-notifications">
                        <Bell className="h-5 w-5" />
                      </Button>
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                          {unreadCount}
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
                        {mockNotifications.some(n => !n.isRead) && (
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
                      {mockNotifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        mockNotifications.map((notification) => (
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

                {/* Messages - only for instructors and admins */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(`/class/${courseId}/chat`)}
                  data-testid="button-messages"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2" data-testid="button-profile-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/api/placeholder/32/32" />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {userData.firstName[0]}{userData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <div className="font-medium text-base">{userData.firstName} {userData.lastName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-all">
                    {userData.email}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <DropdownMenuItem 
                  data-testid="menu-item-logout" 
                  onClick={handleSignOut}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar - Hidden for students */}
        {userData.role !== 'student' && (
          <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r h-[calc(100vh-4rem)] flex-col sticky top-16 overflow-y-auto">
            {/* Sidebar Header */}
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.firstName} {userData.lastName}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{userData.role}</span>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={item.isActive ? "default" : "ghost"}
                      className={`w-full justify-start h-10 ${
                        item.isActive 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Mobile Sidebar - Hidden for students */}
        {userData.role !== 'student' && (
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.firstName} {userData.lastName}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{userData.role}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Mobile Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant={item.isActive ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <main className={`${userData.role === 'student' ? 'w-full' : 'flex-1'} min-h-[calc(100vh-4rem)] overflow-y-auto`}>
          {userData.role === 'student' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Welcome to CHECKmate
                </h2>
                <p className="text-gray-500 dark:text-gray-500">
                  Your course content will appear here
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

    </div>
  );
}