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

  // bind token setter
  useEffect(() => {
    bindTokenSetter(setAccessToken);
  }, []);

  // sync token
  useEffect(() => {
    setToken(accessToken);
  }, [accessToken]);

  // ✅ FIXED — silent refresh but skip for student pages
  useEffect(() => {

    const path = window.location.pathname;

    // skip teacher auth for student pages
    if (path.startsWith("/student")) {
      setIsLoading(false);
      return;
    }

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

  // fetch teacher
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
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } finally {
      setAccessToken(null);
      setTeacher(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        teacher,
        isLoading,
        login,
        logout,
        setAccessToken,
      }}
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
