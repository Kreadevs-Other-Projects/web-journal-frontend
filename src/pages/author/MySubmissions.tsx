import { DashboardLayout } from "@/components/DashboardLayout";
import { PaperCard } from "@/components/PaperCard";
import { PageTransition } from "@/components/AnimationWrappers";
import { Search, Filter, ChevronDown, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const allSubmissions = [
  {
    id: "SUB-2026-042",
    title: "Machine Learning Approaches for Climate Pattern Recognition",
    category: "Machine Learning",
    keywords: ["ML", "Climate", "Pattern Recognition"],
    status: "under_review" as const,
    currentVersion: "v1.2",
    submittedAt: "Dec 15, 2025",
  },
  {
    id: "SUB-2026-038",
    title: "Quantum Error Correction in Noisy Environments",
    category: "Quantum Computing",
    keywords: ["Quantum", "Error Correction", "NISQ"],
    status: "pending_revision" as const,
    currentVersion: "v1.0",
    submittedAt: "Dec 10, 2025",
  },
  {
    id: "SUB-2026-035",
    title: "Neural Architecture Search for Edge Devices",
    category: "Computer Science",
    keywords: ["NAS", "Edge Computing", "Efficiency"],
    status: "accepted" as const,
    currentVersion: "v2.1",
    submittedAt: "Nov 28, 2025",
  },
  {
    id: "SUB-2026-029",
    title: "Biodegradable Polymers for Sustainable Packaging",
    category: "Materials Science",
    keywords: ["Polymers", "Biodegradable", "Packaging"],
    status: "published" as const,
    currentVersion: "v1.5",
    submittedAt: "Nov 15, 2025",
  },
  {
    id: "SUB-2026-025",
    title: "Graph Neural Networks for Social Network Analysis",
    category: "Machine Learning",
    keywords: ["GNN", "Social Networks", "Graph Theory"],
    status: "published" as const,
    currentVersion: "v0.8",
    submittedAt: "Nov 5, 2025",
  },
  {
    id: "SUB-2026-018",
    title: "Renewable Energy Grid Integration Challenges",
    category: "Energy Systems",
    keywords: ["Renewable", "Grid", "Integration"],
    status: "under_review" as const,
    currentVersion: "v1.3",
    submittedAt: "Oct 22, 2025",
  },
  {
    id: "SUB-2026-012",
    title: "CRISPR-Cas9 Applications in Agriculture",
    category: "Biotechnology",
    keywords: ["CRISPR", "Agriculture", "Gene Editing"],
    status: "accepted" as const,
    currentVersion: "v2.0",
    submittedAt: "Oct 10, 2025",
  },
  {
    id: "SUB-2025-098",
    title: "Blockchain for Supply Chain Transparency",
    category: "Computer Science",
    keywords: ["Blockchain", "Supply Chain", "Transparency"],
    status: "published" as const,
    currentVersion: "v3.1",
    submittedAt: "Sep 15, 2025",
  },
];

const ITEMS_PER_PAGE = 6;

export default function MySubmissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  const filteredSubmissions = allSubmissions.filter((submission) => {
    const matchesSearch =
      searchQuery === "" ||
      submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === "newest") {
      return (
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    } else if (sortBy === "oldest") {
      return (
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedSubmissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSubmissions = sortedSubmissions.slice(startIndex, endIndex);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                My Submissions
              </h1>
              <p className="text-muted-foreground">
                View and manage all your submitted research papers
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, category, or keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 text-foreground bg-background border-border focus:border-primary"
                />
              </div>

              {/* Status Filter */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="under_review">Under Review</option>
                    <option value="pending_revision">Pending Revision</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Sort Filter */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
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

          {/* Results Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <div className="text-muted-foreground">
              <p>
                Showing {currentSubmissions.length} of{" "}
                {sortedSubmissions.length} submissions
                {searchQuery && (
                  <span className="text-foreground font-medium">
                    {" "}
                    for "{searchQuery}"
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="ml-2">
                    • Status:{" "}
                    <span className="text-foreground font-medium capitalize">
                      {statusFilter.replace("_", " ")}
                    </span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">
                Sorted by:{" "}
                <span className="text-foreground font-medium capitalize">
                  {sortBy === "newest"
                    ? "Newest"
                    : sortBy === "oldest"
                    ? "Oldest"
                    : "Title"}
                </span>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {currentSubmissions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No submissions found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "No submissions match your current filters."
                    : "You haven't submitted any papers yet."}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    onClick={handleClearFilters}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              currentSubmissions.map((submission) => (
                <PaperCard key={submission.id} {...submission} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="text-foreground border-border hover:bg-muted"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        className={`w-10 ${
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground border-border hover:bg-muted"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 text-foreground border-border hover:bg-muted"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="text-foreground border-border hover:bg-muted"
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
