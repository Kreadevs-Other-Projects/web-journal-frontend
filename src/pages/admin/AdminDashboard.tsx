import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Users,
  FileText,
  Settings,
  Activity,
  Shield,
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Filter,
  Download,
} from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

const users = [
  {
    id: "USR-001",
    name: "Dr. Sarah Wilson",
    email: "sarah@university.edu",
    role: "author",
    status: "active",
    joined: "2024-01-15",
    papers: 12,
  },
  {
    id: "USR-002",
    name: "Prof. James Chen",
    email: "jchen@research.org",
    role: "reviewer",
    status: "active",
    joined: "2024-01-10",
    papers: 0,
  },
  {
    id: "USR-003",
    name: "Dr. Emily Brown",
    email: "emily.b@lab.edu",
    role: "sub_editor",
    status: "active",
    joined: "2023-12-20",
    papers: 0,
  },
  {
    id: "USR-004",
    name: "Michael Zhang",
    email: "mzhang@college.edu",
    role: "author",
    status: "suspended",
    joined: "2024-01-20",
    papers: 3,
  },
  {
    id: "USR-005",
    name: "Dr. Lisa Park",
    email: "lpark@institute.org",
    role: "chief_editor",
    status: "active",
    joined: "2023-11-15",
    papers: 0,
  },
  {
    id: "USR-006",
    name: "Robert Taylor",
    email: "rtaylor@uni.edu",
    role: "reviewer",
    status: "pending",
    joined: "2024-01-25",
    papers: 0,
  },
];

const systemLogs = [
  {
    timestamp: "2024-01-26 14:32:15",
    level: "info",
    service: "auth",
    message: "User login successful: sarah@university.edu",
  },
  {
    timestamp: "2024-01-26 14:31:58",
    level: "info",
    service: "api",
    message: "Paper submission received: PAPER-2024-156",
  },
  {
    timestamp: "2024-01-26 14:31:42",
    level: "warn",
    service: "storage",
    message: "File upload retry (attempt 2/3): large_dataset.pdf",
  },
  {
    timestamp: "2024-01-26 14:31:30",
    level: "error",
    service: "email",
    message: "Failed to send notification: SMTP timeout",
  },
  {
    timestamp: "2024-01-26 14:31:15",
    level: "info",
    service: "review",
    message: "Review submitted for PAPER-2024-142",
  },
  {
    timestamp: "2024-01-26 14:30:58",
    level: "info",
    service: "auth",
    message: "User logout: jchen@research.org",
  },
  {
    timestamp: "2024-01-26 14:30:42",
    level: "info",
    service: "api",
    message: "Category update: AI/ML → Machine Learning",
  },
  {
    timestamp: "2024-01-26 14:30:30",
    level: "warn",
    service: "database",
    message: "Slow query defont-serif-outfit2s for papers listing",
  },
  {
    timestamp: "2024-01-26 14:30:15",
    level: "info",
    service: "system",
    message: "Scheduled backup completed successfully",
  },
  {
    timestamp: "2024-01-26 14:30:00",
    level: "info",
    service: "api",
    message: "Health check passed",
  },
];

const trafficData = [
  { date: "Jan 20", users: 145, requests: 2400 },
  { date: "Jan 21", users: 167, requests: 2890 },
  { date: "Jan 22", users: 189, requests: 3200 },
  { date: "Jan 23", users: 156, requests: 2700 },
  { date: "Jan 24", users: 201, requests: 3500 },
  { date: "Jan 25", users: 234, requests: 4100 },
  { date: "Jan 26", users: 256, requests: 4500 },
];

const roleDistribution = [
  { name: "Authors", value: 450, color: "hsl(var(--success))" },
  { name: "Reviewers", value: 120, color: "hsl(var(--info))" },
  { name: "Sub-Editors", value: 25, color: "hsl(var(--warning))" },
  { name: "Chief Editors", value: 5, color: "hsl(var(--accent))" },
];

