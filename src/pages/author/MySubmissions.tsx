import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { Search, Filter, ChevronDown, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Paper {
  id: string;
  title: string;
  status: string;
  author_names?: string[];
  keywords?: string[];
  category?: string;
  submitted_at?: string;
  updated_at: string;
  journal_title?: string;
  current_version_label?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_ca_approval: "Pending CA Approval",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_revision: "Revision Requested",
  resubmitted: "Resubmitted",
  reviewed: "Reviewed",
  sub_editor_approved: "Approved by Editor",
  accepted: "Accepted",
  rejected: "Rejected",
  published: "Published",
  ca_rejected: "CA Rejected",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  const variant: Record<string, string> = {
    accepted: "bg-green-500/10 text-green-600 border-green-500/30",
    published: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
    ca_rejected: "bg-red-500/10 text-red-600 border-red-500/30",
    under_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    pending_revision: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  };
  const cls = variant[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ITEMS_PER_PAGE = 6;

export default function MySubmissions() {
  const { token, user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    fetch(`${url}/papers/getPapersByAuthor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPapers(data.papers ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  const filtered = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.keywords ?? []).some((k) => k.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest")
      return (
        new Date(b.submitted_at ?? b.updated_at).getTime() -
        new Date(a.submitted_at ?? a.updated_at).getTime()
      );
    if (sortBy === "oldest")
      return (
        new Date(a.submitted_at ?? a.updated_at).getTime() -
        new Date(b.submitted_at ?? b.updated_at).getTime()
      );
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              My Submissions
            </h1>
            <p className="text-muted-foreground">
              View and manage all your submitted research papers
            </p>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, category, or keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex-1 min-w-0 relative">
                <StickyNote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-foreground appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending_ca_approval">
                    Pending CA Approval
                  </option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="pending_revision">Revision Requested</option>
                  <option value="resubmitted">Resubmitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              <div className="flex-1 min-w-0 relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-foreground appearance-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {(searchQuery ||
                statusFilter !== "all" ||
                sortBy !== "newest") && (
                <div className="sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {paginated.length} of {sorted.length} submissions
              {searchQuery && (
                <span className="text-foreground font-medium">
                  {" "}
                  for "{searchQuery}"
                </span>
              )}
            </p>
            <span>
              Sorted by:{" "}
              <span className="text-foreground font-medium">
                {sortBy === "newest"
                  ? "Newest"
                  : sortBy === "oldest"
                    ? "Oldest"
                    : "Title"}
              </span>
            </span>
          </div>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <div className="glass-card p-12 text-center text-muted-foreground text-sm">
                Loading…
              </div>
            ) : paginated.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No submissions found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "No submissions match your current filters."
                    : "You haven't submitted any papers yet."}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button onClick={handleClearFilters}>Clear filters</Button>
                )}
              </div>
            ) : (
              paginated.map((paper) => (
                <div key={paper.id} className="glass-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm leading-snug">
                      {paper.title}
                    </p>
                    <StatusBadge status={paper.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {paper.journal_title && <span>{paper.journal_title}</span>}
                    {paper.category && <span>{paper.category}</span>}
                    {paper.submitted_at && (
                      <span>Submitted: {formatDate(paper.submitted_at)}</span>
                    )}
                    <span>Updated: {formatDate(paper.updated_at)}</span>
                  </div>
                  {(paper.keywords ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(paper.keywords ?? []).slice(0, 5).map((k) => (
                        <Badge key={k} variant="secondary" className="text-xs">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {paper.id}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2)
                      page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
