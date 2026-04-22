import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  FileText,
  AlignLeft,
  FileX,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Pencil,
  ShieldAlert,
  CheckCircle,
  Clock,
  XCircle,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { PaperTimeline } from "@/components/PaperTimeline";
import DOMPurify from "dompurify";

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

interface PaperVersion {
  id: string;
  paper_id: string;
  version_number: number;
  version_label: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

interface DecisionHistoryEntry {
  role_type: "reviewer" | "sub_editor" | "chief_editor";
  decision: string;
  comments: string;
  confidential_comments?: string;
  decided_at: string;
  username: string;
  version_number: number | null;
}

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

const OVERRIDE_STATUSES = ["accepted", "rejected", "pending_revision"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CEPaperViewPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const paper = location.state?.paper as Paper | undefined;

  // Versions
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PaperVersion | null>(
    null,
  );
  const [versionsLoading, setVersionsLoading] = useState(true);

  // Document viewer
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);

  // Decision history
  const [decisionHistory, setDecisionHistory] = useState<
    DecisionHistoryEntry[]
  >([]);

  // Status log
  const [statusLog, setStatusLog] = useState<any[]>([]);

  // Local paper state (for live edits)
  const [localPaper, setLocalPaper] = useState<Paper | undefined>(paper);

  // CE edit metadata
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAbstract, setEditingAbstract] = useState(false);
  const [titleValue, setTitleValue] = useState(paper?.title || "");
  const [abstractValue, setAbstractValue] = useState(paper?.abstract || "");
  const [savingMeta, setSavingMeta] = useState(false);

  // CE decision
  const [ceDecisionModalOpen, setCeDecisionModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<
    "accepted" | "revision" | "rejected" | null
  >(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionEmail, setDecisionEmail] = useState("");
  const [decisionPassword, setDecisionPassword] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [paperDecided, setPaperDecided] = useState(false);

  // Override
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overridePassword, setOverridePassword] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (paper) {
      setLocalPaper(paper);
      setTitleValue(paper.title);
      setAbstractValue(paper.abstract || "");
      setPaperDecided(
        ["accepted", "rejected", "published"].includes(paper.status),
      );
    }
  }, []);

  // Fetch versions
  useEffect(() => {
    if (!paperId || !token) return;
    setVersionsLoading(true);
    fetch(`${url}/paper-versions/getPaperVersions/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.versions) {
          const sorted = [...d.versions].sort(
            (a, b) => a.version_number - b.version_number,
          );
          setVersions(sorted);
          const current =
            sorted.find(
              (v) => v.version_number === paper?.current_version_number,
            ) || sorted[sorted.length - 1];
          setSelectedVersion(current || null);
        }
      })
      .catch(() => {})
      .finally(() => setVersionsLoading(false));
  }, [paperId, token]);

  // Reset view mode when version changes
  useEffect(() => {
    setHtmlContent(null);
    setViewMode("pdf");
  }, [selectedVersion?.id]);

  // Fetch HTML for text view or when viewing a DOCX/LaTeX in "pdf" (Document) mode
  useEffect(() => {
    const fileUrl = selectedVersion?.file_url || paper?.file_url;
    const ext = fileUrl?.split(".").pop()?.toLowerCase();
    const needsHtml =
      viewMode === "text" ||
      (viewMode === "pdf" &&
        (ext === "docx" || ext === "tex" || ext === "latex"));
    if (!needsHtml || !paperId) return;
    const versionId = selectedVersion?.id;
    if (!versionId) return;
    setHtmlLoading(true);
    fetch(`${url}/papers/${paperId}/version/${versionId}/html`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setHtmlContent(d.success && d.html ? d.html : null))
      .catch(() => setHtmlContent(null))
      .finally(() => setHtmlLoading(false));
  }, [viewMode, selectedVersion?.id]);

  // Fetch decision history
  useEffect(() => {
    if (!paperId || !token) return;
    fetch(`${url}/chiefEditor/papers/${paperId}/decision-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDecisionHistory(d.history || []);
        console.log(d.history);
      })
      .catch(() => {});
  }, [paperId, token]);

  // Fetch status log
  useEffect(() => {
    if (!paperId || !token) return;
    fetch(`${url}/papers/${paperId}/status-log`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStatusLog(d.log || []);
      })
      .catch(() => {});
  }, [paperId, token]);

  const saveMetadata = async (field: "title" | "abstract", value: string) => {
    if (!paperId) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`${url}/papers/${paperId}/edit-metadata`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");
      toast({
        title: "Saved",
        description: `${field === "title" ? "Title" : "Abstract"} updated.`,
      });
      if (field === "title") {
        setEditingTitle(false);
        setLocalPaper((prev) => (prev ? { ...prev, title: value } : prev));
      }
      if (field === "abstract") {
        setEditingAbstract(false);
        setLocalPaper((prev) => (prev ? { ...prev, abstract: value } : prev));
      }
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingMeta(false);
    }
  };

  const openDecisionModal = (
    decision: "accepted" | "revision" | "rejected",
  ) => {
    setPendingDecision(decision);
    setDecisionNote("");
    setDecisionEmail("");
    setDecisionPassword("");
    setCeDecisionModalOpen(true);
  };

  const submitCEDecision = async () => {
    if (!pendingDecision || !decisionEmail || !decisionPassword) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (pendingDecision !== "accepted" && !decisionNote.trim()) {
      toast({
        title: "Decision notes required for revision/rejection",
        variant: "destructive",
      });
      return;
    }
    setSubmittingDecision(true);
    try {
      const res = await fetch(`${url}/chiefEditor/decide/${paperId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision: pendingDecision,
          decision_note: decisionNote,
          email: decisionEmail,
          password: decisionPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({
        title: "Decision saved",
        description: "The editor decision has been submitted.",
      });
      setCeDecisionModalOpen(false);
      setPaperDecided(true);
      setLocalPaper((prev) =>
        prev
          ? {
              ...prev,
              status:
                pendingDecision === "revision"
                  ? "pending_revision"
                  : pendingDecision,
            }
          : prev,
      );
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const submitOverride = async () => {
    if (
      !overrideStatus ||
      !overrideReason ||
      !overrideEmail ||
      !overridePassword
    ) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await fetch(
        `${url}/chiefEditor/papers/${paperId}/override-status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
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
        description: `Status updated to "${overrideStatus.replace(/_/g, " ")}"`,
      });
      setOverrideOpen(false);
      setLocalPaper((prev) =>
        prev ? { ...prev, status: overrideStatus } : prev,
      );
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setOverrideLoading(false);
    }
  };

  if (!paper) {
    return (
      <DashboardLayout role="chief_editor" userName={user?.username}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">
            Paper not found. Please go back and try again.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/chief-editor/papers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Papers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const displayPaper = localPaper || paper;
  const displayFileUrl = selectedVersion?.file_url || paper.file_url;
  const reviewerHistory = decisionHistory.filter(
    (h) => h.role_type === "reviewer",
  );
  const aeHistory = decisionHistory.filter((h) => h.role_type === "sub_editor");
  const canMakeDecision =
    !paperDecided &&
    !["published", "rejected", "accepted"].includes(displayPaper?.status || "");

  return (
    <DashboardLayout role="chief_editor" userName={user?.username}>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span>/</span>
            <button
              className="hover:underline"
              onClick={() => navigate("/chief-editor/papers")}
            >
              Papers
            </button>
            <span>/</span>
            <span className="truncate max-w-[200px] text-foreground">
              {displayPaper.title}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {displayPaper.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {displayPaper.journal_name}
                {displayPaper.issue_label && ` · ${displayPaper.issue_label}`}
              </p>
            </div>
            <Badge
              className={`shrink-0 ${STATUS_COLORS[displayPaper.status] || "bg-muted text-muted-foreground"}`}
            >
              {displayPaper.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
          {/* LEFT: Document viewer */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-3 space-y-3">
              {/* PDF/Text toggle + zoom controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("pdf")}
                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                      viewMode === "pdf"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {(() => {
                      const _ext = displayFileUrl
                        ?.split(".")
                        .pop()
                        ?.toLowerCase();
                      if (_ext === "docx") return "Document";
                      if (_ext === "tex" || _ext === "latex") return "LaTeX";
                      return "PDF";
                    })()}
                  </button>
                  <button
                    onClick={() => setViewMode("text")}
                    className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                      viewMode === "text"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    Text
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {viewMode === "pdf" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))}
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground w-10 text-center">
                        {pdfZoom}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setPdfZoom(100)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {displayFileUrl && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          window.open(`${url}${displayFileUrl}`, "_blank")
                        }
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = `${url}${displayFileUrl}`;
                          a.download = displayPaper.title;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Version selector */}
              {!versionsLoading && versions.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground shrink-0">
                    Version:
                  </span>
                  <Select
                    value={selectedVersion?.id ?? ""}
                    onValueChange={(val) => {
                      const v = versions.find((v) => v.id === val);
                      if (v) setSelectedVersion(v);
                    }}
                  >
                    <SelectTrigger className="h-8 w-52 text-xs">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          v{v.version_number}
                          {v.version_number === paper.current_version_number
                            ? " (current)"
                            : ""}
                          {" — "}
                          {formatDate(v.created_at)}
                          {v.version_label ? ` · ${v.version_label}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {/* Old version banner */}
              {selectedVersion &&
                selectedVersion.version_number !==
                  paper.current_version_number && (
                  <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      You are viewing{" "}
                      <span className="font-semibold">
                        v{selectedVersion.version_number}
                      </span>{" "}
                      — this is not the current version.
                    </p>
                    <button
                      className="text-xs text-amber-700 dark:text-amber-300 underline shrink-0"
                      onClick={() => {
                        const current =
                          versions.find(
                            (v) =>
                              v.version_number === paper.current_version_number,
                          ) || versions[versions.length - 1];
                        if (current) setSelectedVersion(current);
                      }}
                    >
                      Switch to v{paper.current_version_number}
                    </button>
                  </div>
                )}
              <div className="aspect-[3/4] bg-muted/30 relative overflow-hidden">
                {viewMode === "pdf" ? (
                  (() => {
                    const ext = displayFileUrl?.split(".").pop()?.toLowerCase();
                    const isLatex = ext === "tex" || ext === "latex";
                    if (ext === "docx" || isLatex) {
                      return (
                        <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
                          {htmlLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                  Converting document...
                                </p>
                              </div>
                            </div>
                          ) : htmlContent ? (
                            <div className="max-w-[700px] mx-auto px-8 py-10">
                              {isLatex && (
                                <div className="flex justify-end mb-4">
                                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded font-mono">
                                    LaTeX Source
                                  </span>
                                </div>
                              )}
                              <div className="mb-8 pb-6 border-b">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                                  {displayPaper.title}
                                </h1>
                                {displayPaper.abstract && (
                                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Abstract
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {displayPaper.abstract}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div
                                className={
                                  isLatex
                                    ? "paper-webview-content latex-content"
                                    : "paper-webview-content"
                                }
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(htmlContent),
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center p-8">
                                <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm font-medium">
                                  Document preview unavailable
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Could not convert this document.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (!displayFileUrl) {
                      return (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <FileX className="h-10 w-10" />
                          <p className="text-sm mt-2">No file available</p>
                        </div>
                      );
                    }
                    return (
                      <iframe
                        src={`${url}${displayFileUrl}#view=FitH`}
                        className="w-full h-full border-0"
                        style={{
                          transform: `scale(${pdfZoom / 100})`,
                          transformOrigin: "top center",
                        }}
                        title="Paper PDF"
                      />
                    );
                  })()
                ) : (
                  <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
                    {htmlLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Converting document...
                          </p>
                        </div>
                      </div>
                    ) : htmlContent ? (
                      <div className="max-w-[700px] mx-auto px-8 py-10">
                        <div className="mb-8 pb-6 border-b">
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                            {displayPaper.title}
                          </h1>
                          {displayPaper.abstract && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Abstract
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {displayPaper.abstract}
                              </p>
                            </div>
                          )}
                        </div>
                        <div
                          className="paper-webview-content"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(htmlContent),
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm font-medium">
                            Text view unavailable
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Could not convert this document to text.
                          </p>
                          <button
                            onClick={() => setViewMode("pdf")}
                            className="mt-3 text-xs text-primary underline"
                          >
                            Switch to PDF view
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Paper info + decisions */}
          <div className="space-y-4">
            {/* Metadata */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Paper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {/* Editable title */}
                <div>
                  {!editingTitle ? (
                    <div className="flex items-start gap-2">
                      <p className="font-semibold text-base leading-snug flex-1">
                        {displayPaper.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => {
                          setEditingTitle(true);
                          setTitleValue(displayPaper.title);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        className="w-full font-semibold text-base border rounded p-2 bg-background"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Changes are logged in the audit trail
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={savingMeta}
                          onClick={() => saveMetadata("title", titleValue)}
                        >
                          {savingMeta && (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTitle(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editable abstract */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Abstract
                    </p>
                    {!editingAbstract && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => {
                          setEditingAbstract(true);
                          setAbstractValue(displayPaper.abstract || "");
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {!editingAbstract ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displayPaper.abstract || (
                        <span className="italic">No abstract</span>
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={abstractValue}
                        onChange={(e) => setAbstractValue(e.target.value)}
                        rows={5}
                        className="w-full text-sm border rounded p-2 bg-background resize-y"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={savingMeta}
                          onClick={() =>
                            saveMetadata("abstract", abstractValue)
                          }
                        >
                          {savingMeta && (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAbstract(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Author
                    </p>
                    <p className="font-medium">
                      {displayPaper.author_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Journal
                    </p>
                    <p className="font-medium">{displayPaper.journal_name}</p>
                  </div>
                  {displayPaper.issue_label && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Issue
                      </p>
                      <p className="font-medium">{displayPaper.issue_label}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Submitted
                    </p>
                    <p className="font-medium">
                      {displayPaper.submitted_at
                        ? formatDate(displayPaper.submitted_at)
                        : "—"}
                    </p>
                  </div>
                  {displayPaper.accepted_at && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Accepted
                      </p>
                      <p className="font-medium">
                        {formatDate(displayPaper.accepted_at)}
                      </p>
                    </div>
                  )}
                  {displayPaper.published_at && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Published
                      </p>
                      <p className="font-medium">
                        {formatDate(displayPaper.published_at)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AE + Reviewer Feedback */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Editorial Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {/* AE info */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Associate Editor
                  </p>
                  <p className="font-medium">
                    {displayPaper.current_ae_name || "Unassigned"}
                  </p>
                  {aeHistory.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {aeHistory.map((ae, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-border/50 p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-xs">{ae.username}</p>
                            {ae.version_number && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                v{ae.version_number}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={`text-[10px] h-4 px-1.5 ${
                              AE_DECISION_COLORS[ae.decision] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ae.decision}
                          </Badge>
                          {ae.comments ? (
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              "{ae.comments}"
                            </p>
                          ) : ae.decision !== "approve" ? (
                            <p className="text-xs text-muted-foreground italic">
                              No comment provided
                            </p>
                          ) : null}
                          {ae.decided_at && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(ae.decided_at)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : displayPaper.ae_decision ? (
                    <div className="mt-1.5">
                      <Badge
                        className={
                          AE_DECISION_COLORS[displayPaper.ae_decision] ||
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {displayPaper.ae_decision}
                      </Badge>
                    </div>
                  ) : null}
                </div>

                {/* Reviewer feedback from decision history */}
                {reviewerHistory.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Reviewer Feedback
                    </p>
                    <div className="space-y-3">
                      {reviewerHistory.map((r, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-border/50 p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-xs">
                              Reviewer {i + 1} — {r.username}
                            </p>
                            {r.version_number && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                v{r.version_number}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={`text-[10px] h-4 px-1.5 ${
                              r.decision === "accepted"
                                ? "bg-green-500/10 text-green-600 border-green-500/30"
                                : r.decision?.includes("revision")
                                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                                  : "bg-red-500/10 text-red-600 border-red-500/30"
                            }`}
                          >
                            {r.decision}
                          </Badge>
                          {r.comments && (
                            <div className="bg-muted/40 rounded p-2 mt-1">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">
                                <MessageSquare className="h-2.5 w-2.5" />
                                Comments for Authors
                              </p>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                {r.comments}
                              </p>
                            </div>
                          )}
                          {r.confidential_comments && (
                            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded p-2 mt-1">
                              <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mb-0.5 flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" /> Confidential — Editors Only
                              </p>
                              <p className="text-xs text-purple-900 dark:text-purple-100 leading-relaxed whitespace-pre-wrap">
                                {r.confidential_comments}
                              </p>
                            </div>
                          )}
                          {r.decided_at && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(r.decided_at)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback: show basic reviewer list if no detailed history */}
                {reviewerHistory.length === 0 &&
                  displayPaper.reviewers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Reviewers
                      </p>
                      <div className="space-y-1">
                        {displayPaper.reviewers.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="font-medium">{r.name}</span>
                            <span className="text-muted-foreground capitalize">
                              {r.status}
                              {r.decision ? ` · ${r.decision}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* CE Decision */}
            {canMakeDecision && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Chief Editor Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Make a final decision on this paper. Credential verification
                    is required.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openDecisionModal("accepted")}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                      onClick={() => openDecisionModal("revision")}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Request Revision
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => openDecisionModal("rejected")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {paperDecided && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4 text-sm text-green-700 dark:text-green-300">
                  A decision has already been submitted for this paper.
                </CardContent>
              </Card>
            )}

            {/* Override */}
            {displayPaper.status !== "published" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive border-destructive/50"
                onClick={() => {
                  setOverrideStatus(displayPaper.status);
                  setOverrideReason("");
                  setOverrideEmail("");
                  setOverridePassword("");
                  setOverrideOpen(true);
                }}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Override Status
              </Button>
            )}

            {/* Status Timeline */}
            {statusLog.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaperTimeline
                    events={statusLog.map((l, i) => ({
                      id: l.id || String(i),
                      status: l.status,
                      date: formatDate(l.changed_at),
                      description: l.status.replace(/_/g, " "),
                      actor: l.changed_by_name
                        ? `${l.changed_by_name} (${l.changed_by_role?.replace(/_/g, " ")})`
                        : undefined,
                      isCurrent: i === statusLog.length - 1,
                    }))}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* CE Decision Confirmation Modal */}
      <Dialog
        open={ceDecisionModalOpen}
        onOpenChange={(open) => !open && setCeDecisionModalOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Decision</DialogTitle>
            <DialogDescription>
              {pendingDecision === "accepted"
                ? "Accept this paper for publication."
                : pendingDecision === "revision"
                  ? "Request revisions from the author."
                  : "Reject this paper."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {pendingDecision !== "accepted" && (
              <div className="space-y-2">
                <Label>Decision Notes (required)</Label>
                <Textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Explain the decision to the author..."
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Verify your credentials
              </p>
              <div className="space-y-2">
                <Label>Your Email</Label>
                <Input
                  type="email"
                  value={decisionEmail}
                  onChange={(e) => setDecisionEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Your Password</Label>
                <Input
                  type="password"
                  value={decisionPassword}
                  onChange={(e) => setDecisionPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCeDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCEDecision}
              disabled={submittingDecision}
              className={
                pendingDecision === "accepted"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : pendingDecision === "rejected"
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : ""
              }
            >
              {submittingDecision && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Confirm{" "}
              {pendingDecision === "accepted"
                ? "Acceptance"
                : pendingDecision === "revision"
                  ? "Revision Request"
                  : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Modal */}
      <Dialog
        open={overrideOpen}
        onOpenChange={(open) => !open && setOverrideOpen(false)}
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
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium line-clamp-2">{displayPaper.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current: {displayPaper.status.replace(/_/g, " ")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitOverride}
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
