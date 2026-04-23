import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Shield,
  Settings,
  Edit,
  Users,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleConfig } from "@/lib/roles";
import { url } from "../url";
import { useAuth } from "@/context/AuthContext";
import { OtpInput } from "@/components/OtpInput";

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>("publisher");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSignInLink, setShowSignInLink] = useState(false);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "email") setShowSignInLink(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, and numbers";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setShowSignInLink(false);

    try {
      // Step 1: send OTP to email before creating account
      const otpRes = await fetch(`${url}/auth/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          purpose: "signup",
          role: selectedRole,
        }),
      });

      const otpResult = await otpRes.json();

      if (!otpRes.ok) {
        // Duplicate role — show error on the form without sending OTP
        if (
          otpRes.status === 409 &&
          otpResult.errors &&
          Array.isArray(otpResult.errors)
        ) {
          const map: Record<string, string> = {};
          otpResult.errors.forEach((e: { field: string; message: string }) => {
            map[e.field] = e.message;
          });
          setErrors(map);
          setShowSignInLink(true);
          return;
        }
        throw new Error(
          otpResult.message || "Failed to send verification code",
        );
      }

      setStep("OTP");
      toast({
        title: "Verification code sent",
        description: `Check ${formData.email} for your 6-digit code`,
      });
    } catch (error: any) {
      setErrors({ general: error.message || "Signup failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setOtpLoading(true);
    setOtpError("");

    try {
      // Step 2: verify OTP
      const verifyRes = await fetch(`${url}/auth/verifysignup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otpCode }),
      });

      const verifyResult = await verifyRes.json();

      if (!verifyRes.ok) {
        setOtpError(verifyResult.message || "Invalid OTP");
        return;
      }

      // Step 3: create account (backend checks OTP was verified)
      const signupRes = await fetch(`${url}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const signupResult = await signupRes.json();

      // Existing account + new role: server returns a JWT
      if (signupRes.ok && signupResult.token) {
        login(signupResult.token);
        if (signupResult.refreshToken) {
          localStorage.setItem("refreshToken", signupResult.refreshToken);
        }
        const addedRole: string =
          signupResult.user?.active_role ?? selectedRole;
        const roleLabel =
          addedRole.charAt(0).toUpperCase() + addedRole.slice(1);
        toast({
          title: `${roleLabel} role added!`,
          description:
            signupResult.message ||
            `You can now access the ${roleLabel} dashboard.`,
        });
        const roleRoutes: Record<string, string> = {
          author: "/author",
          reviewer: "/reviewer",
          publisher: "/publisher",
        };
        navigate(roleRoutes[addedRole] ?? "/");
        return;
      }

      if (!signupRes.ok) {
        if (signupResult.errors && Array.isArray(signupResult.errors)) {
          setStep("FORM");
          const map: Record<string, string> = {};
          signupResult.errors.forEach(
            (e: { field: string; message: string }) => {
              map[e.field] = e.message;
            },
          );
          setErrors(map);
          setShowSignInLink(true);
          return;
        }
        setOtpError(signupResult.message || "Signup failed");
        return;
      }

      toast({
        title: "Account Created",
        description: "Signup successful! Please sign in.",
      });
      navigate("/login");
    } catch (error: any) {
      setOtpError(error.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendSignupOTP = async () => {
    const res = await fetch(`${url}/auth/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, purpose: "signup" }),
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.message || "Failed to resend OTP");
    }
    setOtpError("");
    toast({
      title: "Code resent",
      description: "Check your email for a new code",
    });
  };

  const passwordStrength = () => {
    if (!formData.password) return 0;

    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[a-z]/.test(formData.password)) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;

    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return "bg-destructive";
    if (strength < 75) return "bg-warning";
    return "bg-success";
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 mt-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground">
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Join our academic community of researchers and reviewers
              </CardDescription>
            </CardHeader>

            <CardContent>
              {step === "OTP" && (
                <OtpInput
                  email={formData.email}
                  onComplete={handleVerifyOTP}
                  onResend={handleResendSignupOTP}
                  onBack={() => {
                    setStep("FORM");
                    setOtpError("");
                  }}
                  isLoading={otpLoading}
                  error={otpError}
                />
              )}

              <form
                onSubmit={handleSubmit}
                className={cn(
                  "space-y-6 transition-opacity",
                  step === "OTP" && "hidden",
                )}
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <User className="h-4 w-4 text-primary" />
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="john_doe"
                      value={formData.username}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                        errors.username &&
                          "border-destructive focus:border-destructive focus:ring-destructive/20",
                      )}
                      disabled={isLoading}
                    />
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                        errors.email &&
                          "border-destructive focus:border-destructive focus:ring-destructive/20",
                      )}
                      disabled={isLoading}
                    />
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.email && (
                    <div className="space-y-1">
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {errors.email}
                      </p>
                      {showSignInLink && (
                        <p className="text-xs text-muted-foreground">
                          <Link
                            to="/login"
                            className="text-primary font-medium hover:underline"
                          >
                            Sign in instead →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Lock className="h-4 w-4 text-primary" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 pr-10 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                        errors.password &&
                          "border-destructive focus:border-destructive focus:ring-destructive/20",
                      )}
                      disabled={isLoading}
                    />
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password strength
                        </span>
                        <span className="font-medium">
                          {passwordStrength()}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength()}%` }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "h-full",
                            getStrengthColor(passwordStrength()),
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs"
                      >
                        <CheckCircle2
                          className={cn(
                            "h-3 w-3 flex-shrink-0",
                            req.met
                              ? "text-success"
                              : "text-muted-foreground/30",
                          )}
                        />
                        <span
                          className={
                            req.met ? "text-success" : "text-muted-foreground"
                          }
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1 pt-2">
                      <Shield className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="h-4 w-4 text-primary" />
                    Select Your Role
                  </Label>

                  <div className="grid grid-cols-3 gap-2">
                    {(["publisher", "author", "reviewer"] as UserRole[]).map(
                      (role) => {
                        const config = roleConfig[role];
                        const Icon = config.icon;
                        const isSelected = selectedRole === role;

                        return (
                          <motion.button
                            key={role}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleSelect(role)}
                            className={cn(
                              "relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-glow border-primary"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted border-border",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">
                              {config.label}
                            </span>
                            {isSelected && (
                              <motion.div
                                layoutId="roleIndicator"
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary"
                              />
                            )}
                          </motion.button>
                        );
                      },
                    )}
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      <span className="font-medium text-foreground">
                        {roleConfig[selectedRole].label}
                      </span>{" "}
                      - {roleConfig[selectedRole].description}
                    </p>
                  </div>

                  {errors.role && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <Shield className="h-3 w-3 shrink-0" />
                        {errors.role}
                      </p>
                      {showSignInLink && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Link
                            to="/login"
                            className="text-primary font-medium hover:underline"
                          >
                            Sign in instead →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {errors.general && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive text-center">
                      {errors.general}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full btn-physics bg-gradient-primary hover:opacity-90 py-6 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary font-medium hover:underline transition-colors"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure & Encrypted</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>Academic Integrity</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Join 10,000+ researchers and reviewers worldwide
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
