import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  Layers,
  FileText,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Edit3,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  label: string;
  year: number;
  volume: number;
  issue: number;
  status: string;
  paper_count?: number;
  published_at?: string;
  is_taken_down?: boolean;
  takedown_reason?: string;
}

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  status: string;
  logo_url?: string;
  is_taken_down?: boolean;
}

const ISSUE_STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const MAX_PAPERS = 99;

export default function PublisherJournalDetailPage() {
  const { journalId } = useParams<{ journalId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [journal, setJournal] = useState<Journal | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [totalPapers, setTotalPapers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [takedownOpen, setTakedownOpen] = useState(false);
  const [takedownTarget, setTakedownTarget] = useState<Issue | null>(null);
  const [takedownReason, setTakedownReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch journal info from the publisher journals list
      const jRes = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jData = await jRes.json();
      if (jData.success) {
        const found = jData.journals.find((j: any) => j.id === journalId);
        if (found) {
          setJournal({
            id: found.id,
            title: found.title,
            acronym: found.acronym,
            issn: found.issn,
            status: found.status,
            logo_url: found.logo_url,
            is_taken_down: found.is_taken_down,
          });

          const tp = (found.issues ?? []).reduce(
            (sum: number, i: any) => sum + (i.paper_count ?? 0),
            0,
          );
          setTotalPapers(tp);
        }
      }

      // Fetch issues
      const iRes = await fetch(`${url}/publisher/getIssues/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const iData = await iRes.json();
      if (iData.success) setIssues(iData.data ?? []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load journal details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [journalId]);

  const handleTakedownIssue = async () => {
    if (!takedownTarget || !takedownReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${url}/publisher/journals/${journalId}/issues/${takedownTarget.id}/takedown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: takedownReason }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Issue taken down" });
        setTakedownOpen(false);
        setTakedownReason("");
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreIssue = async (issue: Issue) => {
    try {
      const res = await fetch(
        `${url}/publisher/journals/${journalId}/issues/${issue.id}/restore`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Issue restored" });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Restore failed",
        variant: "destructive",
      });
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <DashboardLayout role={user?.role} userName={user?.username ?? ""}>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/publisher")}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => navigate("/publisher/journals")}
            className="hover:text-foreground transition-colors"
          >
            Journals
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {journal?.title ?? "Loading..."}
          </span>
        </nav>

        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate("/publisher/journals")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Journals
        </Button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Journal info card */}
            {journal && (
              <Card>
                <CardContent className="p-5 flex gap-4 flex-wrap">
                  {journal.logo_url && (
                    <img
                      src={getFileUrl(journal.logo_url)}
                      alt={journal.title}
                      className="w-16 h-16 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold leading-tight">
                        {journal.title}
                      </h1>
                      {journal.is_taken_down && (
                        <Badge className="bg-red-600 text-white text-[10px]">
                          Taken Down
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap text-sm text-muted-foreground">
                      <span>{journal.acronym}</span>
                      {journal.issn && <span>· ISSN: {journal.issn}</span>}
                      <span>· {issues.length} Issues</span>
                      <span>· {totalPapers} Papers total</span>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Badge
                        className={`text-[10px] px-1.5 capitalize ${
                          journal.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {journal.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/publisher/journals/${journalId}/edit`)
                      }
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit Journal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">
                  Issues{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({issues.length})
                  </span>
                </h2>
              </div>

              {issues.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border rounded-lg">
                  <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No issues yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => {
                    const paperCount = issue.paper_count ?? 0;
                    const pct = Math.min((paperCount / MAX_PAPERS) * 100, 100);
                    const slotsLeft = Math.max(MAX_PAPERS - paperCount, 0);

                    return (
                      <Card key={issue.id}>
                        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                          {/* Issue label + status */}
                          <div className="flex-1 min-w-[180px] space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{issue.label}</span>
                              {issue.is_taken_down && (
                                <Badge className="bg-red-600 text-white text-[10px]">
                                  Taken Down
                                </Badge>
                              )}
                              <Badge
                                className={`text-[10px] px-1.5 capitalize ${
                                  ISSUE_STATUS_COLORS[issue.status] ??
                                  ISSUE_STATUS_COLORS.draft
                                }`}
                              >
                                {issue.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Vol. {issue.volume}, Issue {issue.issue} ·{" "}
                              {issue.year}
                              {issue.published_at &&
                                ` · Published ${formatDate(issue.published_at)}`}
                            </p>
                          </div>

                          {/* Paper progress */}
                          <div className="min-w-[160px] space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {paperCount} / {MAX_PAPERS} papers
                              </span>
                              <span>{slotsLeft} slots left</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/publisher/journals/${journalId}/issues/${issue.id}`,
                                )
                              }
                            >
                              View Papers
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuSeparator />
                                {issue.is_taken_down ? (
                                  <DropdownMenuItem
                                    onClick={() => handleRestoreIssue(issue)}
                                    className="text-green-600"
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Restore Issue
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setTakedownTarget(issue);
                                      setTakedownOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Take Down Issue
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Takedown dialog */}
      <Dialog open={takedownOpen} onOpenChange={setTakedownOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Down Issue</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will take down <strong>{takedownTarget?.label}</strong> and
            cascade to all its papers.
          </p>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              placeholder="Provide a reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTakedownOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!takedownReason.trim() || submitting}
              onClick={handleTakedownIssue}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Take Down
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
