import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  Globe,
  FileText,
  User,
  Mail,
  Hash,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Layers,
  Bell,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Edit3,
  Info,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface JournalIssue {
  id: string;
  issue: number;
  volume: number;
  year: number;
  label: string;
  issueStatus: string;
  article_index: number;
  created_at: string;
  published_at: string;
  updated_at: string | null;
  paper_count?: number;
}

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  description: string;
  status: string;
  website_url: string;
  owner_id: string;
  chief_editor_id: string | null;
  journal_manager_id: string | null;
  created_at: string;
  updated_at?: string | null;
  chief_editor: User | null;
  journal_manager: User | null;
  owner: User;
  issues: JournalIssue[];
  is_taken_down?: boolean;
  takedown_reason?: string;
  publication_fee?: number | null;
  currency?: string | null;

  // These fields are populated by the new LEFT JOIN subquery
  chief_editor_invitation_status?:
    | "pending"
    | "expired"
    | "accepted"
    | "cancelled";
  chief_editor_email?: string;
  journal_manager_invitation_status?:
    | "pending"
    | "expired"
    | "accepted"
    | "cancelled";
  journal_manager_email?: string;
}

/* PAYMENT_DISABLED: Payment step hidden per client instruction
function calcProration(
  issues: JournalIssue[],
  selectedIssue: JournalIssue,
  fullAmount: number,
) {
  const firstIssue = issues.find((i) => i.article_index === 1);
  if (!firstIssue) return null;
  const startDate = new Date(firstIssue.created_at);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysRemaining = Math.max(
    0,
    Math.round(
      (endDate.getTime() - new Date(selectedIssue.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  return {
    proratedAmount: parseFloat(
      ((fullAmount * daysRemaining) / totalDays).toFixed(2),
    ),
  };
}
*/

