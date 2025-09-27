import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { UserRole } from "./RoleSelector";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  studentId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  selectedRole: UserRole | null;
  onRegister: (data: RegisterFormData & { role: UserRole }) => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export default function RegisterForm({ 
  selectedRole, 
  onRegister, 
  onSwitchToLogin, 
  isLoading = false 
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      studentId: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    if (!selectedRole) {
      setError("Please select a role first");
      return;
    }
    
    setError(null);
    console.log('Registration attempt:', { ...data, role: selectedRole });
    onRegister({ ...data, role: selectedRole });
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case 'student':
        return 'Student Registration';
      case 'instructor':
        return 'Instructor Registration';
      case 'administrator':
        return 'Administrator Registration';
      default:
        return 'Registration';
    }
  };

  const isStudent = selectedRole === 'student';

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle data-testid="text-register-title">{getRoleTitle()}</CardTitle>
        {selectedRole && (
          <p className="text-sm text-muted-foreground" data-testid="text-role-context">
            Creating {selectedRole} account
          </p>
        )}
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="alert-register-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="First name"
                data-testid="input-first-name"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive" data-testid="error-first-name">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                data-testid="input-last-name"
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive" data-testid="error-last-name">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              data-testid="input-email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive" data-testid="error-email">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {isStudent && (
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID (Optional)</Label>
              <Input
                id="studentId"
                placeholder="Enter your student ID"
                data-testid="input-student-id"
                {...form.register("studentId")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="grid grid-cols-[1fr_auto] items-center border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                data-testid="input-password"
                className="col-start-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-start-2 ml-2 mr-2"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive" data-testid="error-password">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="grid grid-cols-[1fr_auto] items-center border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                data-testid="input-confirm-password"
                className="col-start-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-start-2 ml-2 mr-2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive" data-testid="error-confirm-password">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !selectedRole}
            data-testid="button-register"
          >
            {isLoading ? (
              "Creating Account..."
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button 
                type="button" 
                variant="ghost" 
                className="p-0 h-auto text-primary" 
                onClick={onSwitchToLogin}
                data-testid="link-login"
              >
                Sign in here
              </Button>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}