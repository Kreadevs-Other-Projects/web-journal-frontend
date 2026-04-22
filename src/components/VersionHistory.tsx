import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileText, Download, Eye, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface Version {
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  isCurrent?: boolean;
  fileUrl?: string;
}

interface VersionHistoryProps {
  versions: Version[];
  onViewVersion?: (version: Version) => void;
  onDownloadVersion?: (version: Version) => void;
  className?: string;
}

export function VersionHistory({
  versions,
  onViewVersion,
  onDownloadVersion,
  className,
}: VersionHistoryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-serif-outfit-outfit-outfit text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Version History
      </h4>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />

        {versions.map((version, index) => (
          <motion.div
            key={version.version}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative pl-10 py-4",
              index !== versions.length - 1 && "border-b border-border/30"
            )}
          >
            {/* Timeline dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
              className={cn(
                "absolute left-0 top-5 h-6 w-6 rounded-full flex items-center justify-center",
                version.isCurrent
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {version.isCurrent ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="text-[10px] font-bold">{index + 1}</span>
              )}
            </motion.div>

            <div className="space-y-2">
              {/* Version header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold",
                      version.isCurrent ? "text-primary" : "text-foreground"
                    )}
                  >
                    {version.version}
                  </span>
                  {version.isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {onViewVersion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewVersion(version)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onDownloadVersion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownloadVersion(version)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {version.uploadedAt}
                </span>
                <span>by {version.uploadedBy}</span>
              </div>

              {/* Notes */}
              {version.notes && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
                  {version.notes}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
