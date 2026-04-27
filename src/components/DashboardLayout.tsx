import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  BookOpen,
  UserCheck,
  Shield,
  BarChart3,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  Router,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import MySubmissions from "@/pages/author/MySubmissions";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleConfig } from "@/lib/roles";

import { url } from "../url";
import ThemeToggle from "./ThemeToggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName?: string;
}

export function DashboardLayout({
  children,
  role,
  userName,
}: DashboardLayoutProps) {
  const { logout, userData, user, switchRole, token } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (role !== "chief_editor" || !token) return;
    const fetchCount = () => {
      fetch(`${url}/chiefEditor/applications/count?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.count > 0) {
            setNavBadges({ "/chief-editor/applications": d.count });
          } else {
            setNavBadges({});
          }
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [role, token]);

  const { toast } = useToast();
  const config = roleConfig[role];
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        return toast({
          title: "Error",
          description: "Refresh token is missing, cannot logout",
        });
      }

      const response = await fetch(`${url}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Successful",
          description: "You are logged out successfully",
        });

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        logout();

        setTimeout(() => {
          navigate("/login");
        }, 800);
      } else {
        toast({
          title: "Failed",
          description: result.message || "Failed to logout, please try again",
        });
      }
    } catch (err: any) {
      console.error("🔥 Error during logout:", err);
      toast({
        title: "Failed",
        description: err.message || "Failed to logout, Please try again later",
      });
    } finally {
    }
  };

  const handleSwitchRole = async (
    newRole: UserRole,
    journalId?: string | null,
  ) => {
    const sameContext =
      newRole === role &&
      (journalId ?? null) === (user?.active_journal_id ?? null);
    if (sameContext || switchingRole) return;
    try {
      setSwitchingRole(true);
      await switchRole(newRole, journalId);
      const target = roleConfig[newRole]?.route ?? "/";
      navigate(target);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to switch role",
        variant: "destructive",
      });
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: mobileMenuOpen
            ? 0
            : typeof window !== "undefined" && window.innerWidth < 1024
              ? -280
              : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/50 bg-card/80 backdrop-blur-xl",
          "flex flex-col",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold">Paperuno</span>
            </motion.div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-8 w-8 p-0 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-muted-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "mx-4 mt-4 rounded-lg bg-muted/50 p-3",
            !sidebarOpen && "mx-2 p-2",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className={cn("h-4 w-4", config.color)} />
            </div>
            {sidebarOpen && (
              <div>
                <p className={cn("text-sm font-semibold", config.color)}>
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground">Active Session</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {config.navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const badge = navBadges[item.path];
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !sidebarOpen && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium flex-1">
                      {item.label}
                    </span>
                  )}
                  {sidebarOpen && badge ? (
                    <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                      {badge}
                    </span>
                  ) : null}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              !sidebarOpen && "justify-center",
            )}
          >
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={userData?.profile_pic} />

              <AvatarFallback className="bg-primary/10 text-primary">
                {(userName || userData?.username || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userName}
                </p>
                <Link to="/profile">
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </Link>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.aside>

      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:pl-[280px]" : "lg:pl-20",
        )}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-9 w-9 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="hidden md:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 w-[300px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search papers, users..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  ⌘
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border">
                Switch Role
              </span>
              {user &&
                (() => {
                  const roleOrder = [
                    "publisher",
                    "journal_manager",
                    "chief_editor",
                    "sub_editor",
                    "reviewer",
                    "author",
                    "owner",
                  ];

                  const uniqueRoles = Array.from(
                    new Map(
                      (user.roles ?? [])
                        .filter((r) => r.role !== role)
                        .sort(
                          (a, b) =>
                            roleOrder.indexOf(a.role) -
                            roleOrder.indexOf(b.role),
                        )
                        .map((r) => [r.role, r]), // unique by role
                    ).values(),
                  );

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 max-w-[220px] h-auto py-1.5 px-3"
                          disabled={switchingRole || uniqueRoles.length === 0}
                        >
                          <Shield
                            className={cn(
                              "h-3.5 w-3.5 flex-shrink-0",
                              config.color,
                            )}
                          />
                          <div className="flex flex-col items-start text-left min-w-0">
                            <span className="text-xs font-semibold leading-none">
                              {config.label}
                            </span>
                          </div>
                          {uniqueRoles.length > 0 && (
                            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>

                      {uniqueRoles.length > 0 && (
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Switch Role
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {uniqueRoles.map((entry, i) => {
                            const rc = roleConfig[entry.role as UserRole];
                            if (!rc) return null;

                            return (
                              <DropdownMenuItem
                                key={`${entry.role}-${i}`}
                                onClick={() =>
                                  handleSwitchRole(
                                    entry.role as UserRole,
                                    entry.journal_id,
                                  )
                                }
                                className="gap-3 cursor-pointer py-2.5"
                              >
                                <rc.icon
                                  className={cn(
                                    "h-4 w-4 flex-shrink-0",
                                    rc.color,
                                  )}
                                />
                                <span className="text-sm font-medium">
                                  {rc.label}
                                </span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  );
                })()}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {!user?.profile_completed && (
          <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-sm flex items-center justify-between">
            <span>
              Your profile is incomplete. Some features are restricted until you
              complete it.
            </span>
            <Link
              to="/complete-profile"
              className="underline font-medium ml-4 whitespace-nowrap"
            >
              Complete Profile →
            </Link>
          </div>
        )}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
