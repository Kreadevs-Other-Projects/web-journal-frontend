import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import { extractApiErrorMessage, readApiError } from "@/lib/apiError";

const getPasswordError = (password: string) => {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/\d/.test(password)) return "Password must include a number";
  return "";
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const passwordError = useMemo(() => {
    if (!password) return "";
    return getPasswordError(password);
  }, [password]);

  const requirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Contains number", met: /\d/.test(password) },
  ];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid. Request a new one.",
        variant: "destructive",
      });
      return;
    }

    const validationMessage = getPasswordError(password);
    if (validationMessage) {
      toast({
        title: "Invalid password",
        description: validationMessage,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm password must match the new password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${url}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(
            response,
            "Unable to reset password. Request a new password reset link.",
          ),
        );
      }

      const data = await response.json();
      toast({
        title: "Password reset",
        description:
          data.message || "Password reset successfully. Please sign in.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: extractApiErrorMessage(
          error,
          "Unable to reset password. Request a new password reset link.",
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-serif-roboto text-2xl font-bold">Paperuno</span>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.text}
                    className="flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2
                      className={cn(
                        "h-3 w-3 flex-shrink-0",
                        requirement.met
                          ? "text-success"
                          : "text-muted-foreground/30",
                      )}
                    />
                    <span
                      className={
                        requirement.met
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              {!token && (
                <p className="text-sm text-destructive">
                  This password reset link is invalid. Request a new one.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !token}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
