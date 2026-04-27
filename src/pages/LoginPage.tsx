import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  User,
  Users,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/AnimationWrappers";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleConfig } from "@/lib/roles";
import { url } from "../url";
import { OtpInput } from "@/components/OtpInput";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole>("publisher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const { login } = useAuth();
  const { toast } = useToast();
  const [otpError, setOtpError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Enter email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: selectedRole,
          purpose: "login",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Credentials accepted — server sent OTP, move to verification step
      setStep("otp");
      toast({
        title: "Verification code sent",
        description: `Check ${email} for your 6-digit code`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    try {
      setIsLoading(true);
      setOtpError("");

      const response = await fetch(`${url}/auth/verifyLoginOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setOtpError(result.message || "OTP verification failed");
        return;
      }

      login(result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("refreshToken", result.refreshToken);

      const activeRole = selectedRole as UserRole;
      navigate(roleConfig[activeRole].route, { replace: true });

      toast({
        title: "Login Successful",
        description: `Welcome ${roleConfig[activeRole].label}!`,
        variant: "default",
      });
    } catch (error: any) {
      setOtpError(error.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const response = await fetch(`${url}/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), purpose: "login" }),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Failed to resend OTP");
    }
    setOtpError("");
    toast({
      title: "Code resent",
      description: "Check your email for a new code",
    });
  };

  return (
    <PageTransition className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute inset-0 bg-mesh-pattern opacity-50" />
      <div className="noise-overlay" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full border border-primary/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 rounded-full border border-accent/10"
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-center"
          >
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="font-serif-roboto text-3xl font-bold text-muted-foreground">
                Paperuno
              </span>
            </div>

            <h1 className="font-serif-outfit text-4xl font-bold text-foreground mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Sign in to continue managing your academic research and
              publications.
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br from-primary/20 to-primary/5",
                    )}
                  >
                    {(() => {
                      const Icon = roleConfig[selectedRole].icon;
                      return (
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            roleConfig[selectedRole].color,
                          )}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "font-semibold",
                        roleConfig[selectedRole].color,
                      )}
                    >
                      {roleConfig[selectedRole].label} Portal
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {roleConfig[selectedRole].description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {selectedRole === "author" && (
                    <>
                      <p>✓ Submit new research papers</p>
                      <p>✓ Track submission status</p>
                      <p>✓ View reviewer feedback</p>
                    </>
                  )}
                  {selectedRole === "reviewer" && (
                    <>
                      <p>✓ View assigned papers</p>
                      <p>✓ Submit reviews and decisions</p>
                      <p>✓ Track review deadlines</p>
                    </>
                  )}
                  {selectedRole === "chief_editor" && (
                    <>
                      <p>✓ Manage paper assignments</p>
                      <p>✓ Coordinate the review process</p>
                      <p>✓ Open and close submission calls</p>
                    </>
                  )}
                  {selectedRole === "sub_editor" && (
                    <>
                      <p>✓ Manage revisions and edits</p>
                      <p>✓ Coordinate with authors</p>
                      <p>✓ Prepare papers for publication</p>
                    </>
                  )}
                  {selectedRole === "journal_manager" && (
                    <>
                      <p>✓ Manage journal issues</p>
                      <p>✓ Oversee editorial board</p>
                      <p>✓ Publish accepted articles</p>
                    </>
                  )}
                  {selectedRole === "publisher" && (
                    <>
                      <p>✓ Create and manage journals</p>
                      <p>✓ Oversee all publications</p>
                      <p>✓ Configure journal settings</p>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif-roboto text-2xl font-bold">
                Paperuno
              </span>
            </div>

            <div className="glass-card p-8">
              <h2 className="font-serif-outfit text-2xl font-bold text-foreground mb-2">
                Sign In
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose your role and enter your credentials
              </p>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {(
                  [
                    "publisher",
                    "journal_manager",
                    "chief_editor",
                    "sub_editor",
                    "reviewer",
                    "author",
                  ] as UserRole[]
                ).map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  const isSelected = selectedRole === role;

                  return (
                    <motion.button
                      key={role}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        {role === "sub_editor" ? "Assoc. Editor" : config.label}
                      </span>
                      {isSelected && (
                        <motion.div
                          layoutId="roleIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {step === "credentials" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-5 pr-10 input-glow text-muted-foreground"
                    required
                  />
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="pl-5 pr-10 input-glow text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Sending code..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <OtpInput
                  email={email}
                  onComplete={handleVerifyOtp}
                  onResend={handleResendOtp}
                  onBack={() => {
                    setStep("credentials");
                    setOtpError("");
                  }}
                  isLoading={isLoading}
                  error={otpError}
                />
              )}

              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="/signup"
                    className="text-primary font-medium hover:underline"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Email verification required for all accounts
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
