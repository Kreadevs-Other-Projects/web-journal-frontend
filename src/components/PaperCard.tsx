import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBadge, PaperStatus } from "./StatusBadge";
import { Calendar, User, Tag, FileText, ChevronRight } from "lucide-react";

interface PaperCardProps {
  id: string;
  title: string;
  authors?: string[];
  category: string;
  keywords: string[];
  status: PaperStatus;
  currentVersion: string;
  submittedAt: string;
  onClick?: () => void;
  className?: string;
  showTimeline?: boolean;
  isAnonymous?: boolean;
  key?: string | number
}

const statusOrder: PaperStatus[] = [
  "submitted",
  "assigned",
  "under_review",
  "pending_revision",
  "resubmitted",
  "accepted",
  "published",
];

export function PaperCard({
  id,
  title,
  authors,
  category,
  keywords,
  status,
  currentVersion,
  submittedAt,
  onClick,
  className,
  showTimeline = true,
  isAnonymous = false,
}: PaperCardProps) {
  const currentStatusIndex = statusOrder.indexOf(status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "glass-card group cursor-pointer p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-glow",
        className
      )}
    >
      {/* Timeline strip at top */}
      {showTimeline && status !== "rejected" && (
        <div className="mb-4 flex gap-1">
          {statusOrder.map((s, index) => (
            <motion.div
              key={s}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={cn(
                "h-1 flex-1 rounded-full origin-left",
                index <= currentStatusIndex
                  ? index === currentStatusIndex
                    ? "bg-primary"
                    : "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif-outfit text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <StatusBadge status={status} size="sm" />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {!isAnonymous && authors && authors.length > 0 && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {authors.slice(0, 2).join(", ")}
                {authors.length > 2 && ` +${authors.length - 2}`}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {category}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {currentVersion}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {submittedAt}
            </span>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 4).map((keyword) => (
              <span
                key={keyword}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 4 && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{keywords.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <motion.div
          initial={{ x: 0, opacity: 0.5 }}
          whileHover={{ x: 4, opacity: 1 }}
          className="mt-2 text-muted-foreground group-hover:text-primary transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Paper ID footer */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          ID: {id}
        </span>
        <span className="text-xs text-muted-foreground">
          Click to view details
        </span>
      </div>
    </motion.article>
  );
}
