import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  variant?: "card" | "text" | "avatar" | "button" | "table-row";
  className?: string;
  lines?: number;
}

export function SkeletonLoader({ 
  variant = "text", 
  className,
  lines = 1 
}: SkeletonLoaderProps) {
  if (variant === "card") {
    return (
      <div className={cn(
        "glass-card p-6 space-y-4",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-3/4 rounded skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded skeleton-shimmer" />
          </div>
          <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 rounded skeleton-shimmer" />
          ))}
        </div>
        <div className="pt-3 border-t border-border/30 flex justify-between">
          <div className="h-4 w-24 rounded skeleton-shimmer" />
          <div className="h-4 w-32 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div className={cn(
        "flex items-center gap-3",
        className
      )}>
        <div className="h-10 w-10 rounded-full skeleton-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded skeleton-shimmer" />
          <div className="h-3 w-16 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div className={cn(
        "h-10 w-24 rounded-lg skeleton-shimmer",
        className
      )} />
    );
  }

  if (variant === "table-row") {
    return (
      <div className={cn(
        "flex items-center gap-4 p-4 border-b border-border/30",
        className
      )}>
        <div className="h-10 w-10 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        <div className="h-8 w-8 rounded skeleton-shimmer" />
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded skeleton-shimmer",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}
