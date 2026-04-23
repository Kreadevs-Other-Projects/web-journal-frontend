import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import {
  FileText,
  Calendar,
  Eye,
  Star,
  Filter,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import DOMPurify from "dompurify";
import { useToast } from "@/hooks/use-toast";

interface SubmittedReview {
  paperId: string;
  reviewId: string;
  title: string;
  comments: string;
  decision: string;
  assignmentStatus: string;
  fileUrl: string;
  versionNumber: number;
  versionCreatedAt: string;
  paperStatus: string;
  reviewerId: string;
  reviewerName: string;
  subEditorName: string;
  submittedAt: string;
}

const ITEMS_PER_PAGE = 5;

export default function ChiefEditorSubmittedReviews() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<SubmittedReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<SubmittedReview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPdf, setViewPdf] = useState<SubmittedReview | null>(null);
  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const [viewerHtmlLoading, setViewerHtmlLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [cEModalOpen, setCEModalOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [cePendingDecision, setCePendingDecision] = useState<
    "accepted" | "revision" | "rejected" | null
  >(null);
  const [ceDecisionNote, setCeDecisionNote] = useState("");
  const [ceConfirmEmail, setCeConfirmEmail] = useState("");
  const [ceConfirmPassword, setCeConfirmPassword] = useState("");
  const [paperDecisions, setPaperDecisions] = useState<
    Record<
      string,
      { decision: string; decision_note: string; decided_at: string }
    >
  >({});

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${url}/chiefEditor/getSubmittedReviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          const mapped = data.data.map((r: any) => ({
            paperId: r.paper_id,
            reviewId: r.review_id,
            title: r.title,
            comments: r.sub_editor_comments,
            decision: r.sub_editor_decision,
            assignmentStatus: r.assignment_status,
            fileUrl: r.file_url,
            versionNumber: r.version_number,
            versionCreatedAt: r.version_created_at,
            paperStatus: r.paper_status,
            reviewerId: r.reviewer_id,
            reviewerName: r.reviewer_name || "",
            subEditorName: r.sub_editor_name || "",
            submittedAt: r.submitted_at,
          }));
          setReviews(mapped);
          setFilteredReviews(mapped);
          const decided: Record<
            string,
            { decision: string; decision_note: string; decided_at: string }
          > = {};
          mapped.forEach((r: any) => {
            if (
              ["accepted", "rejected", "pending_revision"].includes(
                r.paperStatus,
              ) &&
              !decided[r.paperId]
            ) {
              decided[r.paperId] = {
                decision: r.paperStatus,
                decision_note: "",
                decided_at: "",
              };
            }
          });
          setPaperDecisions(decided);
        } else {
          throw new Error("Failed to fetch reviews");
        }
      } catch (err) {
        console.error("Error fetching submitted reviews:", err);
        toast({
          title: "Error",
          description: "Unable to load submitted reviews.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  useEffect(() => {
    let filtered = reviews;

    if (searchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.comments?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.paperId.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((review) => review.paperStatus === activeTab);
    }

    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, searchQuery, activeTab]);

  useEffect(() => {
    setViewerHtml(null);
    if (!viewPdf?.fileUrl) return;
    const ext = viewPdf.fileUrl.split(".").pop()?.toLowerCase();
    if (ext !== "docx") return;
    setViewerHtmlLoading(true);
    const fetchHtml = async () => {
      try {
        const r = await fetch(`${url}/browse/paper/${viewPdf.paperId}/html`);
        const d = await r.json();
        if (d.success && d.html) setViewerHtml(d.html);
      } catch (_) {
      } finally {
        setViewerHtmlLoading(false);
      }
    };
    fetchHtml();
  }, [viewPdf?.paperId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending_revision":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "resubmitted":
        return <RotateCcw className="h-4 w-4 text-cyan-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20";
      case "pending_revision":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20";
      case "published":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "resubmitted":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "accept":
        return "text-green-600 dark:text-green-400";
      case "reject":
        return "text-red-600 dark:text-red-400";
      case "pending_revision":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-muted-foreground";
    }
  };

  const openCEModal = (
    paperId: string,
    decision: "accepted" | "revision" | "rejected",
  ) => {
    setSelectedPaperId(paperId);
    setCePendingDecision(decision);
    setCeDecisionNote("");
    setCeConfirmEmail("");
    setCeConfirmPassword("");
    setCEModalOpen(true);
  };

  const submitCEDecision = async () => {
    if (cePendingDecision !== "accepted" && !ceDecisionNote.trim()) {
      toast({
        title: "Notes required",
        description: "Decision notes are required for revision/rejection.",
        variant: "destructive",
      });
      return;
    }
    if (!ceConfirmEmail || !ceConfirmPassword) {
      toast({
        title: "Credentials required",
        description:
          "Email and password are required to confirm this decision.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${url}/chiefEditor/decide/${selectedPaperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: cePendingDecision,
          decision_note: ceDecisionNote,
          email: ceConfirmEmail,
          password: ceConfirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          toast({
            title: "Validation Error",
            description: data.errors
              .map((e: { message: string }) => e.message)
              .join(", "),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to save decision",
            description: data.message || "An error occurred while saving.",
            variant: "destructive",
          });
        }
        return;
      }

      setPaperDecisions((prev) => ({
        ...prev,
        [selectedPaperId!]: {
          decision: cePendingDecision!,
          decision_note: ceDecisionNote,
          decided_at: new Date().toISOString(),
        },
      }));
      setCEModalOpen(false);
      toast({
        title: "Decision saved",
        description: "The editor decision has been submitted successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Unable to save decision. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageReviews = filteredReviews.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const getTabCount = (status: string) => {
    if (status === "all") return reviews.length;
    return reviews.filter((r) => r.paperStatus === status).length;
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Submitted Reviews
              </h1>
              <p className="text-muted-foreground">
                Manage and make decisions on reviewer submissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-9 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-6 lg:w-fit bg-muted/50 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  All Reviews
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("all")}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="pending_revision"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon("pending_revision")}
                  Pending Revision
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("pending_revision")}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="resubmitted"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon("resubmitted")}
                  Resubmitted
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("resubmitted")}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="accepted"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon("accepted")}
                  Accepted
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("accepted")}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon("rejected")}
                  Rejected
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("rejected")}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="published"
                className="data-[state=active]:bg-background"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon("published")}
                  Published
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount("published")}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {currentPageReviews.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No reviews found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No reviews match your search criteria."
                      : `No ${activeTab !== "all" ? activeTab.replace("_", " ") : ""} reviews available.`}
                  </p>
                  {(searchQuery || activeTab !== "all") && (
                    <Button
                      variant="ghost"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPageReviews.map((review) => (
                    <motion.div
                      key={review.reviewId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="glass-card hover:shadow-glow transition-all duration-300 border-l-4 border-l-primary/50">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    ID: {review.paperId}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusColor(review.paperStatus)}`}
                                  >
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(review.paperStatus)}
                                      {review.paperStatus.replace("_", " ")}
                                    </span>
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    v{review.versionNumber}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Sub Editor: {review.subEditorName || "—"}
                                </div>
                              </div>

                              <h3 className="font-semibold text-lg text-foreground mb-3">
                                {review.title}
                              </h3>

                              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                <p className="text-sm text-foreground">
                                  <span className="font-semibold">
                                    Sub Editor Comments:
                                  </span>{" "}
                                  {review.comments || "No comments provided"}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 mr-2" />
                                  Submitted:{" "}
                                  {new Date(
                                    review.submittedAt,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                                <div
                                  className={`flex items-center ${getDecisionColor(review.decision)}`}
                                >
                                  <Star className="h-3.5 w-3.5 mr-2" />
                                  Reviewer Decision:{" "}
                                  <span className="font-semibold ml-1">
                                    {review.decision}
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  Version created:{" "}
                                  {new Date(
                                    review.versionCreatedAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="lg:w-56 flex flex-col gap-3">
                              <div className="flex gap-2">
                                {review.fileUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setViewPdf(review)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Paper
                                  </Button>
                                )}
                              </div>

                              {(() => {
                                const decided = paperDecisions[review.paperId];
                                if (review.paperStatus === "published") {
                                  return (
                                    <div className="flex flex-col gap-1 text-center">
                                      {["Decision Made", "Published"].map(
                                        (label) => (
                                          <Badge
                                            key={label}
                                            className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                                          >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {label}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  );
                                }
                                if (decided) {
                                  return (
                                    <div className="mt-1 p-3 bg-muted rounded-lg border">
                                      <p className="text-sm font-semibold">
                                        Final Decision:{" "}
                                        {decided.decision.replace("_", " ")}
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {decided.decision_note ||
                                          "No notes added"}
                                      </p>
                                      {decided.decided_at && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Decided on{" "}
                                          {new Date(
                                            decided.decided_at,
                                          ).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() =>
                                        openCEModal(review.paperId, "accepted")
                                      }
                                    >
                                      Accept Paper
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                      onClick={() =>
                                        openCEModal(review.paperId, "revision")
                                      }
                                    >
                                      Request Revision
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        openCEModal(review.paperId, "rejected")
                                      }
                                    >
                                      Reject Paper
                                    </Button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {filteredReviews.length > 0 && (
                <>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(
                        startIndex + ITEMS_PER_PAGE,
                        filteredReviews.length,
                      )}{" "}
                      of {filteredReviews.length} reviews
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((num) => (
                          <Button
                            key={num}
                            variant={
                              currentPage === num ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(num)}
                            className={`w-10 ${currentPage === num ? "bg-primary text-primary-foreground" : "text-foreground border-border hover:bg-muted"}`}
                          >
                            {num}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {viewPdf && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[90vh] rounded-lg relative overflow-hidden shadow-2xl">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={() => setViewPdf(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary/90 backdrop-blur-sm"
                    onClick={() =>
                      window.open(getFileUrl(viewPdf.fileUrl), "_blank")
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                {(() => {
                  const ext = viewPdf.fileUrl?.split(".").pop()?.toLowerCase();
                  if (ext === "pdf") {
                    return (
                      <Worker workerUrl="/pdf.worker.min.js">
                        <div className="h-full">
                          <Viewer fileUrl={getFileUrl(viewPdf.fileUrl)} />
                        </div>
                      </Worker>
                    );
                  }
                  if (ext === "tex" || ext === "latex") {
                    return (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p className="text-sm text-muted-foreground">
                          LaTeX files cannot be previewed. Please download to
                          view.
                        </p>
                        <Button
                          onClick={() =>
                            window.open(getFileUrl(viewPdf.fileUrl), "_blank")
                          }
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Manuscript
                        </Button>
                      </div>
                    );
                  }
                  if (viewerHtmlLoading) {
                    return (
                      <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading document…
                      </div>
                    );
                  }
                  if (viewerHtml) {
                    return (
                      <div
                        className="paper-content h-full overflow-y-auto p-6"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(viewerHtml),
                        }}
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <p className="text-sm text-muted-foreground">
                        Document preview not available.
                      </p>
                      <Button
                        onClick={() =>
                          window.open(getFileUrl(viewPdf.fileUrl), "_blank")
                        }
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <Dialog open={cEModalOpen} onOpenChange={setCEModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {cePendingDecision === "accepted"
                    ? "Accept Paper"
                    : cePendingDecision === "revision"
                      ? "Request Revision"
                      : "Reject Paper"}
                </DialogTitle>
                <DialogDescription>
                  This decision is final and cannot be changed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Decision Notes{" "}
                    <span className="text-muted-foreground text-xs">
                      {cePendingDecision !== "accepted"
                        ? "(required)"
                        : "(optional)"}
                    </span>
                  </label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md min-h-[100px] bg-background"
                    placeholder={
                      cePendingDecision === "accepted"
                        ? "Add any notes for the editorial team..."
                        : cePendingDecision === "revision"
                          ? "Explain what revisions are required..."
                          : "Provide detailed rejection reason..."
                    }
                    value={ceDecisionNote}
                    onChange={(e) => setCeDecisionNote(e.target.value)}
                  />
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-3">
                    VERIFY YOUR IDENTITY
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Your Email</label>
                      <Input
                        type="email"
                        className="mt-1"
                        placeholder="your@email.com"
                        value={ceConfirmEmail}
                        onChange={(e) => setCeConfirmEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Your Password
                      </label>
                      <Input
                        type="password"
                        className="mt-1"
                        value={ceConfirmPassword}
                        onChange={(e) => setCeConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setCEModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitCEDecision}
                    className={
                      cePendingDecision === "accepted"
                        ? "bg-green-600 hover:bg-green-700"
                        : cePendingDecision === "revision"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-red-600 hover:bg-red-700"
                    }
                  >
                    Confirm{" "}
                    {cePendingDecision === "accepted"
                      ? "Acceptance"
                      : cePendingDecision === "revision"
                        ? "Revision Request"
                        : "Rejection"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
