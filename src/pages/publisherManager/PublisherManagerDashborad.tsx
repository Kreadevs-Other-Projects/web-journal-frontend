import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  FileText,
  CheckCircle,
  Eye,
  X,
  Search,
  Clock,
  User,
  BookOpen,
  ExternalLink,
  Loader2,
  AlertCircle,
  Download,
  Shield,
  Hash,
  Link,
  Info,
  Plus,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PublishedPaper {
  id: string;
  title: string;
  status: string;
  author_name: string;
  published_at: string | null;
  issue_label: string | null;
  doi: string | null;
}

interface JournalIssue {
  id: string;
  journal_id: string;
  journal_title: string;
  label: string;
  volume?: number;
  issue?: number;
  year?: number;
  status: string;
  article_count?: number;
  created_at: string;
}

type IssueStatusFilter = "all" | "open" | "closed" | "draft" | "published";
type MainTab = "papers" | "issues";

export default function PublisherManager() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>("papers");

  // ---- Papers tab state ----
  const [papers, setPapers] = useState<PublishedPaper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);

  // ---- Issues tab state ----
  const [issues, setIssues] = useState<JournalIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issueStatusFilter, setIssueStatusFilter] = useState<IssueStatusFilter>("all");
  const [openRequestIssue, setOpenRequestIssue] = useState(false);
  const [requestingIssue, setRequestingIssue] = useState(false);
  const [nextIssuePreview, setNextIssuePreview] = useState<{ label: string; volume: number; issue: number; year: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchPapers = async () => {
      try {
        setPapersLoading(true);
        const res = await fetch(`${url}/journal-issue/my-papers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPapers(data.papers || []);
        } else {
          throw new Error("Failed to fetch papers");
        }
      } catch (err) {
        console.error("Error fetching published papers:", err);
        toast({
          title: "Error",
          description: "Unable to load published papers.",
          variant: "destructive",
        });
      } finally {
        setPapersLoading(false);
      }
    };
    fetchPapers();
  }, [token]);

  // Fetch issues when Issues tab is activated
  useEffect(() => {
    if (mainTab === "issues" && token) {
      fetchIssues();
    }
  }, [mainTab, token]);

  const fetchIssues = async () => {
    try {
      setIssuesLoading(true);
      const res = await fetch(`${url}/journal-issue/my-issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || Array.isArray(data.issues)) {
        setIssues(data.issues || []);
      } else {
        throw new Error("Failed to fetch issues");
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      toast({
        title: "Error",
        description: "Unable to load issues.",
        variant: "destructive",
      });
    } finally {
      setIssuesLoading(false);
    }
  };

  const filteredIssues = issues.filter((iss) =>
    issueStatusFilter === "all" ? true : iss.status === issueStatusFilter,
  );

  const fetchNextIssuePreview = async () => {
    const journalId = user?.active_journal_id ?? issues[0]?.journal_id ?? null;
    if (!journalId) return;
    try {
      setPreviewLoading(true);
      const res = await fetch(`${url}/journal-issue/${journalId}/next-issue-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNextIssuePreview(data.preview);
    } catch (err) {
      console.error("Failed to fetch issue preview", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRequestIssue = async () => {
    try {
      setRequestingIssue(true);
      const journalId = user?.active_journal_id ?? issues[0]?.journal_id ?? null;
      const res = await fetch(`${url}/journal-issue/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ journal_id: journalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request issue");
      toast({ title: "Issue Requested", description: "Your request has been submitted." });
      setOpenRequestIssue(false);
      setNextIssuePreview(null);
      fetchIssues();
    } catch (err: any) {
      toast({ title: "Request Failed", description: err.message, variant: "destructive" });
    } finally {
      setRequestingIssue(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      submitted: { label: "Submitted", variant: "secondary" },
      under_review: { label: "Under Review", variant: "outline" },
      published: { label: "Published", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "secondary" };

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const getDecisionBadge = (decision: string) => {
    const decisionMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "outline" | "destructive";
      }
    > = {
      accepted: { label: "Accepted", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      revision_needed: { label: "Revision Needed", variant: "outline" },
    };

    const config = decisionMap[decision] || {
      label: decision,
      variant: "secondary",
    };

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const getIssueBadgeStyle = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-red-100 text-red-800 border-red-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "published":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Journal Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage issues and track publications for your journal
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
          <TabsList>
            <TabsTrigger value="papers" className="gap-2">
              <FileText className="h-4 w-4" />
              Published Papers
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <Layers className="h-4 w-4" />
              Issues
            </TabsTrigger>
          </TabsList>

          {/* ===== PAPERS TAB ===== */}
          <TabsContent value="papers" className="space-y-4 mt-4">
            {papersLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading published papers...</p>
              </div>
            ) : papers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No published papers yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No published papers yet for this journal.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Author</th>
                      <th className="px-4 py-3 text-left">Issue</th>
                      <th className="px-4 py-3 text-left">Published</th>
                      <th className="px-4 py-3 text-left">DOI</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper) => (
                      <tr key={paper.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground max-w-[260px]">
                          <span className="line-clamp-2">{paper.title}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {paper.author_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {paper.issue_label ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(paper.published_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {paper.doi ? (
                            <a
                              href={paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {paper.doi}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="default" className="text-xs">Published</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ===== ISSUES TAB ===== */}
          <TabsContent value="issues" className="space-y-6 mt-4">
            {/* Header row with filter tabs + Request button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Tabs
                value={issueStatusFilter}
                onValueChange={(v) => setIssueStatusFilter(v as IssueStatusFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={() => { setOpenRequestIssue(true); fetchNextIssuePreview(); }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
              >
                <Plus className="h-4 w-4" />
                Request New Issue
              </Button>
            </div>

            {issuesLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading issues...</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {issueStatusFilter !== "all" ? "No matching issues" : "No issues yet"}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {issueStatusFilter !== "all"
                      ? "Try a different filter"
                      : "Request a new issue to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 text-left">Journal</th>
                      <th className="px-4 py-3 text-left">Label</th>
                      <th className="px-4 py-3 text-center">Volume</th>
                      <th className="px-4 py-3 text-center">Issue No</th>
                      <th className="px-4 py-3 text-center">Year</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Articles</th>
                      <th className="px-4 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((iss) => (
                      <tr
                        key={iss.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {iss.journal_title || "—"}
                        </td>
                        <td className="px-4 py-3 text-foreground">{iss.label || "N/A"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{iss.volume ?? "N/A"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{iss.issue ?? "N/A"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{iss.year ?? "N/A"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${getIssueBadgeStyle(iss.status)}`}
                          >
                            {iss.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {iss.article_count ?? 0}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {iss.created_at
                            ? new Date(iss.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Request New Issue Dialog */}
        <Dialog open={openRequestIssue} onOpenChange={setOpenRequestIssue}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Layers className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Request New Issue
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">Submit a request for a new journal issue</p>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading next issue preview...</p>
                </div>
              ) : nextIssuePreview ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Next Issue</p>
                  <p className="text-2xl font-bold text-foreground">{nextIssuePreview.label}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Volume</p>
                      <p className="font-semibold">{nextIssuePreview.volume}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Issue No</p>
                      <p className="font-semibold">{nextIssuePreview.issue}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Year</p>
                      <p className="font-semibold">{nextIssuePreview.year}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The system will automatically assign this label when your request is approved.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Info className="h-8 w-8 opacity-50" />
                  <p className="text-sm">Unable to load issue preview. You can still submit the request.</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenRequestIssue(false);
                  setNextIssuePreview(null);
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleRequestIssue}
                disabled={requestingIssue}
                className="flex-1"
              >
                {requestingIssue ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Requesting...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />Submit Request</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
