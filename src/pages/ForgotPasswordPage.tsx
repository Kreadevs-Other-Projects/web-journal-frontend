import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Mail } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import { extractApiErrorMessage, readApiError } from "@/lib/apiError";

const genericSuccess =
  "If an account exists for this email, password reset instructions have been sent.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Enter the email associated with your account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${url}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Unable to send reset instructions."),
        );
      }

      const data = await response.json();
      const successMessage =
        typeof data.message === "string" ? data.message : genericSuccess;
      setMessage(successMessage);
      toast({
        title: "Reset instructions sent",
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: extractApiErrorMessage(
          error,
          "Unable to send reset instructions.",
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
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter the email associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
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
