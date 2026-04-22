import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, User, Star, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Reviewer {
  id: string;
  name: string;
  avatar?: string;
  expertise: string[];
  workload: number;
  maxWorkload: number;
}

interface Assignment {
  paperId: string;
  reviewerId: string;
}

interface ReviewerMatrixProps {
  papers: { id: string; title: string }[];
  reviewers: Reviewer[];
  assignments: Assignment[];
  onAssign: (paperId: string, reviewerId: string) => void;
  onUnassign: (paperId: string, reviewerId: string) => void;
  className?: string;
}

export function ReviewerMatrix({
  papers,
  reviewers,
  assignments,
  onAssign,
  onUnassign,
  className,
}: ReviewerMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const isAssigned = (paperId: string, reviewerId: string) => {
    return assignments.some(
      (a) => a.paperId === paperId && a.reviewerId === reviewerId
    );
  };

  const getReviewerWorkload = (reviewerId: string) => {
    return assignments.filter((a) => a.reviewerId === reviewerId).length;
  };

  return (
    <div className={cn("glass-card p-6 overflow-x-auto", className)}>
      <h4 className="font-serif-outfit text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        Reviewer Assignment Matrix
      </h4>

      <div className="min-w-[600px]">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                Paper / Reviewer
              </th>
              {reviewers.map((reviewer) => (
                <th key={reviewer.id} className="p-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={reviewer.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {reviewer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground max-w-[80px] truncate">
                      {reviewer.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (getReviewerWorkload(reviewer.id) /
                                reviewer.maxWorkload) *
                              100
                            }%`,
                          }}
                          className={cn(
                            "h-full rounded-full",
                            getReviewerWorkload(reviewer.id) >=
                              reviewer.maxWorkload
                              ? "bg-destructive"
                              : getReviewerWorkload(reviewer.id) >=
                                reviewer.maxWorkload * 0.7
                              ? "bg-warning"
                              : "bg-success"
                          )}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {getReviewerWorkload(reviewer.id)}/
                        {reviewer.maxWorkload}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {papers.map((paper, paperIndex) => (
              <motion.tr
                key={paper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: paperIndex * 0.05 }}
                className="border-t border-border/30"
              >
                <td className="p-3">
                  <span className="text-sm text-foreground line-clamp-2 max-w-[200px]">
                    {paper.title}
                  </span>
                </td>
                {reviewers.map((reviewer) => {
                  const assigned = isAssigned(paper.id, reviewer.id);
                  const cellKey = `${paper.id}-${reviewer.id}`;
                  const isHovered = hoveredCell === cellKey;
                  const isOverloaded =
                    getReviewerWorkload(reviewer.id) >= reviewer.maxWorkload;

                  return (
                    <td key={reviewer.id} className="p-3 text-center">
                      <motion.button
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (assigned) {
                            onUnassign(paper.id, reviewer.id);
                          } else if (!isOverloaded) {
                            onAssign(paper.id, reviewer.id);
                          }
                        }}
                        disabled={!assigned && isOverloaded}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-200",
                          assigned
                            ? "bg-primary text-primary-foreground glow-primary"
                            : isHovered && !isOverloaded
                            ? "bg-primary/20 text-primary border-2 border-primary/50"
                            : isOverloaded
                            ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          {assigned ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                            >
                              <Check className="h-5 w-5" />
                            </motion.div>
                          ) : isHovered && !isOverloaded ? (
                            <motion.div
                              key="add"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <User className="h-4 w-4" />
                            </motion.div>
                          ) : isOverloaded ? (
                            <X className="h-4 w-4" />
                          ) : null}
                        </AnimatePresence>
                      </motion.button>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted/50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted/30 flex items-center justify-center">
            <X className="h-3 w-3" />
          </div>
          <span>At Capacity</span>
        </div>
      </div>
    </div>
  );
}
