import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  FileText,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  id: string;
  title: string;
  abstract?: string;
  status: string;
  created_at: string;
  author_id: string;
  author_name: string;
  is_taken_down?: boolean;
}

type StatusFilter =
  | "all"
  | "submitted"
  | "under_review"
  | "accepted"
  | "published"
  | "rejected";

const PAPER_STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  under_review:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  published:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const FILTER_LABELS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

export default function PublisherIssueDetailPage() {
  const { journalId, issueId } = useParams<{
    journalId: string;
    issueId: string;
  }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [journalTitle, setJournalTitle] = useState<string>("");
  const [issueLabel, setIssueLabel] = useState<string>("");

  const [takedownOpen, setTakedownOpen] = useState(false);
  const [takedownTarget, setTakedownTarget] = useState<Paper | null>(null);
  const [takedownReason, setTakedownReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/publisher/papers/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // API returns all papers including all statuses
        setPapers(data.data?.papers ?? data.data ?? []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load papers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalContext = async () => {
    try {
      const jRes = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jData = await jRes.json();
      if (jData.success) {
        const journal = jData.journals.find((j: any) => j.id === journalId);
        if (journal) {
          setJournalTitle(journal.title);
          const issue = (journal.issues ?? []).find(
            (i: any) => i.id === issueId,
          );
          if (issue) setIssueLabel(issue.label);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPapers();
    fetchJournalContext();
  }, [issueId]);

  const handleTakedownPaper = async () => {
    if (!takedownTarget || !takedownReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${url}/publisher/papers/${takedownTarget.id}/takedown`,
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
        toast({ title: "Paper taken down" });
        setTakedownOpen(false);
        setTakedownReason("");
        fetchPapers();
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

  const handleRestorePaper = async (paper: Paper) => {
    try {
      const res = await fetch(`${url}/publisher/papers/${paper.id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Paper restored" });
        fetchPapers();
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filtered =
    filter === "all" ? papers : papers.filter((p) => p.status === filter);

  return (
    <DashboardLayout role={user?.role} userName={user?.username ?? ""}>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
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
          <button
            onClick={() => navigate(`/publisher/journals/${journalId}`)}
            className="hover:text-foreground transition-colors truncate max-w-[120px]"
          >
            {journalTitle || "Journal"}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {issueLabel || "Issue"}
          </span>
        </nav>

        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate(`/publisher/journals/${journalId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Issues
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">
            Papers in {issueLabel || "this Issue"}
            {!loading && (
              <span className="text-muted-foreground font-normal text-base ml-2">
                ({papers.length})
              </span>
            )}
          </h1>
        </div>

        {/* Filter tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as StatusFilter)}
        >
          <TabsList className="flex-wrap h-auto">
            {FILTER_LABELS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1 text-[10px] opacity-60">
                    (
                    {
                      papers.filter(
                        (p) => f.value === "all" || p.status === f.value,
                      ).length
                    }
                    )
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-lg">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>
              No papers{" "}
              {filter !== "all"
                ? `with status "${filter}"`
                : "assigned to this issue yet"}
              .
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((paper) => (
              <Card key={paper.id}>
                <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{paper.title}</span>
                      {paper.is_taken_down && (
                        <Badge className="bg-red-600 text-white text-[10px]">
                          Taken Down
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By {paper.author_name} · Submitted{" "}
                      {formatDate(paper.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Badge
                      className={`text-[10px] px-1.5 capitalize ${
                        PAPER_STATUS_COLORS[paper.status] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {paper.status.replace(/_/g, " ")}
                    </Badge>

                    {paper.status === "published" && !paper.is_taken_down && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => {
                          setTakedownTarget(paper);
                          setTakedownOpen(true);
                        }}
                      >
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Take Down
                      </Button>
                    )}

                    {paper.is_taken_down && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-green-600"
                        onClick={() => handleRestorePaper(paper)}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Takedown dialog */}
      <Dialog open={takedownOpen} onOpenChange={setTakedownOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Down Paper</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground line-clamp-2">
            <strong>{takedownTarget?.title}</strong>
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
              onClick={handleTakedownPaper}
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
