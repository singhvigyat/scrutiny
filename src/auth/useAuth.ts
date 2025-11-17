// src/auth/useAuth.ts
import { useAuthContext } from './AuthProvider';

export function useAuth() {
  return useAuthContext();
}
