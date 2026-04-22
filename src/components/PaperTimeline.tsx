import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBadge, PaperStatus } from "./StatusBadge";
import {
  FileText,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  BookOpen,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  status: PaperStatus;
  date: string;
  description: string;
  actor?: string;
  isCurrent?: boolean;
}

interface PaperTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusIcons: Record<string, React.ElementType> = {
  submitted: Send,
  assigned: UserCheck,
  assigned_to_sub_editor: UserCheck,
  under_review: Clock,
  reviewed: Clock,
  pending_revision: Edit3,
  resubmitted: FileText,
  sub_editor_approved: CheckCircle2,
  accepted: CheckCircle2,
  awaiting_payment: Clock,
  payment_review: Clock,
  ready_for_publication: BookOpen,
  published: BookOpen,
  rejected: XCircle,
};

export function PaperTimeline({ events, className }: PaperTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/30 to-transparent" />

      <div className="space-y-0">
        {events.map((event, index) => {
          const Icon = statusIcons[event.status];

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative pl-16 py-4",
                index !== events.length - 1 && "pb-8",
              )}
            >
              {/* Icon node */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                className={cn(
                  "absolute left-2 top-4 h-8 w-8 rounded-full flex items-center justify-center border-2",
                  event.isCurrent
                    ? "bg-primary border-primary text-primary-foreground glow-primary"
                    : "bg-card border-border text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </motion.div>

              {/* Content */}
              <div
                className={cn(
                  "glass-card p-4",
                  event.isCurrent && "border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <StatusBadge
                      status={event.status}
                      size="sm"
                      animated={event.isCurrent}
                    />
                    <p className="mt-2 text-sm text-foreground font-medium">
                      {event.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.date}
                  </span>
                </div>

                {event.actor && (
                  <p className="text-xs text-muted-foreground">
                    by {event.actor}
                  </p>
                )}

                {event.isCurrent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 pt-3 border-t border-border/50"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Current Status
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
