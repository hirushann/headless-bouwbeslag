"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type UserRole = string[];

interface UserContextType {
  userRole: UserRole | null;
  isLoading: boolean;
  refreshRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userRole: null,
  isLoading: true,
  refreshRole: async () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
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
        if (userStr) {
          const user = JSON.parse(userStr);
          role = user.role || user.roles || user.user_role;
        }

        // 2. If not found, decoding token might help
        if (!role) {
          const decoded = parseJwt(token);
          if (decoded) {
            if (decoded.data?.user?.roles) role = decoded.data.user.roles;
            else if (decoded.roles) role = decoded.roles;
          }
        }

        // 3. If still no role, fetch from API
        if (!role) {
          try {
            const res = await axios.get(
              `/api/user/me`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (res.data && res.data.roles) {
              role = res.data.roles;
              // console.log("👤 User Role (fetched from API):", role);
            }
          } catch (apiErr) {
            console.error("Failed to fetch user role from API:", apiErr);
          }
        } else {
        //   console.log("👤 Customer User Role (from cache/token):", role);
        }

        // Normalize to array
        if (role && !Array.isArray(role)) {
          role = [role];
        }
        setUserRole(role);
      } else {
        // console.log("👤 Customer User Role: Guest (No token)");
        setUserRole(null);
      }
    } catch (e) {
      console.error("Error checking user role:", e);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return (
    <UserContext.Provider value={{ userRole, isLoading, refreshRole: fetchUserRole }}>
      {children}
    </UserContext.Provider>
  );
};
