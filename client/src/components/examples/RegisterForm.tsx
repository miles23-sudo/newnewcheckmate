import { useState } from 'react';
import RegisterForm from '../RegisterForm';
import { UserRole } from '../RoleSelector';

export default function RegisterFormExample() {
  const [selectedRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex justify-center p-6">
      <RegisterForm 
        selectedRole={selectedRole}
        isLoading={isLoading}
        onRegister={(data) => {
          setIsLoading(true);
          console.log('Registration data:', data);
          setTimeout(() => setIsLoading(false), 2000);
        }}
        onSwitchToLogin={() => console.log('Switch to login')}
      />
    </div>
  );
}