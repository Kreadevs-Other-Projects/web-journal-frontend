import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pen, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: string, password: string) => void;
  paperTitle: string;
  decision: "accept" | "reject";
}

export function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  paperTitle,
  decision,
}: SignatureModalProps) {
  const [step, setStep] = useState<"signature" | "password" | "success">(
    "signature",
  );
  const [signature, setSignature] = useState("");
  const [password, setPassword] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const handleNext = () => {
    if (step === "signature") {
      if (!signature) {
        setError("Please provide your signature");
        return;
      }
      setError("");
      setStep("password");
    } else if (step === "password") {
      if (!password || password.length < 6) {
        setError("Please enter a valid password (min 6 characters)");
        return;
      }
      setError("");
      setStep("success");
      setTimeout(() => {
        onConfirm(signature, password);
      }, 2000);
    }
  };

  const handleClose = () => {
    setStep("signature");
    setSignature("");
    setPassword("");
    setError("");
    clearSignature();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif-outfit text-xl flex items-center gap-2">
            {step === "success" ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="h-8 w-8 rounded-full bg-success flex items-center justify-center"
                >
                  <Check className="h-5 w-5 text-primary-foreground" />
                </motion.div>
                <span className="text-success">Decision Confirmed</span>
              </>
            ) : (
              <>
                <Pen className="h-5 w-5 text-primary" />
                Confirm Your Decision
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "success"
              ? "Your decision has been recorded successfully."
              : `You are about to ${decision} the paper: "${paperTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "signature" && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Draw your signature below
                </label>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={handleDraw}
                    className={cn(
                      "w-full rounded-lg border-2 border-dashed cursor-crosshair bg-background/50",
                      error
                        ? "border-destructive"
                        : "border-border hover:border-primary/50",
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                    className="absolute top-2 right-2 h-7 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleNext} className="btn-physics">
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Enter your password to confirm
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(
                    "input-glow",
                    error && "border-destructive focus:ring-destructive/20",
                  )}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setStep("signature")}>
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className={cn(
                    "btn-physics",
                    decision === "accept"
                      ? "bg-success hover:bg-success/90"
                      : "bg-destructive hover:bg-destructive/90",
                  )}
                >
                  {decision === "accept" ? "Confirm Accept" : "Confirm Reject"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3, bounce: 0.5 }}
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center mb-4",
                  decision === "accept" ? "bg-success/20" : "bg-destructive/20",
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5, bounce: 0.6 }}
                  className={cn(
                    "h-14 w-14 rounded-full flex items-center justify-center",
                    decision === "accept" ? "bg-success" : "bg-destructive",
                  )}
                >
                  <Check className="h-8 w-8 text-primary-foreground" />
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center text-muted-foreground"
              >
                The paper has been{" "}
                {decision === "accept" ? "accepted" : "rejected"}.
                <br />
                The author will be notified shortly.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
