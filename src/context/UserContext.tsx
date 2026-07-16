"use client";

import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { logout as requestLogout } from "@/lib/auth";
import {
  AuthUser,
  clearPersistedSession,
  isBusinessUser,
  normalizeRoles,
  persistSession,
  persistUser,
  readPersistedSession,
  SessionPayload,
} from "@/lib/auth-session";

type UserRole = string[];

interface UserContextType {
  user: AuthUser | null;
  token: string | null;
  userRole: UserRole | null;
  isB2B: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  establishSession: (session: SessionPayload) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  refreshRole: () => Promise<void>;
  updateUser: (update: Partial<AuthUser>) => void;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within UserProvider");
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const clearSession = useCallback(() => {
    requestIdRef.current += 1;
    clearPersistedSession(localStorage);
    setToken(null);
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchUser = useCallback(
    async (authToken: string, cachedUser: AuthUser | null = null) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get<AuthUser>("/api/user/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (requestId !== requestIdRef.current) return null;

        persistUser(localStorage, response.data);
        setUser(response.data);
        setToken(authToken);
        return response.data;
      } catch (cause) {
        if (requestId !== requestIdRef.current) return null;
        if (axios.isAxiosError(cause) && cause.response?.status === 401) {
          clearSession();
          return null;
        }

        // A temporary profile failure must not silently sign out a valid cached session.
        setUser(cachedUser);
        setToken(authToken);
        setError("Accountgegevens konden niet worden vernieuwd. Probeer het opnieuw.");
        return cachedUser;
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [clearSession],
  );

  const refreshUser = useCallback(async () => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      clearSession();
      return null;
    }
    return fetchUser(authToken, user || readPersistedSession(localStorage).user);
  }, [clearSession, fetchUser, token, user]);

  const establishSession = useCallback(
    async ({ access_token, user: sessionUser }: SessionPayload) => {
      persistSession(localStorage, { access_token, user: sessionUser });
      setToken(access_token);
      setUser(sessionUser);
      setError(null);
      setIsLoading(false);
      await fetchUser(access_token, sessionUser);
    },
    [fetchUser],
  );

  const updateUser = useCallback((update: Partial<AuthUser>) => {
    setUser((current) => {
      const next = { ...(current || {}), ...update };
      persistUser(localStorage, next);
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    const authToken = token || localStorage.getItem("token");
    clearSession();
    if (authToken) {
      try {
        await requestLogout(authToken);
      } catch {
        // The local session is intentionally cleared even if token revocation is unavailable.
      }
    }
  }, [clearSession, token]);

  useEffect(() => {
    const hydrateSession = () => {
      const { token: storedToken, user: storedUser } = readPersistedSession(localStorage);
      if (!storedToken) {
        clearSession();
        return;
      }
      setToken(storedToken);
      setUser(storedUser);
      void fetchUser(storedToken, storedUser);
    };

    hydrateSession();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "user" || event.key === null) {
        hydrateSession();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearSession, fetchUser]);

  const userRole = useMemo(() => normalizeRoles(user), [user]);
  const isB2B = useMemo(() => isBusinessUser(user, userRole), [user, userRole]);
  const value = useMemo<UserContextType>(
    () => ({
      user,
      token,
      userRole,
      isB2B,
      isAuthenticated: Boolean(token),
      isLoading,
      error,
      establishSession,
      refreshUser,
      refreshRole: async () => {
        await refreshUser();
      },
      updateUser,
      signOut,
    }),
    [
      user,
      token,
      userRole,
      isB2B,
      isLoading,
      error,
      establishSession,
      refreshUser,
      updateUser,
      signOut,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
