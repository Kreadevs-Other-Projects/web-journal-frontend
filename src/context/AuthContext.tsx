import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/lib/roles";
import { url } from "@/url";
import { extractApiErrorMessage, readApiError } from "@/lib/apiError";

export interface UserRoleContext {
  role: string;
  journal_id: string | null;
  journal_name: string | null;
}
export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  roles: UserRoleContext[];
  active_journal_id: string | null;
  profile_completed: boolean;
}
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile_pic: string;
  created_at?: string;
  title?: string;
  lastActive?: string;
  papersSubmitted?: number;
  papersReviewed?: number;
  citationCount?: number;
  hIndex?: number;
  expertise?: string[];
  qualifications?: string;
  certifications?: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}
interface AuthContextType {
  user: AuthUser | null;
  userData: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials?: LoginCredentials) => Promise<any>;
  verifyLoginOtp: (email: string, otp: string, role: UserRole) => Promise<void>;
  resendLoginOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole, journalId?: string | null) => Promise<void>;
  hasAnyRole: (roles: string[]) => boolean;
  currentRoleLabel: () => string;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ROLE_LABELS: Record<string, string> = {
  chief_editor: "Chief Editor",
  sub_editor: "Associate Editor",
  reviewer: "Reviewer",
  author: "Author",
  publisher: "Publisher",
  journal_manager: "Journal Manager",
  owner: "Owner",
};
function normalizeRoles(
  raw: (UserRoleContext | string)[] | undefined,
  fallback: string,
): UserRoleContext[] {
  if (!raw || raw.length === 0)
    return [{ role: fallback, journal_id: null, journal_name: null }];
  return raw.map((r) =>
    typeof r === "string"
      ? { role: r, journal_id: null, journal_name: null }
      : r,
  );
}
function profileToAuthUser(apiUser: any): AuthUser {
  const activeRole = apiUser.active_role ?? apiUser.role;
  return {
    id: apiUser.id,
    role: activeRole,
    email: apiUser.email,
    username: apiUser.username,
    roles: normalizeRoles(apiUser.roles, activeRole),
    active_journal_id: apiUser.active_journal_id ?? null,
    profile_completed: apiUser.profile_completed ?? true,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    setUserData(null);
  };

  const refreshSession = async () => {
    const res = await fetch(`${url}/auth/token`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  };

  const fetchProfile = async (allowRefresh = true) => {
    let res = await fetch(`${url}/profile/getProfile`, {
      credentials: "include",
    });

    if (res.status === 401 && allowRefresh && (await refreshSession())) {
      res = await fetch(`${url}/profile/getProfile`, {
        credentials: "include",
      });
    }

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthState();
      }
      throw new Error(await readApiError(res, "Not authenticated"));
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Not authenticated");

    setUser(profileToAuthUser(data.data.user));

    setToken("cookie");
  };

  useEffect(() => {
    fetchProfile()
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials?: LoginCredentials) => {
    if (!credentials) {
      await fetchProfile();
      return;
    }
    const res = await fetch(`${url}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...credentials, purpose: "login" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiErrorMessage(data, "Login failed"));
    return data;
  };

  const verifyLoginOtp = async (email: string, otp: string, role: UserRole) => {
    const res = await fetch(`${url}/auth/verifyLoginOTP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp, role }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(extractApiErrorMessage(data, "OTP verification failed"));
    if (data.user) {
      setUser(profileToAuthUser(data.user));
      setToken("cookie");
      return;
    }
    await fetchProfile();
  };

  const resendLoginOtp = async (email: string) => {
    const res = await fetch(`${url}/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, purpose: "login" }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res, "Failed to resend OTP"));
    }
  };

  const logout = async () => {
    const res = await fetch(`${url}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to logout"));
    clearAuthState();
  };

  const hasAnyRole = (roles: string[]) =>
    user?.roles?.some((r) => roles.includes(r.role)) ?? false;

  const currentRoleLabel = () =>
    ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "";

  const switchRole = async (role: UserRole, journalId?: string | null) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${url}/auth/switch-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role, journal_id: journalId ?? null }),
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(extractApiErrorMessage(data, "Failed to switch role"));
    await login();
  };

  useEffect(() => {
    if (!token) return;
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${url}/profile/getProfile`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          const { user: apiUser, profile: apiProfile } = data.data;
          setUserData({
            id: apiUser.id,
            username: apiUser.username,
            email: apiUser.email,
            role: apiUser.role,
            profile_pic: apiUser.profile_pic,
            created_at: apiUser.created_at,
            title: apiUser.title || "",
            lastActive: apiProfile.lastActive || "",
            papersSubmitted: apiProfile.papersSubmitted || 0,
            papersReviewed: apiProfile.papersReviewed || 0,
            citationCount: apiProfile.citationCount || 0,
            hIndex: apiProfile.hIndex || 0,
            expertise: Array.isArray(apiProfile.expertise)
              ? apiProfile.expertise
              : [],
            qualifications: apiProfile.qualifications || "",
            certifications: apiProfile.certifications || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfileData();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        logout,
        switchRole,
        hasAnyRole,
        currentRoleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
