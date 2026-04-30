import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  ArrowRight,
  X,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";

interface OtpVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: "login" | "signup";
  onVerificationSuccess: () => void;
  resendOtp: () => Promise<boolean>;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  isOpen,
  onClose,
  email,
  type,
  onVerificationSuccess,
  resendOtp,
}) => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  const maskedEmail = email.replace(
    /(.{2})(.*)(?=@)/,
    (_, first, middle) => first + "*".repeat(middle.length),
  );

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      setCountdown(60);
      setResendDisabled(true);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "") && index === 5) {
      handleSubmit();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otp];

      digits.slice(0, 6).forEach((digit, index) => {
        newOtp[index] = digit;
      });

      setOtp(newOtp);

      const lastIndex = Math.min(5, digits.length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (verifying) return;

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const endpoint =
        type === "signup"
          ? `${url}/auth/verifysignup`
          : `${url}/auth/verifyLoginOTP`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        toast({
          title: "Verification Successful!",
          description:
            type === "signup"
              ? "Your account has been verified successfully!"
              : "You have been logged in successfully!",
        });

        setTimeout(() => {
          onVerificationSuccess();
        }, 1000);
      } else {
        throw new Error(result.message || "Invalid OTP code");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
      const inputs = document.querySelectorAll(".otp-input");
      inputs.forEach((input) => {
        input.classList.add("animate-shake");
        setTimeout(() => input.classList.remove("animate-shake"), 500);
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendLoading || resendDisabled) return;

    setResendLoading(true);
    setError("");

    try {
      const success = await resendOtp();
      if (success) {
        toast({
          title: "OTP Resent!",
          description: "A new OTP has been sent to your email.",
        });
        setResendDisabled(true);
        setCountdown(60);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error("Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1px] h-[1px] bg-white/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl" />

          <Card className="relative bg-gray-900/90 border-gray-800 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-sm">
            {/* <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted-foreground via-purple-500 to-blue-500" /> */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />

            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      Verify Your Email
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {type === "signup"
                        ? "Complete your registration"
                        : "Secure your login"}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300">
                      Verification code sent to
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {maskedEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">
                  Enter 6-digit verification code
                </Label>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <Input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className={cn(
                          "otp-input h-14 w-12 text-center text-xl font-bold bg-gray-800/50 border-gray-700 text-white",
                          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                          error && "border-red-500/50",
                          success && "border-green-500/50",
                          "transition-all duration-200",
                        )}
                        disabled={verifying || success}
                      />

                      {document.activeElement === inputRefs.current[index] && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-blue-500"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Verification progress</span>
                    <span className="font-medium text-white">
                      {otp.filter((d) => d !== "").length}/6
                    </span>
                  </div>
                  <Progress
                    value={(otp.filter((d) => d !== "").length / 6) * 100}
                    className="h-1.5 bg-gray-800"
                  />
                </div>
              </div>

              {/* Timer and resend */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span
                    className={cn(
                      "font-medium",
                      countdown > 10 ? "text-gray-400" : "text-yellow-400",
                    )}
                  >
                    {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={resendLoading || resendDisabled}
                  className="text-sm gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>

              {/* Status messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-400">
                        {type === "signup"
                          ? "Account verified successfully! Redirecting..."
                          : "Login verified successfully! Redirecting..."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={handleSubmit}
                disabled={otp.some((d) => d === "") || verifying || success}
                // className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/30"
                className="w-full bg-gradient-primary hover:to-purple-500 text-white shadow-lg shadow-blue-500/30"
              >
                {verifying ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verified!
                  </>
                ) : (
                  <>
                    Verify Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By verifying, you agree to our{" "}
                  <button className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </button>
                </p>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>
                  Your information is protected with 256-bit encryption
                </span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OtpVerification;
