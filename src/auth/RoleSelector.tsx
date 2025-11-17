// src/auth/RoleSelector.tsx
import React from 'react';
import { UserRole } from './types';

export const RoleSelector: React.FC<{ value: UserRole; onChange: (r: UserRole) => void }> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <label>
        <input type="radio" name="role" value="student" checked={value === 'student'} onChange={() => onChange('student')} />
        Student
      </label>
      <label>
        <input type="radio" name="role" value="teacher" checked={value === 'teacher'} onChange={() => onChange('teacher')} />
        Teacher
      </label>
    </div>
  );
};