const submissionStats = [
  { month: "Aug", submissions: 45, accepted: 32 },
  { month: "Sep", submissions: 52, accepted: 38 },
  { month: "Oct", submissions: 61, accepted: 42 },
  { month: "Nov", submissions: 58, accepted: 45 },
  { month: "Dec", submissions: 72, accepted: 51 },
  { month: "Jan", submissions: 89, accepted: 58 },
];

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [logs, setLogs] = useState(systemLogs);
  const [isStreaming, setIsStreaming] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newLog = {
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        level: ["info", "warn", "error", "info", "info"][
          Math.floor(Math.random() * 5)
        ] as "info" | "warn" | "error",
        service: ["api", "auth", "storage", "email", "system"][
          Math.floor(Math.random() * 5)
        ],
        message: [
          "Health check passed",
          "User session renewed",
          "Cache cleared successfully",
          "API rate limit warning",
          "Database connection pool: 85% utilized",
        ][Math.floor(Math.random() * 5)],
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "suspended":
        return "bg-destructive/10 text-destructive";
      case "pending":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive/10 text-destructive";
      case "chief_editor":
        return "bg-accent/10 text-accent";
      case "sub_editor":
        return "bg-primary/10 text-primary";
      case "reviewer":
        return "bg-info/10 text-info";
      case "author":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case "error":
        return "text-destructive";
      case "warn":
        return "text-warning";
      case "info":
        return "text-info";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif-outfit text-3xl font-bold text-white">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              System overview and management
            </p>
          </div>
          <Button className="btn-physics">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: 600,
              change: "+12%",
              icon: Users,
              color: "text-primary",
              trend: "up",
            },
            {
              label: "Total Papers",
              value: 1247,
              change: "+8%",
              icon: FileText,
              color: "text-success",
              trend: "up",
            },
            {
              label: "Active Sessions",
              value: 89,
              change: "-3%",
              icon: Activity,
              color: "text-info",
              trend: "down",
            },
            {
              label: "System Health",
              value: "98.5%",
              icon: Shield,
              color: "text-accent",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {typeof stat.value === "number" ? (
                          <AnimatedCounter
                            end={stat.value}
                            className="text-2xl font-bold"
                          />
                        ) : (
                          <span className="text-2xl font-bold">
                            {stat.value}
                          </span>
                        )}
                        {stat.change && (
                          <Badge
                            className={cn(
                              "text-xs",
                              stat.trend === "up"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {stat.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {stat.change}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center bg-muted/50",
                        stat.color,
                      )}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Terminal className="h-4 w-4 mr-2" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Activity className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Button
                    onClick={() => {
                      setSelectedUser(null);
                      setIsEditing(false);
                      setUserModalOpen(true);
                    }}
                    className="btn-physics"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 input-glow"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="author">Authors</SelectItem>
                      <SelectItem value="reviewer">Reviewers</SelectItem>
                      <SelectItem value="sub_editor">Sub-Editors</SelectItem>
                      <SelectItem value="chief_editor">
                        Chief Editors
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Papers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-border/50 group"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "capitalize",
                                getRoleColor(user.role),
                              )}
                            >
                              {user.role.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "capitalize",
                                getStatusColor(user.status),
                              )}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.joined).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{user.papers}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsEditing(true);
                                    setUserModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-warning">
                                  <Ban className="h-4 w-4 mr-2" />
                                  {user.status === "suspended"
                                    ? "Activate"
                                    : "Suspend"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      System Logs
                    </CardTitle>
                    <CardDescription>
                      Real-time system activity stream
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isStreaming ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsStreaming(!isStreaming)}
                      className="btn-physics"
                    >
                      {isStreaming ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-success animate-pulse mr-2" />
                          Live
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Paused
                        </>
                      )}
                    </Button>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="font-mono text-sm bg-background/50 p-4">
                    <AnimatePresence initial={false}>
                      {logs.map((log, index) => (
                        <motion.div
                          key={`${log.timestamp}-${index}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="py-1 border-b border-border/20 last:border-0 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-muted-foreground shrink-0">
                            {log.timestamp}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "uppercase text-[10px] shrink-0 font-bold",
                              getLogLevelStyle(log.level),
                            )}
                          >
                            {log.level}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {log.service}
                          </Badge>
                          <span className="text-foreground">{log.message}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "CPU Usage",
                  value: "42%",
                  icon: Cpu,
                  color: "text-success",
                },
                {
                  label: "Memory",
                  value: "68%",
                  icon: HardDrive,
                  color: "text-warning",
                },
                {
                  label: "Network",
                  value: "1.2 Gbps",
                  icon: Wifi,
                  color: "text-info",
                },
                {
                  label: "Uptime",
                  value: "99.9%",
                  icon: Activity,
                  color: "text-accent",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50",
                            stat.color,
                          )}
                        >
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Traffic Chart */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Platform Traffic</CardTitle>
                  <CardDescription>
                    Daily users and API requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trafficData}>
                      <defs>
                        <linearGradient
                          id="colorUsers"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {roleDistribution.map((role) => (
                      <div key={role.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {role.name}: {role.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Submissions Chart */}
              <Card className="glass-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Submission Statistics</CardTitle>
                  <CardDescription>
                    Monthly submissions vs acceptances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={submissionStats}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="submissions"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="accepted"
                        fill="hsl(var(--success))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="glass-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif-outfit">
              {selectedUser
                ? isEditing
                  ? "Edit User"
                  : "User Details"
                : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? isEditing
                  ? "Update user information"
                  : "View user information"
                : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                defaultValue={selectedUser?.name || ""}
                disabled={!isEditing && selectedUser !== null}
                className="input-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={selectedUser?.email || ""}
                disabled={!isEditing && selectedUser !== null}
                className="input-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                defaultValue={selectedUser?.role || "author"}
                disabled={!isEditing && selectedUser !== null}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="sub_editor">Sub-Editor</SelectItem>
                  <SelectItem value="chief_editor">Chief Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            {(isEditing || !selectedUser) && (
              <Button className="btn-physics">
                {selectedUser ? "Save Changes" : "Create User"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
