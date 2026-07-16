export interface AuthUser {
  id?: number;
  role?: string | string[];
  roles?: string | string[];
  user_role?: string | string[];
  b2b_status?: string;
  meta_data?: Record<string, unknown> & { b2b_status?: string };
  [key: string]: any;
}

export interface SessionPayload {
  access_token: string;
  user: AuthUser;
}

interface SessionStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const readPersistedSession = (storage: SessionStorage) => {
  const token = storage.getItem("token");
  let user: AuthUser | null = null;
  try {
    const value = storage.getItem("user");
    user = value ? JSON.parse(value) : null;
  } catch {
    storage.removeItem("user");
  }
  return { token, user };
};

export const persistSession = (storage: SessionStorage, session: SessionPayload) => {
  storage.setItem("token", session.access_token);
  storage.setItem("user", JSON.stringify(session.user));
};

export const clearPersistedSession = (storage: SessionStorage) => {
  storage.removeItem("token");
  storage.removeItem("user");
};

export const persistUser = (storage: SessionStorage, user: AuthUser) => {
  storage.setItem("user", JSON.stringify(user));
};

export const normalizeRoles = (user: AuthUser | null): string[] | null => {
  if (!user) return null;
  const role = user.roles || user.role || user.user_role;
  if (!role) return null;
  return Array.isArray(role) ? role : [role];
};

export const isBusinessUser = (user: AuthUser | null, roles: string[] | null) =>
  Boolean(
    roles?.some((role) => role === "b2b_customer" || role === "administrator") ||
      user?.b2b_status === "approved" ||
      user?.meta_data?.b2b_status === "approved",
  );
