import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, RotateCcw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OtpInputProps {
  email: string;
  onComplete: (otp: string) => void;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export function OtpInput({
  email,
  onComplete,
  onResend,
  onBack,
  isLoading = false,
  error,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(600);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = () => {
    if (resendRef.current) clearInterval(resendRef.current);
    setCanResend(false);
    setResendCooldown(60);
    resendRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(resendRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCountdown();
    startResendCooldown();
    // Focus first input on mount
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (resendRef.current) clearInterval(resendRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const submitOtp = (digitArr: string[]) => {
    const otp = digitArr.join("");
    if (otp.length === 6) onComplete(otp);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      submitOtp(newDigits);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newDigits = Array(6).fill("");
    pasted.split("").forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      submitOtp(newDigits);
    }
  };

  const handleResend = async () => {
    setDigits(Array(6).fill(""));
    setResending(true);
    try {
      await onResend();
      startCountdown();
      startResendCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Verify your email
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          We sent a 6-digit verification code to
        </p>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={isLoading}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              "w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background/50",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "transition-all duration-150",
              digit
                ? "border-primary/60 text-foreground"
                : "border-border text-muted-foreground",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              isLoading && "opacity-50 cursor-not-allowed",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" />
          {error}
        </p>
      )}

      <div className="space-y-1">
        {countdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Code expires in:{" "}
            <span
              className={cn(
                "font-mono font-medium",
                countdown < 60 ? "text-destructive" : "text-foreground",
              )}
            >
              {formatTime(countdown)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-destructive font-medium">
            Code expired — request a new one
          </p>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium hover:underline flex items-center gap-1 mx-auto disabled:opacity-50"
          >
            <RotateCcw className={cn("h-3 w-3", resending && "animate-spin")} />
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        ) : (
          <span>
            Resend available in{" "}
            <span className="font-mono text-foreground">
              {formatTime(resendCooldown)}
            </span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </button>
    </motion.div>
  );
}
