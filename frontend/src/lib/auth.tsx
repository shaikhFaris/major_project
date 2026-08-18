import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAuthToken, getMe, login as apiLogin, register as apiRegister, getToken, type User } from "./api";

export const API_BASE = "/api";

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (t) {
      getMe()
        .then((res) => {
          if (res.success) setUser(res.data);
          else setAuthToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const res = await apiLogin(email, password);
    if (res.success) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return null;
    }
    return res.error;
  };

  const register = async (email: string, password: string, name: string): Promise<string | null> => {
    const res = await apiRegister(email, password, name);
    if (res.success) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return null;
    }
    return res.error;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