export default function PublisherDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // PAYMENT_DISABLED: const [invoiceAmount, setInvoiceAmount] = useState<number | "">("");
  const [approving, setApproving] = useState(false);
  // PAYMENT_DISABLED: const [sendingInvoice, setSendingInvoice] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<JournalIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [pendingRequestsOpen, setPendingRequestsOpen] = useState(false);
  const [issueRequests, setIssueRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [resetingIssues, setResetingIssues] = useState(false);
  const [replaceCEOpen, setReplaceCEOpen] = useState(false);
  const [replaceCEStep, setReplaceCEStep] = useState<"confirm" | "invite">(
    "confirm",
  );
  const [replacingCE, setReplacingCE] = useState(false);
  const [invitingCE, setInvitingCE] = useState(false);
  const [newCEForm, setNewCEForm] = useState({ name: "", email: "" });
  const [replaceJMOpen, setReplaceJMOpen] = useState(false);
  const [replaceJMStep, setReplaceJMStep] = useState<"confirm" | "invite">(
    "confirm",
  );
  const [replacingJM, setReplacingJM] = useState(false);
  const [invitingJM, setInvitingJM] = useState(false);
  const [newJMForm, setNewJMForm] = useState({ name: "", email: "" });
  const [issuePreview, setIssuePreview] = useState<{
    label: string;
    volume: number;
    issue: number;
    year: number;
  } | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);

  // APC Settings
  const [apcFee, setApcFee] = useState<string>("");
  const [apcCurrency, setApcCurrency] = useState<string>("USD");
  const [savingAPC, setSavingAPC] = useState(false);
  const [isEditingAPC, setIsEditingAPC] = useState(false);
  const [originalApcFee, setOriginalApcFee] = useState<string>("");
  const [originalApcCurrency, setOriginalApcCurrency] = useState<string>("USD");
  const [showUnsavedAPCModal, setShowUnsavedAPCModal] = useState(false);
  const [pendingAPCNavigation, setPendingAPCNavigation] = useState<
    (() => void) | null
  >(null);
  const [showPublisherHint, setShowPublisherHint] = useState(
    () => !localStorage.getItem("hint_dismissed_publisher"),
  );
  const dismissPublisherHint = () => {
    localStorage.setItem("hint_dismissed_publisher", "true");
    setShowPublisherHint(false);
  };

  const statusMap: Record<string, string[]> = {
    all: ["draft", "active", "suspended", "archived"],
    pending: ["draft"],
    approved: ["active"],
  };

  const [tab, setTab] = useState("all");

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch journals");
      const json = await res.json();

      setJournals(json.journals ?? []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load journals",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveJournal = async (journalId: string, issueId: string) => {
    try {
      setApproving(true);

      const res = await fetch(`${url}/publisher/approveJournal/${journalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ issueId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to approve payment");
      }
      toast({
        title: "Success",
        description: "Journal issue approved successfully",
      });

      fetchJournals();
      setDetailsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Approval failed",
      });
    } finally {
      setApproving(false);
    }
  };

  const fetchIssuePreview = async (journalId: string) => {
    try {
      const res = await fetch(
        `${url}/journal-issue/${journalId}/next-issue-preview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setIssuePreview(data.preview);
    } catch {}
  };

  const createIssue = async () => {
    if (!selectedJournal) return;
    try {
      setCreatingIssue(true);
      const res = await fetch(
        `${url}/journal-issue/addJournalIssue/${selectedJournal.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create issue");
      toast({
        title: "Success",
        description: `Issue created: ${data.issue?.label}`,
      });
      setCreateIssueOpen(false);
      setIssuePreview(null);
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setCreatingIssue(false);
    }
  };

  const fetchPendingIssueRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch(`${url}/journal-issue/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIssueRequests(data.requests || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch requests",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const reviewIssueRequest = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setReviewingRequest(requestId);
      const res = await fetch(
        `${url}/journal-issue/requests/${requestId}/review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: status }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: status === "approved" ? "Request Approved" : "Request Rejected",
        description: data.message || "Done.",
      });
      setIssueRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (status === "approved") fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setReviewingRequest(null);
    }
  };

  /* PAYMENT_DISABLED: Payment step hidden per client instruction
  const sendInvoice = async (journalId: string, issueId: string) => {
    if (!invoiceAmount || invoiceAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid invoice amount",
      });
      return;
    }

    try {
      setSendingInvoice(true);

      const endpoint = `${url}/publisher/sendInvoice`;

      const payload = {
        journalId,
        issueId,
        amount: invoiceAmount,
      };

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      const res = await fetch(endpoint, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send invoice");
      }

      toast({
        title: "Invoice Sent",
        description: `Invoice of ${invoiceAmount} PKR sent to the journal owner`,
      });

      setInvoiceAmount("");
      setDetailsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Invoice Failed",
        description: err.message || "Could not send invoice",
      });
    } finally {
      setSendingInvoice(false);
    }
  };
  */

  const replaceChiefEditor = async () => {
    if (!selectedJournal) return;
    try {
      setReplacingCE(true);
      const res = await fetch(
        `${url}/publisher/journals/${selectedJournal.id}/chief-editor`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Chief Editor Removed",
        description: "You can now invite a new chief editor.",
      });
      setReplaceCEStep("invite");
      // Refresh journal list in background so card reflects null CE
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setReplacingCE(false);
    }
  };

  const inviteNewCE = async () => {
    if (!selectedJournal || !newCEForm.name || !newCEForm.email) return;
    try {
      setInvitingCE(true);
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCEForm.name,
          email: newCEForm.email,
          role: "chief_editor",
          journal_id: selectedJournal.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newCEForm.email}`,
      });
      setReplaceCEOpen(false);
      setReplaceCEStep("confirm");
      setNewCEForm({ name: "", email: "" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setInvitingCE(false);
    }
  };

  const replaceJournalManager = async () => {
    if (!selectedJournal) return;
    try {
      setReplacingJM(true);
      const res = await fetch(
        `${url}/publisher/journals/${selectedJournal.id}/journal-manager`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Journal Manager Removed",
        description: "You can now invite a new journal manager.",
      });
      setReplaceJMStep("invite");
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setReplacingJM(false);
    }
  };

  const inviteNewJM = async () => {
    if (!selectedJournal || !newJMForm.name || !newJMForm.email) return;
    try {
      setInvitingJM(true);
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newJMForm.name,
          email: newJMForm.email,
          role: "journal_manager",
          journal_id: selectedJournal.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newJMForm.email}`,
      });
      setReplaceJMOpen(false);
      setReplaceJMStep("confirm");
      setNewJMForm({ name: "", email: "" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setInvitingJM(false);
    }
  };

  const resendJMInvitation = async () => {
    if (!selectedJournal || !selectedJournal.journal_manager_email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found to resend the invitation.",
      });
      return;
    }

    try {
      setResendingJM(true);
      const res = await fetch(`${url}/invitations/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journal_id: selectedJournal.id,
          email: selectedJournal.journal_manager_email,
          role: "journal_manager",
          title: selectedJournal.title,
          journalManagerName: selectedJournal.journal_manager,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Resend failed");

      toast({
        title: "Invitation Resent",
        description: `A fresh invitation was sent to ${selectedJournal.journal_manager_email}`,
      });

      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setResendingJM(false);
    }
  };
  const [resending, setResending] = useState(false);
  const [resendingJM, setResendingJM] = useState(false);

  // Takedown state
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [takedownTarget, setTakedownTarget] = useState<{
    type: "journal";
    id: string;
    title: string;
  } | null>(null);
  const [takedownReason, setTakedownReason] = useState("");
  const [takedownProcessing, setTakedownProcessing] = useState(false);

  const resendInvitation = async () => {
    // Only proceed if we have a journal and an email to send to
    if (!selectedJournal || !selectedJournal.chief_editor_email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found to resend the invitation.",
      });
      return;
    }

    try {
      setResending(true);
      const res = await fetch(`${url}/invitations/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journal_id: selectedJournal.id,
          email: selectedJournal.chief_editor_email,
          role: "chief_editor",
          title: selectedJournal.title,
          chiefEditorName: selectedJournal.chief_editor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Resend failed");

      toast({
        title: "Invitation Resent",
        description: `A fresh invitation was sent to ${selectedJournal.chief_editor_email}`,
      });

      fetchJournals(); // Refresh list to change status from 'expired' to 'pending'
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setResending(false);
    }
  };

  const handleIssueReset = async () => {
    if (resetingIssues) return;
    if (
      !window.confirm(
        "This will close ALL open journal issues platform-wide. Continue?",
      )
    )
      return;
    setResetingIssues(true);
    try {
      const res = await fetch(`${url}/publisher/issues/reset-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      toast({ title: "Issues Reset", description: data.message });
      fetchJournals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setResetingIssues(false);
    }
  };

  const handleTakedown = async () => {
    if (!takedownTarget || !takedownReason.trim()) return;
    setTakedownProcessing(true);
    try {
      const res = await fetch(
        `${url}/publisher/journals/${takedownTarget.id}/takedown`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: takedownReason }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Journal taken down",
        description: `"${takedownTarget.title}" is now hidden from public view.`,
      });
      setTakedownModalOpen(false);
      setTakedownReason("");
      setTakedownTarget(null);
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setTakedownProcessing(false);
    }
  };

  const handleRestoreJournal = async (
    journalId: string,
    journalTitle: string,
  ) => {
    try {
      const res = await fetch(
        `${url}/publisher/journals/${journalId}/restore`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Journal restored",
        description: `"${journalTitle}" is now visible to the public.`,
      });
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-500/20 text-green-400 border-green-500/30"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          >
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="default"
            className="bg-red-500/20 text-red-400 border-red-500/30"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge
            variant="default"
            className="bg-gray-500/20 text-gray-400 border-gray-500/30"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  useEffect(() => {
    if (user) fetchJournals();
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        isEditingAPC &&
        (apcFee !== originalApcFee || apcCurrency !== originalApcCurrency)
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditingAPC, apcFee, originalApcFee, apcCurrency, originalApcCurrency]);

  useEffect(() => {
    if (!detailsModalOpen) {
      setSelectedIssue(null);
      setIsEditingAPC(false);
    } else if (selectedJournal) {
      const feeValue =
        selectedJournal.publication_fee != null
          ? String(selectedJournal.publication_fee)
          : "";
      const currencyValue = selectedJournal.currency || "USD";
      setApcFee(feeValue);
      setApcCurrency(currencyValue);
      setOriginalApcFee(feeValue);
      setOriginalApcCurrency(currencyValue);
      setIsEditingAPC(false);
    }
  }, [detailsModalOpen, selectedJournal]);

  const handleSaveAPC = async () => {
    if (!selectedJournal) return;
    const fee = apcFee === "" ? 0 : parseFloat(apcFee);
    if (isNaN(fee) || fee < 0) {
      toast({
        variant: "destructive",
        title: "Invalid fee",
        description: "Fee must be a non-negative number.",
      });
      return;
    }
    try {
      setSavingAPC(true);
      const res = await fetch(`${url}/journal/${selectedJournal.id}/apc`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          publication_fee: fee,
          currency: apcCurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "APC Settings Saved",
        description: `Fee set to ${fee} ${apcCurrency} per page.`,
      });
      setJournals((prev) =>
        prev.map((j) =>
          j.id === selectedJournal.id
            ? { ...j, publication_fee: fee, currency: apcCurrency }
            : j,
        ),
      );
      setSelectedJournal((j) =>
        j ? { ...j, publication_fee: fee, currency: apcCurrency } : j,
      );
      setOriginalApcFee(String(fee));
      setOriginalApcCurrency(apcCurrency);
      setIsEditingAPC(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setSavingAPC(false);
    }
  };

  const hasUnsavedAPCChanges =
    isEditingAPC &&
    (apcFee !== originalApcFee || apcCurrency !== originalApcCurrency);

  const handleCancelAPC = () => {
    if (hasUnsavedAPCChanges) {
      setShowUnsavedAPCModal(true);
    } else {
      setIsEditingAPC(false);
    }
  };

  const handleDiscardAPCChanges = () => {
    setApcFee(originalApcFee);
    setApcCurrency(originalApcCurrency);
    setIsEditingAPC(false);
    setShowUnsavedAPCModal(false);
  };

  const handleSaveAndContinueAPC = async () => {
    await handleSaveAPC();
    setShowUnsavedAPCModal(false);
    if (pendingAPCNavigation) {
      pendingAPCNavigation();
      setPendingAPCNavigation(null);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        {showPublisherHint && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Getting Started
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Start by creating your first journal. Once created, you can
                invite a Chief Editor and Journal Manager, then open it for
                paper submissions.
              </p>
            </div>
            <button
              onClick={dismissPublisherHint}
              className="text-blue-400 hover:text-blue-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Publisher Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage journals and process approvals
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 rounded-lg align-item-center">
              <p className="text-sm text-muted-foreground">
                Total Journals:{" "}
                <span className="text-xl font-bold text-foreground">
                  {journals.length}
                </span>
              </p>
            </div>
            <Button onClick={fetchJournals} variant="outline" size="sm">
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 relative"
              onClick={() => {
                fetchPendingIssueRequests();
                setPendingRequestsOpen(true);
              }}
            >
              <Bell className="h-4 w-4" /> Issue Requests
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleIssueReset}
              disabled={resetingIssues}
            >
              <RotateCcw className="h-4 w-4" />
              {resetingIssues ? "Resetting..." : "Reset Issues"}
            </Button>
            <Button
              onClick={() => navigate("/publisher/create-journal")}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Journal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.filter((j) => j.status === "draft").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.filter((j) => j.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold text-foreground">
                    {journals.reduce(
                      (acc, journal) => acc + journal.issues.length,
                      0,
                    )}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Journals</h2>
            <Tabs value={tab} onValueChange={setTab} className="w-[300px]">
              <TabsList className="glass-card">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Draft</TabsTrigger>
                <TabsTrigger value="approved">Active</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : journals.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-muted-foreground text-lg">
                  No journals found
                </p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  Journals will appear here once submitted
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {journals
                .filter((journal) => statusMap[tab].includes(journal.status))
                .map((journal) => (
                  <Card
                    key={journal.id}
                    className={`glass-card hover:shadow-lg transition-all duration-300 hover:border-blue-500/50 cursor-pointer group ${journal.is_taken_down ? "border-red-500/40 opacity-75" : ""}`}
                    onClick={() => {
                      setSelectedJournal(journal);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-blue-500 transition-colors flex-1 min-w-0">
                          <BookOpen className="h-5 w-5 shrink-0" />
                          <span className="line-clamp-1">{journal.title}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          {journal.is_taken_down ? (
                            <Badge className="border text-xs bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Taken Down
                            </Badge>
                          ) : (
                            getStatusBadge(journal.status)
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  navigate(
                                    `/publisher/journals/${journal.id}/edit`,
                                  )
                                }
                              >
                                <Edit3 className="h-4 w-4" /> Edit Journal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {journal.is_taken_down ? (
                                <DropdownMenuItem
                                  className="text-green-600 gap-2"
                                  onClick={() =>
                                    handleRestoreJournal(
                                      journal.id,
                                      journal.title,
                                    )
                                  }
                                >
                                  <ShieldCheck className="h-4 w-4" /> Restore
                                  Journal
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-red-600 gap-2"
                                  onClick={() => {
                                    setTakedownTarget({
                                      type: "journal",
                                      id: journal.id,
                                      title: journal.title,
                                    });
                                    setTakedownReason("");
                                    setTakedownModalOpen(true);
                                  }}
                                >
                                  <ShieldOff className="h-4 w-4" /> Take Down
                                  Journal
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{journal.issn}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {journal.description}
                        </p>
                        {journal.is_taken_down && journal.takedown_reason && (
                          <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                            Reason: {journal.takedown_reason}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(journal.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {journal.issues.length} issues
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground"
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </div>

        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            {/* Header Section with Gradient */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm border-b">
              <div className="p-6">
                <DialogHeader className="mb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <BookOpen className="h-5 w-5 text-blue-400" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">
                          {selectedJournal?.title}
                        </DialogTitle>
                      </div>
                      <DialogDescription className="text-base">
                        Complete journal information and management
                      </DialogDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        navigate(
                          `/publisher/journals/${selectedJournal?.id}/edit`,
                        );
                      }}
                    >
                      <Edit3 className="h-4 w-4" /> Edit Journal
                    </Button>
                  </div>
                </DialogHeader>

                {/* Quick Stats Row */}
                {selectedJournal && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">ISSN</p>
                      <p className="text-sm font-mono font-semibold">
                        {selectedJournal.issn}
                      </p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex justify-center">
                        {getStatusBadge(selectedJournal.status)}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Issues</p>
                      <p className="text-sm font-semibold">
                        {selectedJournal.issues.length}
                      </p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-semibold">
                        {new Date(
                          selectedJournal.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
              {/* Description Card */}
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedJournal?.description}
                  </p>
                  {selectedJournal?.website_url && (
                    <a
                      href={selectedJournal.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline mt-2"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {selectedJournal.website_url}
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* People Section */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <User className="h-4 w-4 text-purple-400" />
                      </div>
                      People
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Owner */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-transparent">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <User className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Owner
                        </p>
                        <p className="font-semibold">
                          {selectedJournal?.owner.name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {selectedJournal?.owner.email}
                        </p>
                      </div>
                    </div>

                    {/* Chief Editor */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-transparent">
                      <div className="p-2 bg-blue-500/20 rounded-full">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Chief Editor
                          </p>
                          <div className="flex gap-2">
                            {selectedJournal?.chief_editor_invitation_status ===
                              "expired" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-amber-500"
                                onClick={resendInvitation}
                                disabled={resending}
                              >
                                <Bell className="h-3 w-3" />
                                {resending ? "Sending..." : "Resend"}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => {
                                setReplaceCEStep(
                                  selectedJournal?.chief_editor
                                    ? "confirm"
                                    : "invite",
                                );
                                setReplaceCEOpen(true);
                              }}
                            >
                              {selectedJournal?.chief_editor
                                ? "Replace"
                                : "Invite"}
                            </Button>
                          </div>
                        </div>
                        {selectedJournal?.chief_editor ? (
                          <>
                            <p className="font-semibold">
                              {selectedJournal.chief_editor.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {selectedJournal.chief_editor.email}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-amber-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {selectedJournal?.chief_editor_invitation_status ===
                            "expired"
                              ? `Invitation to ${selectedJournal.chief_editor_email} expired`
                              : "No chief editor assigned"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Journal Manager */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-500/5 to-transparent">
                      <div className="p-2 bg-indigo-500/20 rounded-full">
                        <User className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Journal Manager
                          </p>
                          <div className="flex gap-2">
                            {selectedJournal?.journal_manager_invitation_status ===
                              "expired" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-amber-500"
                                onClick={resendJMInvitation}
                                disabled={resendingJM}
                              >
                                <Bell className="h-3 w-3" />
                                {resendingJM ? "Sending..." : "Resend"}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => {
                                setReplaceJMStep(
                                  selectedJournal?.journal_manager
                                    ? "confirm"
                                    : "invite",
                                );
                                setReplaceJMOpen(true);
                              }}
                            >
                              {selectedJournal?.journal_manager
                                ? "Replace"
                                : "Invite"}
                            </Button>
                          </div>
                        </div>
                        {selectedJournal?.journal_manager ? (
                          <>
                            <p className="font-semibold">
                              {selectedJournal.journal_manager.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {selectedJournal.journal_manager.email}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-amber-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {selectedJournal?.journal_manager_invitation_status ===
                            "expired"
                              ? `Invitation to ${selectedJournal.journal_manager_email} expired`
                              : "No journal manager assigned"}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* APC Settings Section */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/20 rounded-lg">
                        <FileText className="h-4 w-4 text-green-400" />
                      </div>
                      Article Processing Charge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {!isEditingAPC ? (
                      <div className="space-y-4">
                        <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/10">
                          <p className="text-sm text-muted-foreground mb-2">
                            Publication Fee per Article
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {originalApcFee &&
                            parseFloat(originalApcFee) > 0 ? (
                              <>
                                {originalApcCurrency}{" "}
                                <span className="text-4xl">
                                  {parseFloat(originalApcFee).toFixed(2)}
                                </span>
                                <span className="text-sm font-normal text-muted-foreground">
                                  {" "}
                                  per Article
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl text-muted-foreground">
                                No fee set
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsEditingAPC(true)}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit APC
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Fee per page
                          </Label>
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={apcFee}
                              onChange={(e) => setApcFee(e.target.value)}
                              placeholder="0.00"
                              className="flex-1"
                            />
                            <select
                              value={apcCurrency}
                              onChange={(e) => setApcCurrency(e.target.value)}
                              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="USD">USD</option>
                              <option value="PKR">PKR</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCancelAPC}
                            variant="outline"
                            className="flex-1"
                            disabled={savingAPC}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveAPC}
                            disabled={savingAPC}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {savingAPC ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Issues Section */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/20 rounded-lg">
                        <Layers className="h-4 w-4 text-orange-400" />
                      </div>
                      Journal Issues
                      <Badge variant="secondary" className="ml-2">
                        {selectedJournal?.issues.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setCreateIssueOpen(true);
                        if (selectedJournal)
                          fetchIssuePreview(selectedJournal.id);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Issue
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedJournal?.issues.map((issue) => {
                      const isSelected = selectedIssue?.id === issue.id;
                      return (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 shadow-md"
                        : "border-border hover:border-blue-500/50 hover:bg-blue-500/5"
                    }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {issue.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Vol {issue.volume} • Issue {issue.issue} •{" "}
                                {issue.year}
                              </p>
                            </div>
                            <Badge
                              variant={
                                issue.issueStatus === "published"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {issue.issueStatus}
                            </Badge>
                          </div>
                          {issue.paper_count != null && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Papers</span>
                                <span>{issue.paper_count}/99</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                  style={{
                                    width: `${Math.min((issue.paper_count / 99) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedJournal?.issues.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No issues created yet</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => {
                          setCreateIssueOpen(true);
                          if (selectedJournal)
                            fetchIssuePreview(selectedJournal.id);
                        }}
                      >
                        Create your first issue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={createIssueOpen}
          onOpenChange={(open) => {
            setCreateIssueOpen(open);
            if (!open) setIssuePreview(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Create New Issue
              </DialogTitle>
              <DialogDescription>{selectedJournal?.title}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {issuePreview ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Next issue
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {issuePreview.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {issuePreview.year}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                  Loading preview…
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateIssueOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createIssue} disabled={creatingIssue}>
                {creatingIssue ? "Creating..." : "Create Issue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={pendingRequestsOpen} onOpenChange={setPendingRequestsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pending Issue Requests
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject new issue requests from journal
              managers.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            {requestsLoading ? (
              <div className="py-8 text-center text-gray-400">Loading...</div>
            ) : issueRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No pending issue requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issueRequests.map((req) => (
                  <Card key={req.id} className="border border-border">
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-foreground text-base">
                              {req.label}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {req.journal_title || "Journal"}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1.5"
                              disabled={reviewingRequest === req.id}
                              onClick={() =>
                                reviewIssueRequest(req.id, "approved")
                              }
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              disabled={reviewingRequest === req.id}
                              onClick={() =>
                                reviewIssueRequest(req.id, "rejected")
                              }
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Volume
                            </p>
                            <p className="font-medium text-foreground">
                              {req.volume ?? "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Issue No.
                            </p>
                            <p className="font-medium text-foreground">
                              {req.issue_no ?? "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Year
                            </p>
                            <p className="font-medium text-foreground">
                              {req.year ?? new Date().getFullYear()}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Requested by:{" "}
                            <span className="font-medium text-foreground">
                              {req.requested_by_name || "Journal Manager"}
                            </span>
                          </span>
                          <span>
                            {new Date(req.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog
        open={replaceCEOpen}
        onOpenChange={(open) => {
          setReplaceCEOpen(open);
          if (!open) {
            setReplaceCEStep("confirm");
            setNewCEForm({ name: "", email: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {replaceCEStep === "confirm"
                ? "Replace Chief Editor"
                : "Invite New Chief Editor"}
            </DialogTitle>
            <DialogDescription>
              {replaceCEStep === "confirm"
                ? `This will remove ${selectedJournal?.chief_editor?.name ?? "the current chief editor"} from ${selectedJournal?.title} and cancel any pending invitations.`
                : "Enter the details of the new chief editor to send them an invitation."}
            </DialogDescription>
          </DialogHeader>

          {replaceCEStep === "confirm" ? (
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setReplaceCEOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={replacingCE}
                onClick={replaceChiefEditor}
              >
                {replacingCE ? "Removing..." : "Remove & Continue"}
              </Button>
            </DialogFooter>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={newCEForm.name}
                    onChange={(e) =>
                      setNewCEForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newCEForm.email}
                    onChange={(e) =>
                      setNewCEForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReplaceCEOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={invitingCE || !newCEForm.name || !newCEForm.email}
                  onClick={inviteNewCE}
                >
                  {invitingCE ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={replaceJMOpen}
        onOpenChange={(open) => {
          setReplaceJMOpen(open);
          if (!open) {
            setReplaceJMStep("confirm");
            setNewJMForm({ name: "", email: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {replaceJMStep === "confirm"
                ? "Replace Journal Manager"
                : "Invite New Journal Manager"}
            </DialogTitle>
            <DialogDescription>
              {replaceJMStep === "confirm"
                ? `This will remove ${selectedJournal?.journal_manager?.name ?? "the current journal manager"} from ${selectedJournal?.title} and cancel any pending invitations.`
                : "Enter the details of the new journal manager to send them an invitation."}
            </DialogDescription>
          </DialogHeader>

          {replaceJMStep === "confirm" ? (
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setReplaceJMOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={replacingJM}
                onClick={replaceJournalManager}
              >
                {replacingJM ? "Removing..." : "Remove & Continue"}
              </Button>
            </DialogFooter>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={newJMForm.name}
                    onChange={(e) =>
                      setNewJMForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newJMForm.email}
                    onChange={(e) =>
                      setNewJMForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReplaceJMOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={invitingJM || !newJMForm.name || !newJMForm.email}
                  onClick={inviteNewJM}
                >
                  {invitingJM ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Takedown confirmation modal */}
      <Dialog
        open={takedownModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTakedownModalOpen(false);
            setTakedownReason("");
            setTakedownTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" /> Take Down Journal
            </DialogTitle>
            <DialogDescription>
              This will hide <strong>{takedownTarget?.title}</strong> and all
              its issues and papers from public view. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm mb-1.5 block">
                Reason for Takedown <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                placeholder="e.g., Copyright violation, inappropriate content, author request…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTakedownModalOpen(false);
                setTakedownReason("");
                setTakedownTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleTakedown}
              disabled={!takedownReason.trim() || takedownProcessing}
            >
              {takedownProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}
              Confirm Takedown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved APC Changes Modal */}
      <Dialog open={showUnsavedAPCModal} onOpenChange={setShowUnsavedAPCModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved APC Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes to the APC price for this journal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 bg-muted/30 p-4 rounded-lg text-sm">
            <p className="text-muted-foreground mb-1">New price:</p>
            <p className="text-2xl font-bold text-foreground">
              {apcCurrency} {apcFee}{" "}
              <span className="text-base font-normal text-muted-foreground">
                per page
              </span>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDiscardAPCChanges}>
              Discard Changes
            </Button>
            <Button
              onClick={handleSaveAndContinueAPC}
              className="bg-green-600 hover:bg-green-700"
            >
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
