import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { FileText, Calendar, Download, Eye, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";

interface Paper {
  paper_id: string;
  title: string;
  abstract?: string;
  category?: string;
  version_number?: string;
  priority?: "high" | "medium" | "low";
  submittedDate?: string;
  assignment_status:
    | "assigned"
    | "submitted"
    | "accepted"
    | "rejected"
    | "expired";
  review_submitted_at?: string;
  updated_at?: string;
  authors?: string[];
  comments?: string;
  yourRating?: number;
  yourReviewTime?: string;
  keywords?: string[];
  journal_name?: string;
  journal_acronym?: string;
  issue_label?: string;
}

interface CompletedReview extends Paper {
  decision: "submitted" | "accepted" | "rejected";
  completedDate: string;
}

const ITEMS_PER_PAGE = 5;

export default function CompletedReviewPage() {
  const { token, user } = useAuth();
  const [completedReviews, setCompletedReviews] = useState<CompletedReview[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCompletedReviews = async () => {
    try {
      const res = await fetch(`${url}/reviewer/getReviewerPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) return;

      const allPapers: Paper[] = data.papers || [];

      const completed: CompletedReview[] = allPapers
        .filter((paper) =>
          ["submitted", "accepted", "rejected"].includes(
            paper.assignment_status,
          ),
        )
        .map((paper) => ({
          ...paper,
          decision: paper.assignment_status as
            | "submitted"
            | "accepted"
            | "rejected",
          completedDate:
            paper.review_submitted_at ||
            paper.updated_at ||
            new Date().toISOString(),
          authors: paper.authors || [],
          yourComments: paper.comments || "No comments",
          yourRating: paper.yourRating || 0,
          yourReviewTime: paper.yourReviewTime || "N/A",
          keywords: paper.keywords || [],
        }));

      setCompletedReviews(completed);
    } catch (error) {
      console.error("Error fetching completed reviews:", error);
    }
  };

  useEffect(() => {
    fetchCompletedReviews();
  }, []);

  const totalPages = Math.ceil(completedReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageReviews = completedReviews.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <DashboardLayout role="reviewer" userName={user?.username}>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Completed Reviews
              </h1>
              <p className="text-muted-foreground">
                All papers you have reviewed
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {completedReviews.length} papers
            </div>
          </div>

          <div className="space-y-4">
            {currentPageReviews.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No completed reviews
                </h3>
                <p className="text-muted-foreground">
                  You haven't completed any reviews yet.
                </p>
              </div>
            ) : (
              currentPageReviews.map((review) => (
                <motion.div
                  key={review.paper_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline">
                              {review.journal_name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {review.issue_label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {review.version_number}
                            </Badge>
                            <Badge className="text-xs bg-green-500/10 text-green-700 dark:text-green-300">
                              Reviewed
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {review.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {review.abstract}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <span className="font-medium text-foreground">
                                {review.authors.join(", ")}
                              </span>
                            </div>
                            <div>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Completed:{" "}
                              {new Date(
                                review.completedDate,
                              ).toLocaleDateString()}
                            </div>

                            <div>
                              <Clock className="h-3 w-3 inline mr-1" />
                              Review Time:{" "}
                              {review.review_submitted_at &&
                                new Date(
                                  review.review_submitted_at,
                                ).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {review.keywords.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="lg:w-48 space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Your Comment:
                            </div>
                            <div className="text-sm bg-muted/50 p-3 rounded-lg line-clamp-3">
                              {review.comments}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              asChild
                            >
                              <Link
                                to={`/reviewer/completed/${review.paper_id}`}
                                state={{ review }}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-foreground border-border hover:bg-muted"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
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
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
