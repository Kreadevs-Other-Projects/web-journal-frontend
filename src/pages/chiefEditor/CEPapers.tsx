import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Loader2,
  Search,
  ShieldAlert,
  Bell,
  Eye,
  FileDown,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Reviewer {
  id: string;
  name: string;
  status: string;
  decision: string | null;
}

interface Paper {
  id: string;
  title: string;
  abstract: string | null;
  status: string;
  author_name: string;
  journal_name: string;
  journal_id: string;
  issue_label: string | null;
  created_at: string;
  submitted_at: string;
  accepted_at: string | null;
  published_at: string | null;
  current_ae_id: string | null;
  current_ae_name: string | null;
  current_ae_email: string | null;
  ae_assignment_status: string | null;
  ae_decision: string | null;
  ae_decided_at: string | null;
  reviewers: Reviewer[];
  file_url: string | null;
  file_type: string | null;
  current_version_number: number | null;
}

const OVERRIDE_STATUSES = ["accepted", "rejected", "pending_revision"];

const ACCEPTED_STATUSES = [
  "accepted",
  "awaiting_payment",
  "payment_review",
  "ready_for_publication",
  "published",
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  assigned_to_sub_editor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  under_review: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  pending_revision: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  resubmitted: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  reviewed: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  sub_editor_approved: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  accepted: "bg-green-500/10 text-green-600 border-green-500/30",
  awaiting_payment: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  payment_review: "bg-lime-500/10 text-lime-700 border-lime-500/30",
  ready_for_publication:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  published: "bg-teal-500/10 text-teal-600 border-teal-500/30",
};

const AE_DECISION_COLORS: Record<string, string> = {
  approve: "bg-green-500/10 text-green-600 border-green-500/30",
  reject: "bg-red-500/10 text-red-600 border-red-500/30",
  revision: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
};

type TabKey =
  | "all"
  | "submitted"
  | "assigned"
  | "under_review"
  | "reviewed"
  | "needs_decision"
  | "accepted"
  | "rejected"
  | "published";

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "all", label: "All", statuses: [] },
  { key: "submitted", label: "Submitted", statuses: ["submitted"] },
  {
    key: "assigned",
    label: "Assigned to AE",
    statuses: ["assigned_to_sub_editor"],
  },
  { key: "under_review", label: "Under Review", statuses: ["under_review"] },
  { key: "reviewed", label: "Reviewed", statuses: ["reviewed"] },
  {
    key: "needs_decision",
    label: "Needs Decision",
    statuses: ["sub_editor_approved"],
  },
  {
    key: "accepted",
    label: "Accepted",
    statuses: [
      "accepted",
      "awaiting_payment",
      "payment_review",
      "ready_for_publication",
    ],
  },
  { key: "rejected", label: "Rejected", statuses: ["rejected"] },
  { key: "published", label: "Published", statuses: ["published"] },
];

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (diff < 1) return "just now";
  if (diff < 24) return `${Math.floor(diff)}h ago`;
  return `${Math.floor(diff / 24)}d ago`;
}

