import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@/types/metric';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Update authentication status based on query results
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (isError) {
      setIsAuthenticated(false);
    }
  }, [user, isError]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout', {});
      return true;
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.clear();
    },
  });

  const login = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to get auth URL', error);
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
