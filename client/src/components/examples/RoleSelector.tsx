import { useState } from 'react';
import RoleSelector, { UserRole } from '../RoleSelector';

export default function RoleSelectorExample() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  return (
    <div className="max-w-md mx-auto p-6">
      <RoleSelector 
        selectedRole={selectedRole} 
        onRoleSelect={(role) => {
          setSelectedRole(role);
          console.log('Role selected:', role);
        }} 
      />
    </div>
  );
}