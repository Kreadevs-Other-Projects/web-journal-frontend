import { useLocation, useNavigate } from "react-router-dom";
import { ReviewCommentDisplay } from "@/components/ReviewCommentDisplay";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Calendar, Clock, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";

export default function ReviewDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const review = location.state?.review;

  if (!review) {
    return (
      <DashboardLayout role="reviewer" userName={user?.username}>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">Review details not found.</p>
          <Button variant="outline" onClick={() => navigate("/reviewer/completed")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Completed Reviews
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const decisionColor =
    review.decision === "accepted"
      ? "bg-green-500/10 text-green-700 dark:text-green-300"
      : review.decision === "rejected"
        ? "bg-destructive/10 text-destructive"
        : review.decision?.includes("revision")
          ? "bg-warning/10 text-warning"
          : "bg-muted text-muted-foreground";

  return (
    <DashboardLayout role="reviewer" userName={user?.username}>
      <PageTransition>
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="h-10 w-10 p-0"
              onClick={() => navigate("/reviewer/completed")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{review.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">Review Detail</p>
            </div>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Paper Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {review.keywords?.map((kw: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>

              {review.abstract && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Abstract</p>
                  <p className="text-sm text-foreground">{review.abstract}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Submitted:{" "}
                    {review.submittedDate
                      ? new Date(review.submittedDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Review completed:{" "}
                    {review.completedDate
                      ? new Date(review.completedDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Your Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Decision</p>
                <Badge className={`text-sm px-3 py-1 ${decisionColor}`}>
                  {review.decision || "submitted"}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Comments</p>
                <ReviewCommentDisplay
                  comments={review.comments}
                  showConfidential={false}
                />
              </div>
            </CardContent>
          </Card>

          {review.file_url && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(getFileUrl(review.file_url), "_blank")}
            >
              <Download className="h-4 w-4" />
              Download Manuscript
            </Button>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
