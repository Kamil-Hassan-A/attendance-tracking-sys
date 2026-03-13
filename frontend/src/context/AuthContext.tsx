import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import api, { API_URL, bindTokenSetter, setToken } from "@/services/api";

interface Teacher {
  teacher_id: number;
  full_name: string;
  email: string;
}

interface AuthContextValue {
  accessToken: string | null;
  teacher: Teacher | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bind the token setter so the Axios interceptor can update context
  useEffect(() => {
    bindTokenSetter(setAccessToken);
  }, []);

  // Keep the module-level token in sync with state
  useEffect(() => {
    setToken(accessToken);
  }, [accessToken]);

  // Silent refresh on app boot
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(res.data.access_token);
      } catch {
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    silentRefresh();
  }, []);

  // Fetch /me whenever token changes
  useEffect(() => {
    if (!accessToken) {
      setTeacher(null);
      return;
    }
    api
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => setTeacher(res.data))
      .catch(() => setTeacher(null));
  }, [accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setAccessToken(res.data.access_token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } finally {
      setAccessToken(null);
      setTeacher(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, teacher, isLoading, login, logout, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
