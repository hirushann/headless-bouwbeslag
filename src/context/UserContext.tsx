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

  const fetchUserRole = async () => {
    if (typeof window === "undefined") return;
    
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (token) {
        let role = null;
        let userData = null;

        if (userStr) {
          const user = JSON.parse(userStr);
          role = user.role || user.roles || user.user_role;
          userData = user;
        }

        // Always fetch ME to get latest addresses and roles
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
          // If the token is invalid, clear it
          if ((apiErr as any).response?.status === 401) {
             localStorage.removeItem("token");
             localStorage.removeItem("user");
             setUserRole(null);
             setUser(null);
             setIsLoading(false);
             return;
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
      // console.error("Error checking user role:", e);
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
