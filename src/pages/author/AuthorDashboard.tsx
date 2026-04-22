import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import {
  Plus,
  FileText,
  MapPin,
  Upload,
  AlertTriangle,
  BookOpen,
  Calendar,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import { getPaperUrl } from "@/lib/utils";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface Paper {
  id: string;
  title: string;
  status: string;
  authors?: string;
  author_names?: string[];
  updated_at: string;
  submitted_at?: string;
  journal_title?: string;
  payment_status?: string;
  url_slug?: string;
  acronym?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  awaiting_payment: { label: "Payment Pending", variant: "outline" },
  payment_review: { label: "Receipt Under Review", variant: "secondary" },
  submitted: { label: "Submitted", variant: "secondary" },
  under_review: { label: "Under Review", variant: "default" },
  resubmitted: { label: "Under Review (Resubmission)", variant: "default" },
  pending_revision: { label: "Revision Requested", variant: "outline" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  sub_editor_approved: { label: "Approved by Editor", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  published: { label: "Published", variant: "default" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AuthorDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthorHint, setShowAuthorHint] = useState(() =>
    !localStorage.getItem("hint_dismissed_author")
  );
  const dismissAuthorHint = () => {
    localStorage.setItem("hint_dismissed_author", "true");
    setShowAuthorHint(false);
  };

  useEffect(() => {
    fetch(`${url}/papers/getPapersByAuthor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPapers(data.papers);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const recentSubmissions = papers.filter((p) => p.status !== "published");
  const publishedArticles = papers.filter((p) => p.status === "published");

  return (
    <DashboardLayout
      role={(user?.role as UserRole) ?? "author"}
      userName={user?.username}
    >
      <PageTransition>
        <div className="p-6">
          {showAuthorHint && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Getting Started</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Welcome! Browse our open journals and submit your research. After submission, you can track your paper's progress here.
                </p>
              </div>
              <button onClick={dismissAuthorHint} className="text-blue-400 hover:text-blue-600 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.username || "Author"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track your submissions and manage your research papers.
              </p>
            </div>
            <Button onClick={() => navigate("/author/submit")}>
              <Plus className="h-4 w-4 mr-2" /> Submit Paper
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left panel — Recent Submissions */}
            <div className="border rounded-lg flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="font-semibold">Recent Submissions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/author/submit")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Submit Paper
                </Button>
              </div>
              <div className="overflow-y-auto flex-1 max-h-[60vh]">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Loading…
                  </div>
                ) : recentSubmissions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No submissions yet.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {recentSubmissions.map((paper) => (
                      <li
                        key={paper.id}
                        className="px-4 py-3 flex flex-col gap-1.5"
                      >
                        <span className="font-medium text-sm leading-snug">
                          {paper.title}
                        </span>
                        {paper.journal_title && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            {paper.journal_title}
                          </span>
                        )}
                        {paper.submitted_at && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Submitted: {formatDate(paper.submitted_at)}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={paper.status} />
                          <span className="text-xs text-muted-foreground">
                            Updated: {formatDate(paper.updated_at)}
                          </span>
                        </div>
                        {(paper.payment_status === "pending" || paper.payment_status === "failed") && (
                          <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded px-3 py-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {paper.payment_status === "failed" ? "Receipt rejected — re-upload required" : "Payment required to proceed"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                              onClick={() =>
                                navigate(`/author/track/${paper.id}`)
                              }
                            >
                              Upload Receipt
                            </Button>
                          </div>
                        )}
                        {paper.status === "pending_revision" && (
                          <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded px-3 py-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Revision requested — please upload a revised
                              version
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                              onClick={() =>
                                navigate(`/author/version?paperId=${paper.id}`)
                              }
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Revision
                            </Button>
                          </div>
                        )}
                        <Link
                          to={`/author/track/${paper.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                        >
                          <MapPin className="h-3 w-3" />
                          Track Paper
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right panel — Published Articles */}
            <div className="border rounded-lg flex flex-col">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold">Publisher</h2>
                <p className="text-xs text-muted-foreground">
                  Published Articles
                </p>
              </div>
              <div className="overflow-y-auto flex-1 max-h-[60vh]">
                {loading ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Loading…
                  </div>
                ) : publishedArticles.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    No published articles yet.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {publishedArticles.map((paper) => (
                      <li
                        key={paper.id}
                        className="px-4 py-3 flex flex-col gap-1.5"
                      >
                        <span className="font-medium text-sm leading-snug">
                          {paper.title}
                        </span>
                        {paper.journal_title && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            {paper.journal_title}
                          </span>
                        )}
                        {(paper.author_names?.length || paper.authors) && (
                          <span className="text-xs text-muted-foreground">
                            {Array.isArray(paper.author_names) &&
                            paper.author_names.length > 0
                              ? paper.author_names.join(", ")
                              : paper.authors}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={paper.status} />
                          <span className="text-xs text-muted-foreground">
                            Updated: {formatDate(paper.updated_at)}
                          </span>
                        </div>
                        <Link
                          to={getPaperUrl(paper)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Published
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
