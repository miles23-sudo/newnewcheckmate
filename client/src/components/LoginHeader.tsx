import { GraduationCap } from "lucide-react";

export default function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary rounded-lg">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-app-title">
              CHECKmate
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-app-subtitle">
              Learning Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}