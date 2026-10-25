
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "./api";

const AuthContext = createContext(null);
const TOKEN_KEY = "rentsure_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await api.post("/auth/login", {
      email,
      password,
    });

    if (!result.token || !result.user) {
      throw new Error("The server did not return a valid login response.");
    }

    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);

    return result.user;
  }, []);

  const register = useCallback(
    async ({ fullName, email, password, role = "tenant" }) => {
      const result = await api.post("/auth/register", {
        fullName,
        email,
        password,
        role,
      });

      if (!result.token || !result.user) {
        throw new Error(
          "The server did not return a valid registration response."
        );
      }

      localStorage.setItem(TOKEN_KEY, result.token);
      setUser(result.user);

      return result.user;
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const result = await api.get("/auth/me");

      if (!result.user) {
        throw new Error("Profile information was not returned.");
      }

      setUser(result.user);
      return result.user;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
          if (active) setUser(null);
          return;
        }

        const result = await api.get("/auth/me");

        if (active) {
          setUser(result.user || null);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
