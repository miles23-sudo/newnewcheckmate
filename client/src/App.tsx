import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import Login from "@/pages/Login";
import InstructorDashboard from "@/pages/InstructorDashboard";
import InstructorContentManagement from "@/pages/InstructorContentManagement";
import AdminDashboard from "@/pages/AdminDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentCourses from "@/pages/StudentCourses";
import CourseStream from "@/pages/CourseStream";
import ClassroomStream from "@/pages/ClassroomStream";
import ClassroomClasswork from "@/pages/ClassroomClasswork";
import ClassroomChat from "@/pages/ClassroomChat";
import ClassroomPeople from "@/pages/ClassroomPeople";
import ClassroomGrades from "@/pages/ClassroomGrades";
import ClassroomMyCourses from "@/pages/ClassroomMyCourses";
import ClassroomSettings from "@/pages/ClassroomSettings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/instructor-dashboard" component={InstructorDashboard} />
      <Route path="/instructor-content" component={InstructorContentManagement} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/student-dashboard" component={StudentDashboard} />
      <Route path="/student-courses" component={StudentCourses} />
      
      {/* Course Stream routes */}
      <Route path="/course/:courseId" component={CourseStream} />
      
      {/* Google Classroom-style routes */}
      <Route path="/class/:courseId" component={ClassroomStream} />
      <Route path="/class/:courseId/classwork" component={ClassroomClasswork} />
      <Route path="/class/:courseId/chat" component={ClassroomChat} />
      <Route path="/class/:courseId/people" component={ClassroomPeople} />
      <Route path="/class/:courseId/grades" component={ClassroomGrades} />
      <Route path="/class/:courseId/courses" component={ClassroomMyCourses} />
      <Route path="/class/:courseId/settings" component={ClassroomSettings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
