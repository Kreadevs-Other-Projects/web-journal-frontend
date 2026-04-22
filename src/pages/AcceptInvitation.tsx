import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  chief_editor: "Chief Editor",
  journal_manager: "Journal Manager",
  sub_editor: "Associate Editor",
  reviewer: "Reviewer",
};

const ROLE_ROUTES: Record<string, string> = {
  chief_editor: "/chief-editor",
  journal_manager: "/publisher-manager",
  sub_editor: "/sub-editor",
  reviewer: "/reviewer",
};

interface InvitationInfo {
  name: string;
  email: string;
  role: string;
  journal_name: string;
  invited_by_name: string;
  expires_at: string;
}

type PageState = "loading" | "valid" | "error" | "success";

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const token = params.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage("No invitation token found in the link.");
      setPageState("error");
      return;
    }

    const verifyInvitation = async () => {
      try {
        const r = await fetch(`${url}/invitations/verify/${token}`);
        const data = await r.json();
        if (!data.success) {
          setErrorMessage(data.message || "Invalid or expired invitation.");
          setPageState("error");
        } else {
          setInvitation(data.invitation);
          setPageState("valid");
        }
      } catch (_) {
        setErrorMessage("Failed to verify invitation. Please try again.");
        setPageState("error");
      }
    };
    verifyInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm your password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${url}/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to accept invitation");

      // Log user in with the returned token
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      await login(data.token);
      setPageState("success");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Welcome aboard!</CardTitle>
            <CardDescription>
              Your account is set up. You are now logged in as{" "}
              <strong>
                {ROLE_LABELS[invitation?.role ?? ""] ?? invitation?.role}
              </strong>
              {invitation?.journal_name
                ? ` for ${invitation.journal_name}`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                navigate(
                  ROLE_ROUTES[invitation?.role ?? ""] ?? "/",
                  { replace: true },
                )
              }
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You have been invited to join{" "}
            <strong>{invitation?.journal_name}</strong> as{" "}
            <strong>
              {ROLE_LABELS[invitation?.role ?? ""] ?? invitation?.role}
            </strong>{" "}
            by {invitation?.invited_by_name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted px-4 py-3 space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {invitation?.name}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {invitation?.email}
            </p>
          </div>

          <div className="space-y-1">
            <Label>
              Set Your Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label>
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={submitting || !password || !confirmPassword}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up
                account...
              </>
            ) : (
              "Accept & Create Account"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Invitation expires{" "}
            {new Date(invitation?.expires_at ?? "").toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
