import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  session: any | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock de usuário para evitar quebras no sistema
const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@deliverynoazul.com',
  user_metadata: {
    display_name: 'Usuário Demo'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Forçamos o estado como autenticado
  const [user] = useState<any>(MOCK_USER);
  const [isAuthenticated] = useState<boolean>(true);
  const [isLoading] = useState<boolean>(false);

  const login = async () => ({});
  const signup = async () => ({});
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, session: {}, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}