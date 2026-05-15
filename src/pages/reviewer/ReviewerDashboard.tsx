import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SignatureModal } from "@/components/SignatureModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ReviewCommentDisplay } from "@/components/ReviewCommentDisplay";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronRight,
  Eye,
  Send,
  Star,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ArrowLeft,
  AlignLeft,
  FileX,
  BookOpen,
  Info,
  X,
  User,
} from "lucide-react";
import DOMPurify from "dompurify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Paper {
  updated_at: any;
  review_submitted_at: any;
  paper_id: string;
  paper_version_id: string;
  title: string;
  paper_status: string;
  assignment_status: string;
  file_url: string;
  version?: string;
  version_number?: number;
  abstract?: string;
  category?: string;
  submittedDate?: string;
  dueDate?: string;
  review_decision?: string;
  comments?: string;
  ce_override?: boolean;
  journal_name?: string;
  journal_acronym?: string;
  issue_label?: string;
  ae_name?: string;
}

export default function ReviewerDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [completedReviews, setCompletedReviews] = useState<Paper[]>([]);
  const [showReviewerHint, setShowReviewerHint] = useState(
    () => !localStorage.getItem("hint_dismissed_reviewer"),
  );
  const dismissReviewerHint = () => {
    localStorage.setItem("hint_dismissed_reviewer", "true");
    setShowReviewerHint(false);
  };
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [decision, setDecision] = useState<string>("");
  const [comments, setComments] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  // Version switcher
  const [versions, setVersions] = useState<
    {
      id: string;
      version_number: number;
      file_url: string;
      file_type: string;
      created_at: string;
    }[]
  >([]);
  const [selectedVersion, setSelectedVersion] = useState<{
    id: string;
    version_number: number;
    file_url: string;
    file_type: string;
    created_at: string;
  } | null>(null);

  const fetchPapers = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${url}/reviewer/getReviewerPapers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Failed to fetch papers:", result.message || result);
        return;
      }

      const allPapers: Paper[] = result.papers || [];

      const pending = allPapers.filter(
        (paper) => paper.assignment_status === "assigned",
      );

      const formattedPending: Paper[] = pending.map((paper) => ({
        ...paper,
        abstract: paper.abstract || "Abstract not available",
        category: paper.category || "Uncategorized",
        submittedDate:
          paper.submittedDate || new Date().toISOString().split("T")[0],
        // dueDate:
        //   paper.dueDate ||
        //   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        //     .toISOString()
        //     .split("T")[0],
        version: paper.version_number ? `v${paper.version_number}` : "v1",
      }));

      const completed: Paper[] = allPapers
        .filter((paper) =>
          ["submitted", "accepted", "rejected"].includes(
            paper.assignment_status,
          ),
        )
        .map((paper) => ({
          ...paper,
          abstract: paper.abstract || "Abstract not available",
          category: paper.category || "Uncategorized",
          version: paper.version_number ? `v${paper.version_number}` : "v1",
        }));

      setPapers(formattedPending);
      setCompletedReviews(completed);
    } catch (error) {
      console.error("Error fetching reviewer papers:", error);
      toast({
        title: "Error",
        description: "Could not fetch papers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const requiresSignature = [
    "accepted",
    "minor_revision",
    "major_revision",
    "rejected",
  ].includes(decision);

  const submitReview = async () => {
    if (!selectedPaper || !decision || !comments.trim()) {
      toast({
        title: "Incomplete",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (requiresSignature) {
      setSignatureModalOpen(true);
    } else {
      await handleReviewSubmission();
    }
  };

  const handleReviewSubmission = async (
    signature?: string,
    password?: string,
  ) => {
    if (!selectedPaper) return;

    try {
      const formData = new FormData();

      formData.append("decision", decision);
      formData.append("comments", comments);
      formData.append("confidentialComments", confidentialComments);

      if (requiresSignature) {
        if (!signature || !password) {
          toast({
            title: "Error",
            description: "Signature and password required",
            variant: "destructive",
          });
          return;
        }

        const signatureFile = base64ToFile(signature, "signature.png");

        formData.append("signature", signatureFile);
        formData.append("password", password);
      }

      const res = await fetch(
        `${url}/reviewer/submitReview/${selectedPaper.paper_version_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      if (!data.success) {
        if (data.errors && data.errors.length) {
          data.errors.forEach((err: any) => {
            toast({
              title: `Error in ${err.field.replace("body.", "")}`,
              description: err.message,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
        return;
      }

      if (!res.ok) {
        toast({
          title: "Failed",
          description: data.message || "Could not submit review",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      if (selectedPaper) {
        const completed = {
          ...selectedPaper,
          assignment_status: "completed",
          review_decision: decision,
        };
        setPapers((prev) =>
          prev.filter((p) => p.paper_id !== selectedPaper.paper_id),
        );
        setCompletedReviews((prev) => [completed, ...prev]);
      }
      resetForm();
      fetchPapers();
    } catch (err) {
      console.error("Submit review error:", err);
      toast({
        title: "Error",
        description: "Something went wrong while submitting review",
        variant: "destructive",
      });
    }
  };

  const handleSignatureConfirm = (signature: string, password: string) => {
    handleReviewSubmission(signature, password);
    setSignatureModalOpen(false);
  };

  const resetForm = () => {
    setSelectedPaper(null);
    setDecision("");
    setComments("");
    setConfidentialComments("");
    setRatings({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive bg-destructive/10";
      case "medium":
        return "text-warning bg-warning/10";
      case "low":
        return "text-success bg-success/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "under_review":
        return "under_review";
      case "pending_review":
        return "pending_review";
      case "review_submitted":
        return "review_submitted";
      default:
        return "pending_review";
    }
  };

  const getCompletedCount = () => completedReviews.length;

  const getPendingCount = () => papers.length;

  const getOverdueCount = () => {
    return papers.filter((p) => {
      if (!p.dueDate) return false;
      const daysLeft = getDaysUntilDue(p.dueDate);
      return daysLeft < 0 && p.assignment_status !== "completed";
    }).length;
  };

  // Fetch all versions when selected paper changes
  useEffect(() => {
    if (!selectedPaper) {
      setVersions([]);
      setSelectedVersion(null);
      return;
    }
    fetch(`${url}/paper-versions/getPaperVersions/${selectedPaper.paper_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.versions) {
          const sorted = [...d.versions].sort(
            (a, b) => a.version_number - b.version_number,
          );
          setVersions(sorted);
          // Default to the version the reviewer is assigned to review
          const current =
            sorted.find((v) => v.id === selectedPaper.paper_version_id) ||
            sorted[sorted.length - 1];
          setSelectedVersion(current || null);
        }
      })
      .catch(() => {});
  }, [selectedPaper?.paper_id]);

  // Auto-switch to text view for docx based on selected version
  useEffect(() => {
    setHtmlContent(null);
    setViewMode("pdf");
  }, [selectedPaper?.paper_id, selectedVersion?.id]);

  // Fetch HTML when switching to text view or when viewing a DOCX in "pdf" (Document) mode
  useEffect(() => {
    const fileUrl = selectedVersion?.file_url || selectedPaper?.file_url;
    const ext = fileUrl?.split(".").pop()?.toLowerCase();
    const needsHtml =
      viewMode === "text" ||
      (viewMode === "pdf" &&
        (ext === "docx" || ext === "tex" || ext === "latex"));
    if (!needsHtml || !selectedPaper?.paper_id) return;
    const versionId = selectedVersion?.id ?? selectedPaper.paper_version_id;
    if (!versionId) return;
    setHtmlLoading(true);
    fetch(`${url}/papers/${selectedPaper.paper_id}/version/${versionId}/html`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setHtmlContent(d.success && d.html ? d.html : null))
      .catch(() => setHtmlContent(null))
      .finally(() => setHtmlLoading(false));
  }, [viewMode, selectedVersion?.id, selectedPaper?.paper_id]);

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="review-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={resetForm}
                className="h-10 w-10 p-0 bg-white"
              >
                <ArrowLeft className="h-5 w-5 text-black" />
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{selectedPaper.journal_name}</span>
                  {selectedPaper.issue_label && (
                    <>
                      <span>·</span>
                      <span>{selectedPaper.issue_label}</span>
                    </>
                  )}
                </div>
                <h1 className="font-serif-outfit text-2xl font-bold text-white">
                  {selectedPaper.title}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline">{selectedPaper.category}</Badge>
                  <Badge variant="secondary">{selectedPaper.version}</Badge>
                  {selectedPaper.ae_name && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      AE:{" "}
                      <span className="text-foreground">
                        {selectedPaper.ae_name}
                      </span>
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {selectedPaper.dueDate &&
                      `Due: ${new Date(selectedPaper.dueDate).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="border-b border-border/50 space-y-3">
                  {/* Version selector */}
                  {versions.length > 0 && (
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
                        <SelectTrigger className="h-8 w-48 text-xs">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((v) => (
                            <SelectItem
                              key={v.id}
                              value={v.id}
                              className="text-xs"
                            >
                              v{v.version_number}
                              {v.id === selectedPaper.paper_version_id
                                ? " (latest)"
                                : ""}
                              {" — "}
                              {new Date(v.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Paper Document
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* View mode toggle */}
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
                            const _rext = (
                              selectedVersion?.file_url ||
                              selectedPaper.file_url
                            )
                              ?.split(".")
                              .pop()
                              ?.toLowerCase();
                            if (_rext === "docx") return "Document";
                            if (_rext === "tex" || _rext === "latex")
                              return "LaTeX";
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
                      {viewMode === "pdf" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPdfZoom(Math.max(50, pdfZoom - 10))
                            }
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground w-12 text-center">
                            {pdfZoom}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPdfZoom(Math.min(200, pdfZoom + 10))
                            }
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPdfZoom(100)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            getFileUrl(selectedVersion?.file_url || selectedPaper.file_url),
                            "_blank",
                          )
                        }
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fileUrl = selectedVersion?.file_url || selectedPaper.file_url || "";
                          const ext = fileUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
                          const link = document.createElement("a");
                          link.href = getFileUrl(fileUrl);
                          link.download = ext ? `${selectedPaper.title}.${ext}` : selectedPaper.title;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Old version banner */}
                  {selectedVersion &&
                    selectedVersion.id !== selectedPaper.paper_version_id && (
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
                            const latest =
                              versions.find(
                                (v) => v.id === selectedPaper.paper_version_id,
                              ) || versions[versions.length - 1];
                            if (latest) setSelectedVersion(latest);
                          }}
                        >
                          Switch to v
                          {versions.find(
                            (v) => v.id === selectedPaper.paper_version_id,
                          )?.version_number ??
                            versions[versions.length - 1]?.version_number}
                        </button>
                      </div>
                    )}
                  <div className="aspect-[3/4] bg-muted/30 relative overflow-hidden">
                    {viewMode === "pdf" ? (
                      (() => {
                        const displayFileUrl =
                          selectedVersion?.file_url || selectedPaper.file_url;
                        const ext = displayFileUrl
                          ?.split(".")
                          .pop()
                          ?.toLowerCase();
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
                                      {selectedPaper.title}
                                    </h1>
                                    {selectedPaper.abstract && (
                                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                          Abstract
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                          {selectedPaper.abstract}
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
                                Converting document to text...
                              </p>
                            </div>
                          </div>
                        ) : htmlContent ? (
                          <div className="max-w-[700px] mx-auto px-8 py-10">
                            <div className="mb-8 pb-6 border-b">
                              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                                {selectedPaper.title}
                              </h1>
                              {selectedPaper.abstract && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Abstract
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {selectedPaper.abstract}
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
                                Could not convert this document to text format.
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

              {selectedPaper.ce_override ? (
                <Card className="glass-card border-0 bg-gradient-to-br from-red-900/20 to-red-800/10">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Status Locked by Chief Editor
                    </CardTitle>
                    <CardDescription>
                      The Chief Editor has overridden this paper's status. No
                      further reviews can be submitted.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : selectedPaper.assignment_status === "submitted" ? (
                <Card className="glass-card">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Review Submitted
                    </CardTitle>
                    <CardDescription>
                      You have already submitted a review for this paper.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Badge className="bg-success/10 text-success border-success/20 text-sm px-3 py-1">
                      Review Submitted
                    </Badge>

                    {selectedPaper.review_decision && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Your Decision
                        </Label>
                        <div
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border-2",
                            selectedPaper.review_decision === "accepted"
                              ? "border-success/50 bg-success/10"
                              : selectedPaper.review_decision?.includes(
                                    "revision",
                                  )
                                ? "border-warning/50 bg-warning/10"
                                : "border-destructive/50 bg-destructive/10",
                          )}
                        >
                          {selectedPaper.review_decision === "accepted" ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : selectedPaper.review_decision?.includes(
                              "revision",
                            ) ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <span className="font-medium capitalize">
                            {selectedPaper.review_decision.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedPaper.comments && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Comments Submitted</Label>
                        <ReviewCommentDisplay
                          comments={selectedPaper.comments}
                          showConfidential={false}
                        />
                      </div>
                    )}

                    {selectedPaper.review_submitted_at && (
                      <p className="text-xs text-muted-foreground">
                        Submitted on{" "}
                        {new Date(
                          selectedPaper.review_submitted_at,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-primary" />
                      Submit Review
                    </CardTitle>
                    <CardDescription>
                      Evaluate the paper based on the criteria below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <div className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Abstract
                          </Label>
                          <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                            {selectedPaper.abstract}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comments">
                            Comments for Authors *
                          </Label>
                          <RichTextEditor
                            value={comments}
                            onChange={setComments}
                            placeholder="Provide detailed feedback for the authors..."
                            minHeight="150px"
                          />
                          <p className="text-xs text-muted-foreground">
                            These comments will be shared with the authors.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confidentialComments">
                            Confidential Comments for Editors
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <RichTextEditor
                            value={confidentialComments}
                            onChange={setConfidentialComments}
                            placeholder="Add comments for the editorial team only — not visible to authors..."
                            minHeight="100px"
                          />
                          <p className="text-xs text-muted-foreground">
                            These comments are only visible to Associate Editor
                            and Chief Editor.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Label>Your Decision *</Label>
                          <RadioGroup
                            value={decision}
                            onValueChange={setDecision}
                          >
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                decision === "accepted"
                                  ? "border-success bg-success/10"
                                  : "border-border hover:border-success/50",
                              )}
                              onClick={() => setDecision("accepted")}
                            >
                              <RadioGroupItem value="accepted" id="accept" />
                              <CheckCircle2 className="h-5 w-5 text-success" />
                              <div className="flex-1">
                                <Label
                                  htmlFor="accept"
                                  className="cursor-pointer font-medium"
                                >
                                  Accept
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Paper is ready for publication
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                decision === "minor_revision"
                                  ? "border-info bg-info/10"
                                  : "border-border hover:border-info/50",
                              )}
                              onClick={() => setDecision("minor_revision")}
                            >
                              <RadioGroupItem
                                value="minor_revision"
                                id="minor"
                              />
                              <Edit3 className="h-5 w-5 text-info" />
                              <div className="flex-1">
                                <Label
                                  htmlFor="minor"
                                  className="cursor-pointer font-medium"
                                >
                                  Minor Revision
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Small changes needed
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                decision === "major_revision"
                                  ? "border-warning bg-warning/10"
                                  : "border-border hover:border-warning/50",
                              )}
                              onClick={() => setDecision("major_revision")}
                            >
                              <RadioGroupItem
                                value="major_revision"
                                id="major"
                              />
                              <AlertTriangle className="h-5 w-5 text-warning" />
                              <div className="flex-1">
                                <Label
                                  htmlFor="major"
                                  className="cursor-pointer font-medium"
                                >
                                  Major Revision
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Significant changes required
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                decision === "rejected"
                                  ? "border-destructive bg-destructive/10"
                                  : "border-border hover:border-destructive/50",
                              )}
                              onClick={() => setDecision("rejected")}
                            >
                              <RadioGroupItem value="rejected" id="reject" />
                              <XCircle className="h-5 w-5 text-destructive" />
                              <div className="flex-1">
                                <Label
                                  htmlFor="reject"
                                  className="cursor-pointer font-medium"
                                >
                                  Reject
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Paper does not meet standards
                                </p>
                              </div>
                            </motion.div>
                          </RadioGroup>
                        </div>

                        {selectedVersion &&
                        selectedVersion.id !==
                          selectedPaper.paper_version_id ? (
                          <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-center">
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                              You can only submit a review for the latest
                              version
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              Switch to v
                              {versions.find(
                                (v) => v.id === selectedPaper.paper_version_id,
                              )?.version_number ??
                                versions[versions.length - 1]
                                  ?.version_number}{" "}
                              to submit your review.
                            </p>
                          </div>
                        ) : (
                          <Button
                            onClick={submitReview}
                            disabled={!decision || !comments.trim()}
                            className="w-full btn-physics"
                            size="lg"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Review
                            {requiresSignature && " (Requires Signature)"}
                          </Button>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {showReviewerHint && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Getting Started
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You'll see assigned papers here once a Chief Editor or
                    Associate Editor assigns one to you. Review each paper
                    carefully and submit your decision.
                  </p>
                </div>
                <button
                  onClick={dismissReviewerHint}
                  className="text-blue-400 hover:text-blue-600 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div>
              <h1 className="font-serif-outfit text-3xl font-bold text-white">
                Reviewer Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review assigned papers and submit your evaluations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Pending Reviews",
                  value: getPendingCount(),
                  icon: Clock,
                  color: "text-warning",
                },
                {
                  label: "Completed",
                  value: getCompletedCount(),
                  icon: CheckCircle2,
                  color: "text-success",
                },
                // {
                //   label: "Overdue",
                //   value: getOverdueCount(),
                //   icon: AlertTriangle,
                //   color: "text-destructive",
                // },
                // {
                //   label: "Avg Response Time",
                //   value: "4.2 days",
                //   icon: Calendar,
                //   color: "text-info",
                // },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50",
                            stat.color,
                          )}
                        >
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="pending">
                  Pending Reviews ({getPendingCount()})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({getCompletedCount()})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {papers
                  .filter((p) => p.assignment_status !== "completed")
                  .map((paper, index) => {
                    const daysLeft = paper.dueDate
                      ? getDaysUntilDue(paper.dueDate)
                      : 14;
                    return (
                      <motion.div
                        key={paper.paper_version_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="glass-card hover:shadow-glow transition-all duration-300 cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {paper.journal_name
                                      ? `${paper.journal_name} • ${paper.paper_id}`
                                      : paper.paper_id}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {paper.version}
                                  </Badge>
                                </div>

                                <h3 className="font-serif-outfit text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                  {paper.title}
                                </h3>

                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {paper.abstract}
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    <span className="text-foreground font-medium">
                                      {paper.category}
                                    </span>
                                  </span>
                                  {paper.submittedDate && (
                                    <span className="text-muted-foreground">
                                      Submitted:{" "}
                                      {new Date(
                                        paper.submittedDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                {paper.dueDate && (
                                  <div
                                    className={cn(
                                      "text-sm font-medium px-3 py-1 rounded-full",
                                      daysLeft <= 3
                                        ? "bg-destructive/10 text-destructive"
                                        : daysLeft <= 7
                                          ? "bg-warning/10 text-warning"
                                          : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {daysLeft} days left
                                  </div>
                                )}

                                {/* <StatusBadge
                                  // status={getStatusBadge(paper.paper_status)}
                                /> */}

                                <Button
                                  onClick={() => setSelectedPaper(paper)}
                                  className="btn-physics"
                                >
                                  Start Review
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>

                            {/* Progress indicator */}
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">
                                  Review Progress
                                </span>
                                <span className="font-medium">0%</span>
                              </div>
                              <Progress value={0} className="h-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedReviews.map((review, index) => (
                  <motion.div
                    key={review.paper_version_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {review.journal_name
                                  ? `${review.journal_name} • ${review.paper_id}`
                                  : review.paper_id}
                              </Badge>
                              <Badge className="bg-success/10 text-success border-success/20">
                                Review Submitted
                              </Badge>
                            </div>
                            <h3 className="font-serif-outfit text-lg font-semibold">
                              {review.title}
                            </h3>
                            {review.review_submitted_at && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Submitted:{" "}
                                {new Date(
                                  review.review_submitted_at,
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {review.review_decision && (
                              <p className="text-sm mt-1">
                                Decision:{" "}
                                <span className="font-medium capitalize">
                                  {review.review_decision.replace("_", " ")}
                                </span>
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPaper(review)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Submission
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        paperTitle={selectedPaper?.title || ""}
        decision={decision === "rejected" ? "reject" : "accept"}
      />
    </DashboardLayout>
  );
}
