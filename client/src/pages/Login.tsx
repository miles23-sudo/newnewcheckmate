import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LoginHeader from "@/components/LoginHeader";
import RoleSelector, { UserRole } from "@/components/RoleSelector";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { useUser } from "@/contexts/UserContext";

type ViewMode = 'roleSelection' | 'login' | 'register';

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('roleSelection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setViewMode('login');
    console.log('Role selected:', role);
  };

  const handleLogin = async (data: { email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    setLoginError(null);
    console.log('Login attempt:', data);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Login successful:', result.user);
        
        // Store user data in localStorage and context
        localStorage.setItem('userRole', result.user.role);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        console.log('Stored user data in localStorage and context:', result.user);
        
        // Navigate to appropriate dashboard based on role
        if (result.user.role === 'student') {
          setLocation('/student-dashboard');
        } else if (result.user.role === 'instructor') {
          setLocation('/instructor-dashboard');
        } else if (result.user.role === 'administrator') {
          setLocation('/admin-dashboard');
        }
      } else {
        console.error('Login failed:', result.error);
        const errorMessage = result.error === "Invalid email or password" 
          ? "The email or password you entered is incorrect. Please check your credentials and try again."
          : result.error;
        
        setLoginError(errorMessage);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      setLoginError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    console.log('Registration attempt:', data);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Registration successful:', result.user);
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully. Please log in with your new credentials.",
        });
        setViewMode('login');
      } else {
        console.error('Registration failed:', result.error);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'login' || viewMode === 'register') {
      setViewMode('roleSelection');
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Content */}
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-200">
          <ThemeToggle />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <LoginHeader />
        </div>
        
        {viewMode === 'roleSelection' && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <RoleSelector
              selectedRole={selectedRole}
              onRoleSelect={handleRoleSelect}
            />
          </div>
        )}
        
        {viewMode === 'login' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground p-2"
                data-testid="button-back-to-roles"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to role selection
              </Button>
            </div>
            <LoginForm
              selectedRole={selectedRole}
              onLogin={handleLogin}
              onSwitchToRegister={() => setViewMode('register')}
              isLoading={isLoading}
              error={loginError}
              onErrorChange={setLoginError}
            />
          </div>
        )}
        
        {viewMode === 'register' && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground p-2"
                data-testid="button-back-to-roles"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to role selection
              </Button>
            </div>
            <RegisterForm
              selectedRole={selectedRole}
              onRegister={handleRegister}
              onSwitchToLogin={() => setViewMode('login')}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}