export default function CEPapers() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const aeIdFilter = searchParams.get("ae_id");
  const reviewerIdFilter = searchParams.get("reviewer_id");

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [journalFilter, setJournalFilter] = useState("all");

  // Reminder state: maps paperId → timestamp of last reminder sent this session
  const [remindingAE, setRemindingAE] = useState<string | null>(null);
  const [remindingReviewer, setRemindingReviewer] = useState<string | null>(
    null,
  );
  const [recentReminders, setRecentReminders] = useState<
    Record<string, string>
  >({});

  // Override modal
  const [overridePaper, setOverridePaper] = useState<Paper | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overridePassword, setOverridePassword] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchPapers = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/getAllPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const rows = (data.data || []).map((p: any) => ({
            ...p,
            reviewers:
              typeof p.reviewers === "string"
                ? JSON.parse(p.reviewers)
                : p.reviewers || [],
          }));
          setPapers(rows);
        } else {
          throw new Error(data.message);
        }
      })
      .catch((e) =>
        toast({
          variant: "destructive",
          title: "Error",
          description: e.message,
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPapers();
  }, [token]);

  // Apply URL-param filters for AE/reviewer drill-down from stats page
  const preFiltered = useMemo(() => {
    if (aeIdFilter) return papers.filter((p) => p.current_ae_id === aeIdFilter);
    if (reviewerIdFilter)
      return papers.filter((p) =>
        p.reviewers.some((r) => r.id === reviewerIdFilter),
      );
    return papers;
  }, [papers, aeIdFilter, reviewerIdFilter]);

  const journals = useMemo(() => {
    const seen = new Set<string>();
    return preFiltered
      .filter(
        (p) =>
          p.journal_name &&
          !seen.has(p.journal_name) &&
          seen.add(p.journal_name),
      )
      .map((p) => p.journal_name);
  }, [preFiltered]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: preFiltered.length };
    for (const tab of TABS.slice(1)) {
      counts[tab.key] = preFiltered.filter((p) =>
        tab.statuses.includes(p.status),
      ).length;
    }
    return counts;
  }, [preFiltered]);

  const filtered = useMemo(() => {
    return preFiltered.filter((p) => {
      const tab = TABS.find((t) => t.key === activeTab);
      if (tab && tab.statuses.length > 0 && !tab.statuses.includes(p.status))
        return false;
      if (journalFilter !== "all" && p.journal_name !== journalFilter)
        return false;
      if (
        search &&
        !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.author_name?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [preFiltered, activeTab, journalFilter, search]);

  const openOverrideModal = (paper: Paper) => {
    setOverridePaper(paper);
    setOverrideStatus(paper.status);
    setOverrideReason("");
    setOverrideEmail("");
    setOverridePassword("");
  };

  const handleOverrideSubmit = async () => {
    if (
      !overridePaper ||
      !overrideStatus ||
      !overrideReason ||
      !overrideEmail ||
      !overridePassword
    ) {
      toast({ variant: "destructive", title: "All fields are required" });
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await fetch(
        `${url}/chiefEditor/papers/${overridePaper.id}/override-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: overrideStatus,
            reason: overrideReason,
            email: overrideEmail,
            password: overridePassword,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({
        title: "Status overridden",
        description: `Paper status updated to "${overrideStatus.replace(/_/g, " ")}"`,
      });
      setPapers((prev) =>
        prev.map((p) =>
          p.id === overridePaper.id ? { ...p, status: overrideStatus } : p,
        ),
      );
      setOverridePaper(null);
      fetchPapers();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e.message,
      });
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleRemindAE = async (paperId: string) => {
    setRemindingAE(paperId);
    try {
      const res = await fetch(
        `${url}/chiefEditor/papers/${paperId}/remind-ae`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRecentReminders((prev) => ({
        ...prev,
        [`ae-${paperId}`]: new Date().toISOString(),
      }));
      toast({ title: "Reminder sent", description: data.message });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Could not send reminder",
        description: e.message,
      });
    } finally {
      setRemindingAE(null);
    }
  };

  const handleRemindReviewer = async (paperId: string) => {
    setRemindingReviewer(paperId);
    try {
      const res = await fetch(
        `${url}/chiefEditor/papers/${paperId}/remind-reviewer`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRecentReminders((prev) => ({
        ...prev,
        [`rv-${paperId}`]: new Date().toISOString(),
      }));
      toast({ title: "Reminder sent", description: data.message });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Could not send reminder",
        description: e.message,
      });
    } finally {
      setRemindingReviewer(null);
    }
  };

  const getReminderLabel = (key: string) => {
    const ts = recentReminders[key];
    if (!ts) return null;
    return `Reminded ${timeAgo(ts)}`;
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Papers</h1>
          <p className="text-muted-foreground mt-1">
            All papers across your journals
          </p>
          {aeIdFilter && (
            <p className="text-xs text-blue-600 mt-1">
              Filtered by Associate Editor ·{" "}
              <button
                className="underline"
                onClick={() => window.location.assign("/chief-editor/papers")}
              >
                Clear filter
              </button>
            </p>
          )}
          {reviewerIdFilter && (
            <p className="text-xs text-blue-600 mt-1">
              Filtered by Reviewer ·{" "}
              <button
                className="underline"
                onClick={() => window.location.assign("/chief-editor/papers")}
              >
                Clear filter
              </button>
            </p>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={journalFilter} onValueChange={setJournalFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="All journals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Journals</SelectItem>
              {journals.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-t text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No papers found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {filtered.map((paper) => {
                const isAccepted = ACCEPTED_STATUSES.includes(paper.status);
                const pendingReviewers = paper.reviewers.filter(
                  (r) => r.status === "assigned",
                );
                const aeNeedsReminder =
                  !isAccepted && paper.current_ae_id && !paper.ae_decision;
                const rvNeedsReminder =
                  !isAccepted && pendingReviewers.length > 0;
                const aeReminderLabel = getReminderLabel(`ae-${paper.id}`);
                const rvReminderLabel = getReminderLabel(`rv-${paper.id}`);

                return (
                  <div key={paper.id} className="px-4 py-4 space-y-2">
                    {/* Row 1: Title + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">
                        {paper.title}
                      </p>
                      <Badge
                        className={`shrink-0 ${
                          STATUS_COLORS[paper.status] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {paper.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Row 2: Meta */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{paper.author_name || "—"}</span>
                      <span>·</span>
                      <span>{paper.journal_name}</span>
                      {paper.issue_label && (
                        <>
                          <span>·</span>
                          <span>{paper.issue_label}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {paper.submitted_at
                          ? new Date(paper.submitted_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : paper.created_at
                            ? new Date(paper.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                      </span>
                    </div>

                    {/* Row 3: AE + Reviewer info + Version */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">AE:</span>
                        <span className="font-medium">
                          {paper.current_ae_name || "Unassigned"}
                        </span>
                        {paper.ae_decision && (
                          <Badge
                            className={`text-[10px] h-4 px-1 ${
                              AE_DECISION_COLORS[paper.ae_decision] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {paper.ae_decision}
                          </Badge>
                        )}
                        {paper.current_ae_id && !paper.ae_decision && (
                          <span className="text-muted-foreground italic">
                            pending decision
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          Reviewers:
                        </span>
                        {paper.reviewers.length === 0 ? (
                          <span className="text-muted-foreground italic">
                            None assigned
                          </span>
                        ) : (
                          <span className="font-medium">
                            {paper.reviewers.map((r) => r.name).join(", ")}
                          </span>
                        )}
                        {paper.reviewers.length > 0 && (
                          <span className="text-muted-foreground">
                            ({pendingReviewers.length} pending)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          v{paper.current_version_number || 1}
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* View Paper */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() =>
                          navigate(`/chief-editor/papers/${paper.id}/view`, {
                            state: { paper },
                          })
                        }
                      >
                        <Eye className="h-3 w-3" />
                        View Paper
                      </Button>

                      {/* Assign AE */}
                      {!isAccepted && !["rejected"].includes(paper.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            navigate(
                              `/chief-editor/papers/${paper.id}/assign-ae`,
                            )
                          }
                        >
                          <UserPlus className="h-3 w-3" />
                          {paper.current_ae_id ? "Replace AE" : "Assign AE"}
                        </Button>
                      )}

                      {/* Assign Reviewer */}
                      {!isAccepted && !["rejected"].includes(paper.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            navigate(
                              `/chief-editor/papers/${paper.id}/assign-reviewer`,
                            )
                          }
                        >
                          <Users className="h-3 w-3" />
                          Assign Reviewer
                        </Button>
                      )}

                      {/* File download */}
                      {paper.file_url && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            title={
                              paper.file_type === "docx"
                                ? "Word file — download as Word"
                                : "Download file"
                            }
                            onClick={() =>
                              window.open(`${url}${paper.file_url}`, "_blank")
                            }
                          >
                            <FileDown className="h-3 w-3" />
                          </Button>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {paper.file_type
                              ? paper.file_type.replace(".", "").toUpperCase()
                              : "FILE"}
                          </span>
                        </div>
                      )}

                      {aeNeedsReminder && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          disabled={
                            remindingAE === paper.id || !!aeReminderLabel
                          }
                          onClick={() => handleRemindAE(paper.id)}
                        >
                          {remindingAE === paper.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bell className="h-3 w-3" />
                          )}
                          {aeReminderLabel ? aeReminderLabel : "Remind AE"}
                        </Button>
                      )}
                      {rvNeedsReminder && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          disabled={
                            remindingReviewer === paper.id || !!rvReminderLabel
                          }
                          onClick={() => handleRemindReviewer(paper.id)}
                        >
                          {remindingReviewer === paper.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bell className="h-3 w-3" />
                          )}
                          {rvReminderLabel
                            ? rvReminderLabel
                            : "Remind Reviewer"}
                        </Button>
                      )}
                      {paper.status !== "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => openOverrideModal(paper)}
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Override
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {preFiltered.length} papers
        </p>
      </div>

      {/* Override Status Modal */}
      <Dialog
        open={!!overridePaper}
        onOpenChange={(open) => !open && setOverridePaper(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Override Paper Status
            </DialogTitle>
            <DialogDescription>
              Forcefully change the paper status. The author will be notified.
              Credential verification is required.
            </DialogDescription>
          </DialogHeader>

          {overridePaper && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium line-clamp-2">
                  {overridePaper.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current: {overridePaper.status.replace(/_/g, " ")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={overrideStatus}
                  onValueChange={setOverrideStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERRIDE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason (required)</Label>
                <Textarea
                  placeholder="Explain why you are overriding the status..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Verify your credentials
                </p>
                <div className="space-y-2">
                  <Label>Your Email</Label>
                  <Input
                    type="email"
                    value={overrideEmail}
                    onChange={(e) => setOverrideEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your Password</Label>
                  <Input
                    type="password"
                    value={overridePassword}
                    onChange={(e) => setOverridePassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverridePaper(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleOverrideSubmit}
              disabled={overrideLoading}
            >
              {overrideLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Override Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
