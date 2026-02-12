import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type Definitions
interface TAUser {
  id: number;
  first_name: string;
  last_name: string;
  // Add any other properties your TA user object has
}

interface AuthContextType {
  taUser: TAUser | null;
  loading: boolean;
  login: (user: TAUser) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [taUser, setTAUser] = useState<TAUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem('current_ta_user');
    if (stored) {
      setTAUser(JSON.parse(stored) as TAUser);
    }
    setLoading(false);
  }, []);

  const login = (user: TAUser): void => {
    localStorage.setItem('current_ta_user', JSON.stringify(user));
    setTAUser(user);
  };

  const logout = (): void => {
    localStorage.removeItem('current_ta_user');
    setTAUser(null);
  };

  return (
    <AuthContext.Provider value={{ taUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};