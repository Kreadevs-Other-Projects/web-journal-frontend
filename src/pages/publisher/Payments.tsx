import { useEffect, useState, useRef } from "react";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Check,
  X,
  Loader2,
  CreditCard,
  FileText,
  Bell,
  XCircle,
  Mail,
} from "lucide-react";
import { getFileUrl } from "@/lib/utils";
import { UserRole } from "@/lib/roles";

interface PaperPayment {
  id: string;
  paper_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  paper_title: string;
  journal_name: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  status: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
  created_at: string;
  rejection_reason?: string;
  last_reminder_sent_at?: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    payment_review: {
      label: "Receipt Uploaded",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    success: {
      label: "Approved",
      className: "bg-green-100 text-green-800 border-green-300",
    },
    failed: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-300",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge className={`border text-xs ${cfg.className} hover:${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

export default function PublisherPayments() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [pending, setPending] = useState<PaperPayment[]>([]);
  const [all, setAll] = useState<PaperPayment[]>([]);
  const [rejected, setRejected] = useState<PaperPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaperPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const [resendingInvoice, setResendingInvoice] = useState<string | null>(null);

  // Reminder state: paperId → 'idle' | 'sending' | 'sent'
  const [reminderState, setReminderState] = useState<
    Record<string, "idle" | "sending" | "sent">
  >({});
  const [reminderTarget, setReminderTarget] = useState<PaperPayment | null>(
    null,
  );
  const reminderTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes, rejectedRes] = await Promise.all([
        fetch(`${url}/payments/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${url}/payments/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${url}/payments/rejected`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [pd, ad, rd] = await Promise.all([
        pendingRes.json(),
        allRes.json(),
        rejectedRes.json(),
      ]);
      if (pd.success) setPending(pd.payments);
      if (ad.success) setAll(ad.payments);
      if (rd.success) setRejected(rd.payments);
    } catch {
      toast({ title: "Error loading payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const handleApprove = async (payment: PaperPayment) => {
    setProcessing(payment.paper_id);
    try {
      const res = await fetch(
        `${url}/payments/paper/${payment.paper_id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ approved: true }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({
        title: "Payment approved",
        description: `Payment approved for "${payment.paper_title}". You can now publish this paper from the Publish Papers section.`,
        duration: 6000,
      });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleResendInvoice = async (payment: PaperPayment) => {
    setResendingInvoice(payment.paper_id);
    try {
      const res = await fetch(
        `${url}/payments/paper/${payment.paper_id}/resend-invoice`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({
        title: "Invoice resent",
        description: `Invoice resent to ${payment.author_email}`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResendingInvoice(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please enter a rejection reason.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(rejectTarget.paper_id);
    try {
      const res = await fetch(
        `${url}/payments/paper/${rejectTarget.paper_id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved: false,
            rejection_reason: rejectionReason,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({
        title: "Receipt rejected",
        description: "Author has been notified.",
      });
      setRejectTarget(null);
      setRejectionReason("");
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const confirmSendReminder = async () => {
    if (!reminderTarget) return;
    const paperId = reminderTarget.paper_id;
    setReminderTarget(null);
    setReminderState((prev) => ({ ...prev, [paperId]: "sending" }));
    try {
      const res = await fetch(`${url}/payments/paper/${paperId}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setReminderState((prev) => ({ ...prev, [paperId]: "sent" }));
      toast({
        title: "Reminder sent",
        description: `Reminder sent to ${data.authorEmail}`,
      });
      // Reset button after 3s
      reminderTimers.current[paperId] = setTimeout(() => {
        setReminderState((prev) => ({ ...prev, [paperId]: "idle" }));
      }, 3000);
    } catch (e: any) {
      setReminderState((prev) => ({ ...prev, [paperId]: "idle" }));
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const ReminderButton = ({ payment }: { payment: PaperPayment }) => {
    const state = reminderState[payment.paper_id] ?? "idle";
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-xs"
        disabled={state === "sending" || state === "sent"}
        onClick={() => setReminderTarget(payment)}
      >
        {state === "sending" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : state === "sent" ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Bell className="h-3 w-3" />
        )}
        {state === "sent" ? "Sent ✓" : "Send Reminder"}
      </Button>
    );
  };

  const PaymentCard = ({
    payment,
    showReminder = false,
  }: {
    payment: PaperPayment;
    showReminder?: boolean;
  }) => {
    const isPdf = payment.receipt_url?.endsWith(".pdf");
    const receiptFullUrl = payment.receipt_url
      ? getFileUrl(payment.receipt_url)
      : null;

    return (
      <Card className="mb-3">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">
                {payment.paper_title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {payment.journal_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {payment.author_name} · {payment.author_email}
              </p>
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Invoice</p>
              <p className="font-mono font-medium">
                {payment.invoice_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-bold text-sm">
                {payment.currency} {Number(payment.total_amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Receipt Uploaded</p>
              <p>{formatDate(payment.receipt_uploaded_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p>{formatDate(payment.created_at)}</p>
            </div>
          </div>

          {/* Receipt thumbnail */}
          {receiptFullUrl && (
            <div className="flex items-center gap-2">
              {!isPdf ? (
                <div
                  className="h-16 w-16 rounded-md border overflow-hidden cursor-pointer shrink-0 bg-muted"
                  onClick={() => setViewReceiptUrl(receiptFullUrl)}
                >
                  <img
                    src={receiptFullUrl}
                    alt="Receipt"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="h-16 w-16 rounded-md border flex flex-col items-center justify-center cursor-pointer bg-muted shrink-0 gap-1"
                  onClick={() => window.open(receiptFullUrl, "_blank")}
                >
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">PDF</span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => window.open(receiptFullUrl, "_blank")}
              >
                <Eye className="h-3 w-3" /> View Receipt
              </Button>
            </div>
          )}

          {payment.rejection_reason && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Rejection reason: {payment.rejection_reason}
            </p>
          )}

          {payment.last_reminder_sent_at && (
            <p className="text-xs text-muted-foreground">
              Last reminder sent: {formatDate(payment.last_reminder_sent_at)}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {/* Approve/Reject for pending review */}
            {payment.status === "payment_review" && (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(payment)}
                  disabled={processing === payment.paper_id}
                >
                  {processing === payment.paper_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Approve Payment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => {
                    setRejectTarget(payment);
                    setRejectionReason("");
                  }}
                  disabled={processing === payment.paper_id}
                >
                  <X className="h-3 w-3" /> Reject
                </Button>
              </>
            )}

            {/* Resend Invoice for pending payments (no receipt uploaded yet) */}
            {payment.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                disabled={resendingInvoice === payment.paper_id}
                onClick={() => handleResendInvoice(payment)}
              >
                {resendingInvoice === payment.paper_id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3" />
                )}
                Resend Invoice
              </Button>
            )}

            {/* Reminder button shown when explicitly requested */}
            {showReminder && <ReminderButton payment={payment} />}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout
      role={(user?.role as UserRole) ?? "publisher"}
      userName={user?.username}
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Paper Payments</h1>
            <p className="text-muted-foreground text-sm">
              Review and approve author payment receipts.
            </p>
          </div>
          {pending.length > 0 && (
            <Badge className="ml-auto bg-orange-500 text-white">
              {pending.length} pending
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="pending">
                Pending Review{" "}
                {pending.length > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected{" "}
                {rejected.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {rejected.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pending.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  No receipts pending review.
                </div>
              ) : (
                pending.map((p) => (
                  <PaymentCard key={p.id} payment={p} showReminder />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejected.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  No rejected payments.
                </div>
              ) : (
                rejected.map((p) => (
                  <Card
                    key={p.id}
                    className="mb-3 border-red-200 dark:border-red-900/30"
                  >
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug truncate">
                            {p.paper_title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.journal_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.author_name} · {p.author_email}
                          </p>
                        </div>
                        <Badge className="border text-xs bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                          Rejected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Invoice</p>
                          <p className="font-mono font-medium">
                            {p.invoice_number || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-bold text-sm">
                            {p.currency} {Number(p.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date Rejected</p>
                          <p>{formatDate(p.receipt_uploaded_at)}</p>
                        </div>
                      </div>

                      {p.rejection_reason && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2">
                          <p className="text-xs font-medium text-red-700 dark:text-red-400">
                            Rejection Reason
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                            {p.rejection_reason}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <ReminderButton payment={p} />
                        {p.receipt_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-xs"
                            onClick={() => {
                              const full = getFileUrl(p.receipt_url!);
                              p.receipt_url!.endsWith(".pdf")
                                ? window.open(full, "_blank")
                                : setViewReceiptUrl(full);
                            }}
                          >
                            <Eye className="h-3 w-3" /> View Receipt
                          </Button>
                        )}
                      </div>

                      {p.last_reminder_sent_at && (
                        <p className="text-xs text-muted-foreground">
                          Last reminder sent:{" "}
                          {formatDate(p.last_reminder_sent_at)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="all">
              {all.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  No payment records yet.
                </div>
              ) : (
                all.map((p) => (
                  <PaymentCard key={p.id} payment={p} showReminder />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Receipt image viewer */}
      <Dialog
        open={!!viewReceiptUrl}
        onOpenChange={() => setViewReceiptUrl(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {viewReceiptUrl && (
            <img
              src={viewReceiptUrl}
              alt="Receipt"
              className="w-full rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection reason modal */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={() => {
          setRejectTarget(null);
          setRejectionReason("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Please provide a reason. The author will be notified by email.
            </p>
            <div>
              <Label className="text-sm mb-1.5 block">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt is unclear, incorrect amount, wrong account…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={processing === rejectTarget?.paper_id}
            >
              {processing === rejectTarget?.paper_id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder confirmation modal */}
      <Dialog
        open={!!reminderTarget}
        onOpenChange={() => setReminderTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Send payment reminder to{" "}
            <strong>{reminderTarget?.author_email}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmSendReminder} className="gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
