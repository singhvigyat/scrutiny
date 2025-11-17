// src/auth/types.ts
export type UserRole = 'student' | 'teacher';

export interface SignUpPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  mis_id?: string | null;
  employee_id?: string | null;
}
