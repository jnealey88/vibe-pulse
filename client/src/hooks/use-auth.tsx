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
  handleCallback: (code: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    onSuccess: (data) => {
      setIsAuthenticated(true);
    },
    onError: () => {
      setIsAuthenticated(false);
    },
    retry: false,
  });

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

  const callbackMutation = useMutation({
    mutationFn: async (code: string) => {
      try {
        // First try the GET endpoint which is what Google uses for redirects
        let response = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}`);
        
        // If that fails, try the POST endpoint as fallback
        if (!response.ok) {
          response = await apiRequest('POST', '/api/auth/callback', { code });
        }
        
        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error("Auth callback error:", error);
        throw error;
      }
    },
    onSuccess: (user) => {
      setIsAuthenticated(true);
      queryClient.invalidateQueries({queryKey: ['/api/auth/user']});
      return user;
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

  const handleCallback = async (code: string): Promise<User> => {
    return await callbackMutation.mutateAsync(code);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        login,
        logout,
        handleCallback,
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
