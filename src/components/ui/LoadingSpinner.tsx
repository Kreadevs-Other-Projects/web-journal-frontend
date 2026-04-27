import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const LoadingSpinner = ({
  fullScreen = true,
  size = "md",
  text = "Loading Paperuno...",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-3",
    lg: "h-16 w-16 border-4",
  };

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-gradient-primary opacity-20" />

        <div
          className={cn(
            "relative rounded-full border-transparent",
            sizeClasses[size],
            "bg-gradient-to-br from-background via-background to-background",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full border-transparent",
              sizeClasses[size],
              "animate-spin border-t-primary border-r-accent border-b-primary border-l-accent",
            )}
          />

          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5" />

          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </div>

      {text && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-foreground">{text}</p>
          <motion.div
            className="mt-2 flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="glass-card p-8 rounded-2xl border border-border/50 shadow-2xl">
          {spinner}
        </div>
      </motion.div>
    );
  }

  return spinner;
};
