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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  X,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Paper {
  paperId: string;
  title: string;
  journalId: string;
  issueId: string;
  paperStatus: string;
  submittedAt: string | null;
  acceptedAt: string | null;
  authorName: string | null;
  journalName: string | null;
  journalAcronym: string | null;
  issueLabel: string | null;
  aeName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  reviewerNames: string[];
  doi: string | null;
}

const ACCEPTED_STATUSES = new Set([
  "accepted",
  "awaiting_payment",
  "payment_review",
  "ready_for_publication",
]);

type StatusFilter = "accepted" | "published";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PublisherPapersDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepted");

  const [viewPaper, setViewPaper] = useState<Paper | null>(null);

  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [openPublish, setOpenPublish] = useState(false);
  const [doi, setDoi] = useState("");
  const [doiLoading, setDoiLoading] = useState(false);
  const [publishYear, setPublishYear] = useState<number>(new Date().getFullYear());
  const [publishing, setPublishing] = useState(false);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/publication/getSubmittedReviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const normalized = (data.data as any[]).map((p) => ({
          ...p,
          reviewerNames: Array.isArray(p.reviewerNames) ? p.reviewerNames : [],
        }));
        setPapers(normalized);
      } else {
        throw new Error("Failed to fetch papers");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load papers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublish = async (paper: Paper) => {
    setSelectedPaper(paper);
    setDoi("");
    // Extract year from issue label (e.g. "Vol 1, Issue 1 (2026)" → 2026)
    const yearMatch = paper.issueLabel?.match(/\b(20\d{2}|19\d{2})\b/);
    setPublishYear(yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear());
    setOpenPublish(true);

    try {
      setDoiLoading(true);
      const res = await fetch(`${url}/papers/${paper.paperId}/suggest-doi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.doi) {
        setDoi(data.doi);
      }
    } catch {
      // silently fail — publisher can type manually
    } finally {
      setDoiLoading(false);
    }
  };

  const publishPaper = async () => {
    if (!selectedPaper) return;
    if (!doi.trim()) {
      toast({
        title: "DOI required",
        description: "Please enter or wait for DOI to generate",
        variant: "destructive",
      });
      return;
    }
    if (!selectedPaper.issueId) {
      toast({
        title: "Issue ID missing",
        description: "This paper has no issue assigned",
        variant: "destructive",
      });
      return;
    }
    try {
      setPublishing(true);
      const res = await fetch(
        `${url}/publication/publishPaper/${selectedPaper.paperId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            year_label: String(publishYear),
            issueId: selectedPaper.issueId || undefined,
            doi: doi.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish paper");

      setPapers((prev) =>
        prev.map((p) =>
          p.paperId === selectedPaper.paperId
            ? { ...p, paperStatus: "published" }
            : p,
        ),
      );
      toast({
        title: "Paper Published",
        description: `"${selectedPaper.title}" published successfully`,
      });
      setOpenPublish(false);
      setSelectedPaper(null);
    } catch (err: any) {
      toast({
        title: "Publish failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchPapers();
  }, [user, token]);

  const filteredPapers = papers.filter((p) =>
    statusFilter === "published"
      ? p.paperStatus === "published"
      : ACCEPTED_STATUSES.has(p.paperStatus),
  );

  const getStatusBadge = (status: string) => {
    if (status === "published") {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 shrink-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Published
        </Badge>
      );
    }
    if (ACCEPTED_STATUSES.has(status)) {
      return (
        <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 shrink-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground shrink-0">
        <AlertCircle className="h-3 w-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Publish Papers
            </h1>
            <p className="text-muted-foreground mt-1">
              Review accepted papers and publish them
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={fetchPapers} variant="outline" size="sm">
              Refresh
            </Button>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <TabsList>
                <TabsTrigger value="accepted">
                  Accepted
                  {papers.filter((p) => ACCEPTED_STATUSES.has(p.paperStatus))
                    .length > 0 && (
                    <span className="ml-1.5 text-xs bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded-full">
                      {
                        papers.filter((p) =>
                          ACCEPTED_STATUSES.has(p.paperStatus),
                        ).length
                      }
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {statusFilter === "accepted"
                  ? "No accepted papers awaiting publication"
                  : "No published papers yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.paperId}
                className="border hover:border-blue-500/50 hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2 text-foreground">
                      {paper.title}
                    </CardTitle>
                    {getStatusBadge(paper.paperStatus)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-muted-foreground flex-1">
                  {/* Author · Journal · Issue */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                    {paper.authorName && (
                      <span className="font-medium text-foreground">
                        {paper.authorName}
                      </span>
                    )}
                    {paper.journalName && (
                      <>
                        <span>·</span>
                        <span>{paper.journalName}</span>
                      </>
                    )}
                    {paper.issueLabel && (
                      <>
                        <span>·</span>
                        <span>{paper.issueLabel}</span>
                      </>
                    )}
                  </div>

                  {/* Submitted · Accepted */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Submitted: {formatDate(paper.submittedAt)}</span>
                    </div>
                    {paper.acceptedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 shrink-0 text-green-500" />
                        <span>Accepted: {formatDate(paper.acceptedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* AE · Reviewers */}
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-start gap-1">
                      <span className="text-muted-foreground shrink-0">
                        AE:
                      </span>
                      <span className="font-medium text-foreground">
                        {paper.aeName || "Unassigned"}
                      </span>
                    </div>
                    {paper.reviewerNames.length > 0 && (
                      <div className="flex items-start gap-1">
                        <span className="text-muted-foreground shrink-0">
                          Reviewers:
                        </span>
                        <span className="font-medium text-foreground">
                          {paper.reviewerNames.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DOI (published papers) */}
                  {paper.doi && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">DOI: </span>
                      <span className="font-mono text-foreground">
                        {paper.doi}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-3 flex flex-wrap gap-2">
                  {/* View Paper */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setViewPaper(paper)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>

                  {/* Download */}
                  {paper.fileUrl && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        title={
                          paper.fileType === "docx"
                            ? "Word file — download as Word"
                            : "Download file"
                        }
                        onClick={() =>
                          window.open(getFileUrl(paper.fileUrl), "_blank")
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {paper.fileType
                          ? paper.fileType.replace(".", "").toUpperCase()
                          : "FILE"}
                      </span>
                    </div>
                  )}

                  {/* Publish / Published badge */}
                  {paper.paperStatus !== "published" ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 ml-auto"
                      onClick={() => handleOpenPublish(paper)}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Publish
                    </Button>
                  ) : (
                    <Badge
                      variant="default"
                      className="ml-auto px-2 py-1 cursor-default text-xs"
                    >
                      ✓ Published
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* View Paper Modal */}
        <Dialog
          open={!!viewPaper}
          onOpenChange={(open) => !open && setViewPaper(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Paper Details
              </DialogTitle>
              <DialogDescription>Full paper information</DialogDescription>
            </DialogHeader>
            {viewPaper && (
              <div className="space-y-4 py-2 text-sm">
                <p className="font-semibold text-base leading-snug">
                  {viewPaper.title}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Status
                    </p>
                    {getStatusBadge(viewPaper.paperStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Author
                    </p>
                    <p className="font-medium">{viewPaper.authorName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Journal
                    </p>
                    <p className="font-medium">
                      {viewPaper.journalName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Issue
                    </p>
                    <p className="font-medium">{viewPaper.issueLabel || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Submitted
                    </p>
                    <p className="font-medium">
                      {formatDate(viewPaper.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Accepted
                    </p>
                    <p className="font-medium">
                      {formatDate(viewPaper.acceptedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Associate Editor
                    </p>
                    <p className="font-medium">
                      {viewPaper.aeName || "Unassigned"}
                    </p>
                  </div>
                  {viewPaper.doi && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        DOI
                      </p>
                      <p className="font-mono text-xs">{viewPaper.doi}</p>
                    </div>
                  )}
                </div>
                {viewPaper.reviewerNames.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Reviewers
                    </p>
                    <p className="font-medium">
                      {viewPaper.reviewerNames.join(", ")}
                    </p>
                  </div>
                )}
                {viewPaper.fileUrl && (
                  <div className="border-t pt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">File:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() =>
                        window.open(getFileUrl(viewPaper.fileUrl), "_blank")
                      }
                    >
                      <Download className="h-3 w-3" />
                      Download{" "}
                      {viewPaper.fileType?.replace(".", "").toUpperCase() ||
                        "File"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewPaper(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Dialog */}
        <Dialog open={openPublish} onOpenChange={setOpenPublish}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Publish Paper
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Complete the publishing process
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {selectedPaper?.title}
                </p>
                {selectedPaper?.authorName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPaper.authorName}
                    {selectedPaper.journalName &&
                      ` · ${selectedPaper.journalName}`}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  DOI (auto-generated)
                </label>
                <div className="relative">
                  <Input
                    value={doiLoading ? "Generating…" : doi}
                    disabled
                    className="bg-muted cursor-not-allowed opacity-70 pr-10"
                  />
                  {doiLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  DOI is auto-generated and cannot be edited.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Publication Year (from issue)
                </label>
                <Input
                  value={publishYear}
                  disabled
                  className="bg-muted cursor-not-allowed opacity-70"
                />
              </div>

              {selectedPaper?.issueId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    Issue:{" "}
                    {selectedPaper.issueLabel ||
                      selectedPaper.issueId.slice(0, 8) + "…"}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpenPublish(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={publishPaper}
                disabled={publishing || doiLoading}
                className="flex-1"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Publish
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
