import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/lib/roles";
import { url } from "@/url";

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

interface JwtPayload {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  roles?: (UserRoleContext | string)[];
  active_role?: UserRole;
  active_journal_id?: string | null;
  profile_completed?: boolean;
  exp: number;
}

interface AuthContextType {
  user: AuthUser | null;
  userData: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
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

function normalizeRoles(raw: (UserRoleContext | string)[] | undefined, fallback: string): UserRoleContext[] {
  if (!raw || raw.length === 0) return [{ role: fallback, journal_id: null, journal_name: null }];
  return raw.map((r) =>
    typeof r === "string" ? { role: r, journal_id: null, journal_name: null } : r,
  );
}

function decodeAuthUser(token: string): AuthUser {
  const decoded = jwtDecode<JwtPayload>(token);
  const activeRole = decoded.active_role ?? decoded.role;
  return {
    id: decoded.id,
    role: activeRole,
    email: decoded.email,
    username: decoded.username,
    roles: normalizeRoles(decoded.roles, activeRole),
    active_journal_id: decoded.active_journal_id ?? null,
    // Default true for old tokens — existing users are not affected
    profile_completed: decoded.profile_completed ?? true,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);

        if (decoded.exp * 1000 < Date.now()) {
          logout();
          setIsLoading(false);
          return;
        }

        setUser(decodeAuthUser(storedToken));
        setToken(storedToken);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("accessToken", newToken);
    setUser(decodeAuthUser(newToken));
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  };

  const hasAnyRole = (roles: string[]) =>
    user?.roles?.some((r) => roles.includes(r.role)) ?? false;

  const currentRoleLabel = () => ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "";

  const switchRole = async (role: UserRole, journalId?: string | null) => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) throw new Error("Not authenticated");

    const res = await fetch(`${url}/auth/switch-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({ role, journal_id: journalId ?? null }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to switch role");

    login(data.token);
  };

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${url}/profile/getProfile`, {
          headers: { Authorization: `Bearer ${token}` },
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
        } else {
          console.error("Failed to fetch profile:", data.message);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
