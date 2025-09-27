import { useState } from 'react';
import LoginForm from '../LoginForm';
import { UserRole } from '../RoleSelector';

export default function LoginFormExample() {
  const [selectedRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex justify-center p-6">
      <LoginForm 
        selectedRole={selectedRole}
        isLoading={isLoading}
        onLogin={(data) => {
          setIsLoading(true);
          console.log('Login data:', data);
          setTimeout(() => setIsLoading(false), 2000);
        }}
        onSwitchToRegister={() => console.log('Switch to register')}
      />
    </div>
  );
}