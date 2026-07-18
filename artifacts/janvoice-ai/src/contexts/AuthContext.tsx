import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("janvoice_token"));
  const [user, setUser] = useState<User | null>(null);

  const { data: fetchedUser, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: ["auth_me_custom"], // Just a unique key to prevent collisions
    },
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  });

  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    } else if (error) {
      // Token might be invalid
      localStorage.removeItem("janvoice_token");
      setToken(null);
      setUser(null);
    }
  }, [fetchedUser, error]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("janvoice_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("janvoice_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
