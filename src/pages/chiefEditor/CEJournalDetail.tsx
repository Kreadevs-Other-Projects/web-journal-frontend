import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  label: string;
  status: "open" | "closed" | "published";
  volume: number;
  issue: number;
  year: number;
  paper_count: number;
  created_at: string;
}

interface UnassignedPaper {
  id: string;
  title: string;
  status: string;
  submitted_at: string;
  author_name: string;
}

interface JournalDetail {
  journal: {
    id: string;
    title: string;
    acronym: string;
    issn: string;
    status: string;
  };
  issues: Issue[];
  unassigned_papers: UnassignedPaper[];
}

const MAX_PAPERS = 99;

const statusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Open</Badge>;
    case "closed":
      return <Badge className="bg-muted text-muted-foreground">Closed</Badge>;
    case "published":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Published</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const paperStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    accepted: "bg-green-500/10 text-green-600 border-green-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return (
    <Badge className={map[status] || "bg-muted text-muted-foreground"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

export default function CEJournalDetail() {
  const { journalId } = useParams<{ journalId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<JournalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingIssue, setTogglingIssue] = useState<string | null>(null);

  const fetchData = () => {
    if (!token || !journalId) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/journals/${journalId}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else throw new Error(res.message);
      })
      .catch((e) => toast({ variant: "destructive", title: "Error", description: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [token, journalId]);

  const toggleIssueStatus = async (issue: Issue) => {
    const newStatus = issue.status === "open" ? "closed" : "open";
    setTogglingIssue(issue.id);
    try {
      const res = await fetch(`${url}/chiefEditor/updateIssueStatus/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message);
      toast({ title: `Issue ${newStatus}`, description: resData.message });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setTogglingIssue(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="text-center py-20 text-muted-foreground">Journal not found.</div>
      </DashboardLayout>
    );
  }

  const { journal, issues, unassigned_papers } = data;

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chief-editor/journals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{journal.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {journal.acronym && <span className="font-mono">{journal.acronym}</span>}
              {journal.issn && <span>ISSN: {journal.issn}</span>}
              <Badge variant="outline" className="text-xs">{journal.status}</Badge>
            </div>
          </div>
        </div>

        {/* Issues */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5" /> Issues
          </h2>
          {issues.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues.map((issue) => (
                <Card key={issue.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {issue.label || `Vol.${issue.volume} Issue ${issue.issue} (${issue.year})`}
                      </CardTitle>
                      {statusBadge(issue.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {issue.paper_count} / {MAX_PAPERS} papers
                      </span>
                    </div>
                    {/* Slot progress */}
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((issue.paper_count / MAX_PAPERS) * 100, 100)}%` }}
                      />
                    </div>
                    {issue.status !== "published" && (
                      <Button
                        variant={issue.status === "open" ? "outline" : "default"}
                        size="sm"
                        className="w-full"
                        disabled={togglingIssue === issue.id}
                        onClick={() => toggleIssueStatus(issue)}
                      >
                        {togglingIssue === issue.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        ) : issue.status === "open" ? (
                          <><AlertCircle className="h-3.5 w-3.5 mr-2" /> Close Submissions</>
                        ) : (
                          <><CheckCircle className="h-3.5 w-3.5 mr-2" /> Open for Call to Paper</>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Papers */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Unassigned Papers
            {unassigned_papers.length > 0 && (
              <Badge variant="secondary">{unassigned_papers.length}</Badge>
            )}
          </h2>
          {unassigned_papers.length === 0 ? (
            <p className="text-muted-foreground text-sm">All papers are assigned to issues.</p>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {unassigned_papers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{paper.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {paper.author_name} ·{" "}
                        {paper.submitted_at
                          ? new Date(paper.submitted_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    {paperStatusBadge(paper.status)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
