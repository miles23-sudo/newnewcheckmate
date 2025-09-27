import { UserCheck, BookOpen, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type UserRole = 'student' | 'instructor' | 'administrator';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
}

export default function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
  const roles = [
    {
      id: 'student' as UserRole,
      title: 'Student',
      description: 'Access courses, submit assignments, and track progress',
      icon: UserCheck,
    },
    {
      id: 'instructor' as UserRole,
      title: 'Instructor',
      description: 'Create courses, manage assignments, and grade students',
      icon: BookOpen,
    },
    {
      id: 'administrator' as UserRole,
      title: 'Administrator',
      description: 'Manage users, courses, and system settings',
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center text-foreground" data-testid="text-role-selection-title">
        Select Your Role
      </h3>
      <div className="grid gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover-elevate ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => onRoleSelect(role.id)}
              data-testid={`card-role-${role.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground" data-testid={`text-role-title-${role.id}`}>
                      {role.title}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`text-role-description-${role.id}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}