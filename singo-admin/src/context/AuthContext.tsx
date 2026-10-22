import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Role = "ADMIN" | "BRANCH_ADMIN" | "DRIVER" | "COMPANY";

type User = {
  id: number;
  email: string;
  role: Role;
  companyId?: number;
  branchId?: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (data: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }

    setIsLoading(false);
  }, []);

  const login = (data: any) => {
    const accessToken = data.accessToken || data.token;
    const nextRefreshToken = data.refreshToken || data.refresh_token;

    if (!accessToken || !data.user) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem("token", accessToken);
    if (nextRefreshToken) {
      localStorage.setItem("refreshToken", nextRefreshToken);
      setRefreshToken(nextRefreshToken);
    }
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};