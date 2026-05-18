import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Copy,
  Check,
  Lock,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import DOMPurify from "dompurify";
import RichTextEditor from "@/components/RichTextEditor";

interface Reviewer {
  id: string;
  assignment_id: string;
  assignment_status: string;
  assigned_at: string;
  username: string;
  email: string;
  decision?: string;
  comments?: string;
  confidential_comments?: string;
  reviewed_at?: string;
}

export default function RequestRevisionPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const paper = state?.paper;

  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(false);

  const [comments, setComments] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isReviewersOpen, setIsReviewersOpen] = useState(true);
  const [expandedReviewers, setExpandedReviewers] = useState<
    Record<number, boolean>
  >({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const toggleReviewer = (index: number) => {
    setExpandedReviewers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (!paperId || !token) return;
    setReviewersLoading(true);
    fetch(`${url}/subEditor/getReviewersForPaper/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setReviewers(data.data || []))
      .catch(() =>
        toast({
          title: "Could not load reviewer comments",
          variant: "destructive",
        }),
      )
      .finally(() => setReviewersLoading(false));
  }, [paperId, token]);

  const stripHtml = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(stripHtml(text));
      setCopied((prev) => ({ ...prev, [key]: true }));
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleCopyAll = () => {
    const all = reviewers
      .filter((r) => r.comments)
      .map((r, i) => `Reviewer ${i + 1}:\n${stripHtml(r.comments!)}`)
      .join("\n\n---\n\n");
    if (all) handleCopy("all", all);
  };

  const handleSubmit = async () => {
    if (!comments.trim() || !email.trim() || !password.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${url}/subEditor/decision/${paperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "revision",
          comments,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");

      toast({
        title: "Revision requested",
        description: "Author has been notified.",
      });
      navigate("/sub-editor/revision", { replace: true });
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

  const hasAnyComments = reviewers.some((r) => r.comments);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Request Revision</h1>
            {paper?.title && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {paper.title}
              </p>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT — Reviewer comments */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Reviewer Comments
                {!reviewersLoading && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({reviewers.length} reviewer
                    {reviewers.length !== 1 ? "s" : ""})
                  </span>
                )}
              </h2>
              {hasAnyComments && reviewers.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs h-8"
                  onClick={handleCopyAll}
                >
                  {copied["all"] ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied["all"] ? "Copied!" : "Copy All"}
                </Button>
              )}
            </div>

            {reviewersLoading ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading reviewer comments...
                  </p>
                </CardContent>
              </Card>
            ) : reviewers.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    No reviewers assigned yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviewers.map((reviewer, index) => (
                <Card key={reviewer.assignment_id} className="overflow-hidden">
                  {/* Clickable header */}
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleReviewer(index)}
                  >
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">
                            Reviewer {index + 1}
                          </span>

                          {reviewer.assignment_status === "submitted" ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              ⏳ Pending
                            </span>
                          )}

                          {reviewer.decision && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                reviewer.decision === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : reviewer.decision === "rejected"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                              }`}
                            >
                              {reviewer.decision.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {reviewer.comments && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(`r-${index}`, reviewer.comments!);
                              }}
                            >
                              {copied[`r-${index}`] ? (
                                <>
                                  <Check className="h-3 w-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy
                                </>
                              )}
                            </Button>
                          )}
                          {expandedReviewers[index] ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </div>

                  {/* Collapsible content */}
                  {expandedReviewers[index] && (
                    <CardContent className="p-4">
                      {reviewer.comments ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-sm"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(reviewer.comments),
                          }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {reviewer.assignment_status === "submitted"
                            ? "No comments provided."
                            : "Review not yet submitted."}
                        </p>
                      )}

                      {reviewer.confidential_comments && (
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Lock className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                              Confidential — Editors Only
                            </span>
                          </div>
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-sm text-purple-900 dark:text-purple-100"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                reviewer.confidential_comments,
                              ),
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* RIGHT — Revision form (sticky on desktop) */}
          <div className="w-full lg:w-96 lg:sticky lg:top-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Request Revision</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {paper?.title && (
                  <div className="bg-muted/40 rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Paper
                    </p>
                    <p className="text-sm font-medium line-clamp-2">
                      {paper.title}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="rev-comments">Comments to Author *</Label>

                  <RichTextEditor
                    value={comments}
                    onChange={setComments}
                    placeholder="Describe what revisions are required..."
                    minHeight="150px"
                  />
                  <p className="text-xs text-muted-foreground">
                    These comments will be sent to the author.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rev-email">Your Email *</Label>
                  <Input
                    id="rev-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rev-password">Your Password *</Label>
                  <Input
                    id="rev-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Confirm your identity"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !comments.trim() ||
                    !email.trim() ||
                    !password.trim()
                  }
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Revision Request"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
