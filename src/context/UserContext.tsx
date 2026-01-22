"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type UserRole = string[];

interface UserContextType {
  user: any | null;
  userRole: UserRole | null;
  isLoading: boolean;
  refreshRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  refreshRole: async () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to parse JWT
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const fetchUserRole = async () => {
    if (typeof window === "undefined") return;
    
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (token) {
        // 1. Try to get from localStorage user first (optimization)
        let role = null;
        let userData = null;

        if (userStr) {
          const user = JSON.parse(userStr);
          role = user.role || user.roles || user.user_role;
          userData = user;
        }

        // 2. If not found, decoding token might help (for role only)
        if (!role) {
          const decoded = parseJwt(token);
          if (decoded) {
            if (decoded.data?.user?.roles) role = decoded.data.user.roles;
            else if (decoded.roles) role = decoded.roles;
          }
        }

        // 3. If still no role OR for full data refresh, fetch from API
        // Fetching from API is better for "context=edit" data like addresses
        if (token) {
           // We always fetch ME to get latest addresses if possible, or lazy load?
           // Strategy: If we have userData from local, usage is fast. But we might want fresh data.
           // Let's fetch if we don't have userData OR if we want to ensure fresh role.
           // For now, let's prioritize API fetch to get billing/shipping
           try {
            const res = await axios.get(
              `/api/user/me`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (res.data) {
                userData = res.data;
                if (res.data.roles) {
                  role = res.data.roles;
                }
                // Update local storage to keep it fresh
                localStorage.setItem("user", JSON.stringify(res.data));
            }
           } catch (apiErr) {
             console.error("Failed to fetch user data from API:", apiErr);
           }
        }

        // Normalize role to array
        if (role && !Array.isArray(role)) {
          role = [role];
        }
        setUserRole(role);
        // Expose user data (we need to add 'user' state)
        // I will add setUser(userData) below
        setUser(userData);

      } else {
        setUserRole(null);
        setUser(null);
      }
    } catch (e) {
      console.error("Error checking user role:", e);
      setUserRole(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return (
    <UserContext.Provider value={{ user, userRole, isLoading, refreshRole: fetchUserRole }}>
      {children}
    </UserContext.Provider>
  );
};
