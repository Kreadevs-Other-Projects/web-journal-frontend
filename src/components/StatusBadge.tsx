import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PaperStatus =
  | "submitted"
  | "assigned"
  | "under_review"
  | "pending_review"
  | "pending_revision"
  | "resubmitted"
  | "accepted"
  | "published"
  | "rejected"
  | "awaiting_payment"
  | "payment_review"
  | "ready_for_publication"
  | "sub_editor_approved"
  | "reviewed"
  | "assigned_to_sub_editor"
  | "pending_ca_approval"
  | "ca_rejected";

interface StatusBadgeProps {
  status: PaperStatus | string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-info/10 text-info border-info/20",
    dotColor: "bg-info",
  },
  assigned: {
    label: "Assigned",
    className: "bg-primary/10 text-primary border-primary/20",
    dotColor: "bg-primary",
  },
  under_review: {
    label: "Under Review",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
  },
  pending_revision: {
    label: "Pending Revision",
    className: "bg-accent/10 text-accent border-accent/20",
    dotColor: "bg-accent",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
  accepted: {
    label: "Accepted",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  published: {
    label: "Published",
    className: "bg-success/10 text-success border-success/20 glow-success",
    dotColor: "bg-success",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  payment_review: {
    label: "Payment Under Review",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  ready_for_publication: {
    label: "Ready for Publication",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  sub_editor_approved: {
    label: "AE Approved",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  reviewed: {
    label: "Reviewed",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    dotColor: "bg-cyan-500",
  },
  assigned_to_sub_editor: {
    label: "Assigned to AE",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  pending_ca_approval: {
    label: "Awaiting CA Approval",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    dotColor: "bg-orange-500",
  },
  ca_rejected: {
    label: "Rejected by CA",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  submitted: "Paper has been received and is awaiting assignment to an Associate Editor.",
  assigned_to_sub_editor: "An Associate Editor has been assigned and will manage the review process.",
  under_review: "The paper is currently being reviewed by one or more reviewers.",
  reviewed: "All reviewers have submitted their feedback. Awaiting Associate Editor decision.",
  sub_editor_approved: "Associate Editor has approved the paper. Awaiting Chief Editor final decision.",
  pending_revision: "The author has been asked to revise and resubmit the paper.",
  resubmitted: "The author has uploaded a revised version. Review process restarts.",
  accepted: "Chief Editor has accepted the paper. Awaiting payment processing.",
  awaiting_payment: "Paper accepted. Author has been invoiced and payment is pending.",
  payment_review: "Author has uploaded payment receipt. Awaiting publisher approval.",
  ready_for_publication: "Payment confirmed. Paper is ready to be published.",
  rejected: "The paper has been rejected and will not be published in this journal.",
  pending_ca_approval: "Waiting for the corresponding author to approve this submission via email.",
  ca_rejected: "The corresponding author has rejected this submission.",
  published: "Paper has been published and is publicly accessible.",
  draft: "Issue has been created but is not yet open for submissions.",
  open: "This issue is currently accepting paper submissions from authors.",
  closed: "Submissions for this issue have closed. Papers are being processed.",
  pending: "Invitation sent. Awaiting acceptance from the assigned person.",
  assigned: "An editor or reviewer has been assigned to this item.",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export function StatusBadge({ status, size = "md", animated = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, " ") : "Unknown",
    className: "bg-muted/10 text-muted-foreground border-muted/20",
    dotColor: "bg-muted-foreground",
  };

  const description = STATUS_DESCRIPTIONS[status];

  const BadgeContent = (
    <>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor, animated && "animate-pulse-glow")} />
      <span className="font-semibold tracking-wider uppercase">{config.label}</span>
    </>
  );

  const badgeEl = animated ? (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("inline-flex items-center gap-1.5 rounded-full border", config.className, sizeClasses[size], className)}
    >
      {BadgeContent}
    </motion.span>
  ) : (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border", config.className, sizeClasses[size], className)}>
      {BadgeContent}
    </span>
  );

  if (!description) return badgeEl;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
