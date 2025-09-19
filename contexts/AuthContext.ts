
import { createContext, useContext } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUserRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUserRole: () => {},
});

export const useAuth = () => useContext(AuthContext);
