import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Bypass temporário para desenvolvimento: sempre permite o acesso
  return <>{children}</>;
}