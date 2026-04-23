import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  FileText,
  Users,
  ArrowLeft,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  UserCheck,
  MessageSquare,
  FileEdit,
  Send,
  BarChart3,
  Globe,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PaperTimeline } from "@/components/PaperTimeline";

interface PaperVersion {
  id: string;
  file_url: string;
  version_label?: string;
  version_number: number;
  created_at?: string;
}

interface Paper {
  id: string;
  title: string;
  status: string;
  abstract?: string;
  authors?: string[];
  category?: string;
  submitted_at?: string;
  deadline?: string;
  versions: PaperVersion[];
  ce_override?: boolean;
}

interface Reviewer {
  id: string;
  assignment_id: string;
  assignment_status: string;
  assigned_at: string;
  username: string;
  email: string;
  expertise?: string[];
  decision?: string;
  comments?: string;
  confidential_comments?: string;
  reviewed_at?: string;
  all_reviews?: Array<{ decision: string; reviewed_at: string }>;
}

interface Review {
  id: string;
  reviewerName: string;
  status: string;
  submittedDate?: string;
}

export default function SubEditorDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedPaperLog, setSelectedPaperLog] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [allReviewers, setAllReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<PaperVersion | null>(
    null,
  );
  const [assignLoading, setAssignLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newReviewer, setNewReviewer] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showRevPassword, setShowRevPassword] = useState(false);
  const [creatingReviewer, setCreatingReviewer] = useState(false);

  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);

  // ── NEW: view mode toggle ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"pdf" | "web">("pdf");

  const [openDecisionDialog, setOpenDecisionDialog] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionAction, setDecisionAction] = useState<
    "approve" | "revision" | null
  >(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionEmail, setDecisionEmail] = useState("");
  const [decisionPassword, setDecisionPassword] = useState("");
  const [showDecisionPassword, setShowDecisionPassword] = useState(false);
  const [paperReviews, setPaperReviews] = useState<any[]>([]);
  const [lastDecision, setLastDecision] = useState<{
    action: string;
    date: string;
  } | null>(null);

  const [openReviewersDialog, setOpenReviewersDialog] = useState(false);
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({});
  const [openAssignReviewerDialog, setOpenAssignReviewerDialog] =
    useState(false);
  const [openPaperStats, setOpenPaperStats] = useState(false);
  const [openSuggestReviewer, setOpenSuggestReviewer] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    suggested_name: "",
    suggested_email: "",
    keywordInput: "",
    keywords: [] as string[],
    degreeInput: "",
    degrees: [] as string[],
  });
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    pendingRevision: 0,
    completed: 0,
    needsDecision: 0,
  });

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/subEditor/getSubEditorPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      setPapers(data.papers || []);
      setFilteredPapers(data.papers || []);

      const underReview = data.papers.filter(
        (p) => p.status === "under_review",
      ).length;
      const pendingRevision = data.papers.filter(
        (p) => p.status === "pending_revision",
      ).length;
      const completed = data.papers.filter(
        (p) => p.status === "resubmitted" || p.status === "completed",
      ).length;
      const needsDecision = data.papers.filter(
        (p) => p.status === "reviewed",
      ).length;

      setStats({
        total: data.papers.length,
        underReview,
        pendingRevision,
        completed,
        needsDecision,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load papers.",
        variant: "destructive",
      });
    }
  };

  const fetchAllReviewers = async () => {
    try {
      const res = await fetch(`${url}/subEditor/fetchReviewer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllReviewers(data.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load reviewers list.",
        variant: "destructive",
      });
    }
  };

  const assignReviewer = async () => {
    if (!selectedPaper || !selectedReviewerId) {
      toast({
        title: "Missing data",
        description: "Please select a reviewer.",
        variant: "destructive",
      });
      return;
    }
    try {
      setAssignLoading(true);
      const res = await fetch(
        `${url}/subEditor/assignReviewer/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewerId: selectedReviewerId }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to assign reviewer.");
      toast({
        title: "Reviewer Assigned",
        description: "Reviewer assigned successfully.",
      });
      setSelectedReviewerId("");
      setOpenAssignReviewerDialog(false);
      fetchReviewers(selectedPaper.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchReviewers = async (paperId: string) => {
    try {
      const res = await fetch(
        `${url}/subEditor/getReviewersForPaper/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setReviewers(data.data || []);
      setReminderSent({});
      setOpenReviewersDialog(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load reviewers.",
        variant: "destructive",
      });
    }
  };

  const sendReminderToReviewer = async (reviewerId: string) => {
    if (!selectedPaper) return;
    try {
      const res = await fetch(`${url}/subEditor/remind-reviewer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper_id: selectedPaper.id,
          reviewer_id: reviewerId,
        }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to send reminder");
      toast({ title: "Reminder sent", description: data.message });
      setReminderSent((prev) => ({ ...prev, [reviewerId]: true }));
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message || "Could not send reminder",
        variant: "destructive",
      });
    }
  };

  const inviteReviewerByEmail = async () => {
    if (!reviewerEmail) return;
    try {
      setInviteLoading(true);
      const res = await fetch(`${url}/subEditor/inviteReviewer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: reviewerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({
        title: "Invitation Sent",
        description: `Reviewer invited successfully to ${reviewerEmail}`,
      });
      setReviewerEmail("");
      fetchAllReviewers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Invitation Failed",
        description:
          err instanceof Error ? err.message : "Could not invite reviewer",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchDocxHtml = useCallback(
    async (paperId: string, versionId: string) => {
      try {
        setDocxLoading(true);
        setDocxHtml(null);
        const res = await fetch(
          `${url}/papers/${paperId}/version/${versionId}/html`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success && data.html) {
          setDocxHtml(data.html);
        } else {
          setDocxHtml("");
        }
      } catch {
        setDocxHtml("");
      } finally {
        setDocxLoading(false);
      }
    },
    [token],
  );

  const fetchPaperReviews = async (paperId: string) => {
    try {
      const res = await fetch(
        `${url}/subEditor/getReviewsForPaper/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setPaperReviews(data.reviews || []);
    } catch {
      setPaperReviews([]);
    }
  };

  const submitDecision = async () => {
    if (!selectedPaper || !decisionAction) return;
    if (!decisionEmail || !decisionPassword) {
      toast({
        title: "Credentials required",
        description: "Enter your email and password to confirm this decision.",
        variant: "destructive",
      });
      return;
    }
    if (decisionAction === "revision" && !decisionNote.trim()) {
      toast({
        title: "Comments required",
        description: `Comments are required when requesting a revision.`,
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmittingDecision(true);
      const res = await fetch(`${url}/subEditor/decision/${selectedPaper.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: decisionAction,
          comments: decisionNote,
          email: decisionEmail,
          password: decisionPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit decision");
      const actionStatusMap: Record<string, string> = {
        approve: "sub_editor_approved",
        revision: "pending_revision",
      };
      const newStatus = actionStatusMap[decisionAction!];
      toast({
        title: "Decision Submitted",
        description:
          decisionAction === "approve"
            ? "Paper forwarded to Chief Editor."
            : "Revision requested from author.",
      });
      setOpenDecisionDialog(false);
      setDecisionNote("");
      setDecisionEmail("");
      setDecisionPassword("");
      setLastDecision({
        action: decisionAction!,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
      setDecisionAction(null);
      setSelectedPaper((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
      setPapers((prev) =>
        prev.map((p) =>
          p.id === selectedPaper!.id ? { ...p, status: newStatus } : p,
        ),
      );
      setFilteredPapers((prev) =>
        prev.map((p) =>
          p.id === selectedPaper!.id ? { ...p, status: newStatus } : p,
        ),
      );
      fetchPapers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const createAndAssignReviewer = async () => {
    if (!newReviewer.name || !newReviewer.email || !newReviewer.password)
      return;
    if (!selectedPaper) return;
    try {
      setCreatingReviewer(true);
      const res = await fetch(`${url}/auth/create-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newReviewer.name,
          email: newReviewer.email,
          password: newReviewer.password,
          role: "reviewer",
          journal_id: undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create reviewer");

      const assignRes = await fetch(
        `${url}/subEditor/assignReviewer/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewerId: data.user.id }),
        },
      );
      const assignData = await assignRes.json();
      if (!assignRes.ok)
        throw new Error(assignData.message || "Failed to assign reviewer");

      toast({
        title: "Success",
        description: `${newReviewer.name} created and assigned as reviewer`,
      });
      setNewReviewer({ name: "", email: "", password: "" });
      setOpenAssignReviewerDialog(false);
      fetchAllReviewers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreatingReviewer(false);
    }
  };

  const suggestReviewer = async () => {
    if (!selectedPaper) return;
    if (!suggestForm.suggested_name || !suggestForm.suggested_email) {
      toast({
        title: "Missing fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSuggestLoading(true);
      const res = await fetch(
        `${url}/subEditor/suggestReviewer/${selectedPaper.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            suggested_name: suggestForm.suggested_name,
            suggested_email: suggestForm.suggested_email,
            keywords: suggestForm.keywords,
            degrees: suggestForm.degrees,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to suggest reviewer");
      toast({
        title: "Suggestion Sent",
        description:
          "Your reviewer suggestion has been sent to the Chief Editor for approval.",
      });
      setSuggestForm({
        suggested_name: "",
        suggested_email: "",
        keywordInput: "",
        keywords: [],
        degreeInput: "",
        degrees: [],
      });
      setOpenSuggestReviewer(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSuggestLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPapers();
      fetchAllReviewers();
    }
  }, [token]);

  useEffect(() => {
    if (!selectedVersion || !selectedPaper) return;
    const ext = selectedVersion.file_url?.split(".").pop()?.toLowerCase();
    if (ext === "docx" || ext === "tex" || ext === "latex") {
      fetchDocxHtml(selectedPaper.id, selectedVersion.id);
    } else {
      setDocxHtml(null);
    }
  }, [selectedVersion?.id, selectedPaper?.id, fetchDocxHtml]);

  // Reset view mode when switching papers
  useEffect(() => {
    setViewMode("pdf");
  }, [selectedPaper?.id]);

  useEffect(() => {
    let filtered = papers;
    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.authors?.some((author) =>
            author.toLowerCase().includes(searchQuery.toLowerCase()),
          ) ||
          paper.abstract?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (activeTab !== "all") {
      const statusMap: Record<string, string> = {
        under_review: "under_review",
        pending_revision: "pending_revision",
        completed: "resubmitted",
        reviewed: "reviewed",
      };
      filtered = filtered.filter(
        (paper) => paper.status === statusMap[activeTab],
      );
    }
    setFilteredPapers(filtered);
  }, [searchQuery, activeTab, papers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_review":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "pending_revision":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "resubmitted":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "reviewed":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "pending_revision":
        return <AlertCircle className="h-4 w-4" />;
      case "resubmitted":
        return <CheckCircle className="h-4 w-4" />;
      case "reviewed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ── Web View renderer ──────────────────────────────────────────────────────
  const renderWebView = () => {
    if (docxLoading) {
      return (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="border-b border-border px-8 py-4 bg-muted/30">
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          </div>
          <div className="px-10 py-8 space-y-3">
            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/4 bg-muted animate-pulse rounded mb-6" />
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-muted animate-pulse rounded"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (docxHtml) {
      return (
        <div className="rounded-xl border border-border bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
          {/* Sticky toolbar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-medium text-foreground truncate max-w-[320px]">
                {selectedPaper?.title}
              </span>
              <span className="shrink-0">·</span>
              <span className="shrink-0 text-xs">
                v{selectedVersion?.version_number}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs shrink-0"
              onClick={() =>
                window.open(getFileUrl(selectedVersion?.file_url), "_blank")
              }
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
          </div>

          {/* Document body */}
          <ScrollArea className="h-[580px]">
            <div className="max-w-[72ch] mx-auto px-10 py-10">
              <div
                className={cn(
                  "text-[15px] leading-[1.85] text-gray-800 dark:text-gray-200",
                  // Headings
                  "[&_h1]:text-[1.6rem] [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-gray-900 dark:[&_h1]:text-gray-50 [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-3 [&_h1]:tracking-tight",
                  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-gray-900 dark:[&_h2]:text-gray-50 [&_h2]:tracking-tight",
                  "[&_h3]:text-[1rem] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-gray-800 dark:[&_h3]:text-gray-100",
                  "[&_h4]:text-[0.95rem] [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:text-gray-700 dark:[&_h4]:text-gray-200",
                  // Paragraphs
                  "[&_p]:mb-4 [&_p]:text-justify [&_p]:hyphens-auto",
                  // Inline formatting
                  "[&_strong]:font-semibold [&_b]:font-semibold",
                  "[&_em]:italic [&_i]:italic",
                  "[&_u]:underline [&_u]:underline-offset-2",
                  "[&_sub]:text-xs [&_sup]:text-xs",
                  // Lists
                  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5",
                  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5",
                  "[&_li]:leading-relaxed",
                  // Nested lists
                  "[&_ul_ul]:list-[circle] [&_ul_ul]:mt-1.5",
                  "[&_ol_ol]:list-[lower-alpha] [&_ol_ol]:mt-1.5",
                  // Tables
                  "[&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm [&_table]:rounded-lg [&_table]:overflow-hidden",
                  "[&_thead]:bg-muted",
                  "[&_th]:font-semibold [&_th]:text-left [&_th]:px-4 [&_th]:py-2.5 [&_th]:border [&_th]:border-border [&_th]:text-foreground",
                  "[&_td]:px-4 [&_td]:py-2.5 [&_td]:border [&_td]:border-border [&_td]:align-top [&_td]:text-foreground",
                  "[&_tr:nth-child(even)_td]:bg-muted/30",
                  "[&_tr:hover_td]:bg-muted/50",
                  // Blockquote
                  "[&_blockquote]:border-l-[3px] [&_blockquote]:border-primary/50 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-5 [&_blockquote]:py-1",
                  // Code
                  "[&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:my-4 [&_pre]:border [&_pre]:border-border",
                  "[&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:rounded [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:border [&_:not(pre)>code]:border-border",
                  // Images
                  "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-5 [&_img]:mx-auto [&_img]:block [&_img]:shadow-sm [&_img]:border [&_img]:border-border",
                  // Links
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-75 [&_a]:transition-opacity",
                  // HR divider
                  "[&_hr]:border-border [&_hr]:my-8",
                  // Figure / caption
                  "[&_figure]:my-6 [&_figure]:text-center",
                  "[&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2 [&_figcaption]:italic",
                  // First paragraph lead
                  "[&>p:first-of-type]:text-base [&>p:first-of-type]:leading-[1.9] [&>p:first-of-type]:text-foreground/90",
                )}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(docxHtml),
                }}
              />
            </div>
          </ScrollArea>
        </div>
      );
    }

    // Fallback — no HTML (e.g. PDF file or failed conversion)
    return (
      <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
        {/* Article header */}
        <div className="px-8 pt-10 pb-7 border-b border-border bg-gradient-to-b from-muted/30 to-transparent">
          <div className="max-w-[68ch] mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
              {selectedPaper?.category || "Research Article"}
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight mb-4 tracking-tight">
              {selectedPaper?.title}
            </h1>
            {selectedPaper?.authors && selectedPaper.authors.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-4">
                {selectedPaper.authors.map((author, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary/60 inline-block" />
                    {author}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(selectedPaper?.submitted_at)}
              </span>
              <span>·</span>
              <Badge variant="outline" className="text-xs h-5 px-2">
                Version {selectedVersion?.version_number}
              </Badge>
              <span>·</span>
              <Badge
                className={cn(
                  "text-xs h-5 px-2",
                  getStatusColor(selectedPaper?.status || ""),
                )}
              >
                {selectedPaper?.status?.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Abstract */}
        <div className="px-8 py-8">
          <div className="max-w-[68ch] mx-auto space-y-6">
            {selectedPaper?.abstract && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Abstract
                </h2>
                <p className="text-sm leading-[1.85] text-foreground/90 text-justify border-l-2 border-primary/30 pl-4">
                  {selectedPaper.abstract}
                </p>
              </div>
            )}

            {/* Full-text unavailable notice */}
            <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-3 bg-muted/20">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Full text not renderable
                </p>
                <p className="text-xs text-muted-foreground">
                  This file type cannot be displayed inline. Switch to PDF View
                  or download the file.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewMode("pdf")}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Switch to PDF View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(getFileUrl(selectedVersion?.file_url), "_blank")
                  }
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── PDF View renderer ──────────────────────────────────────────────────────
  const renderPdfView = () => {
    const ext = selectedVersion?.file_url?.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      return (
        <div className="rounded-lg overflow-hidden border border-border">
          <iframe
            src={getFileUrl(selectedVersion?.file_url)}
            className="w-full h-[600px]"
            title="Paper Preview"
          />
        </div>
      );
    }

    if (ext === "docx" || ext === "tex" || ext === "latex") {
      return renderWebView();
    }

    return (
      <div className="rounded-lg border border-border p-10 text-center space-y-3 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Preview not available for this file type.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            window.open(getFileUrl(selectedVersion?.file_url), "_blank")
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <AnimatePresence mode="wait">
        {selectedPaper ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setSelectedPaper(null);
                    setLastDecision(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Paper Review
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Managing: {selectedPaper.title}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenPaperStats(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Stats
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border-0">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {selectedPaper.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getStatusColor(selectedPaper.status)}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(selectedPaper.status)}
                                {selectedPaper.status.replace("_", " ")}
                              </span>
                            </Badge>
                            <span>•</span>
                            <span>
                              Version {selectedVersion?.version_number}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(selectedPaper.submitted_at)}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Select
                        value={selectedVersion?.id}
                        onValueChange={(versionId) => {
                          const v = selectedPaper?.versions.find(
                            (v) => v.id === versionId,
                          );
                          if (v) setSelectedVersion(v);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedPaper?.versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              Version {v.version_number}
                              {v.version_label ? ` – ${v.version_label}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            getFileUrl(selectedVersion?.file_url),
                            "_blank",
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {selectedVersion &&
                    selectedPaper.versions[0]?.id !== selectedVersion.id && (
                      <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          You are viewing{" "}
                          <span className="font-semibold">
                            v{selectedVersion.version_number}
                          </span>{" "}
                          — this is not the current version.
                        </p>
                        <button
                          className="text-xs text-amber-700 dark:text-amber-300 underline shrink-0"
                          onClick={() =>
                            setSelectedVersion(selectedPaper.versions[0])
                          }
                        >
                          Switch to v{selectedPaper.versions[0]?.version_number}
                        </button>
                      </div>
                    )}

                  <CardContent className="pt-6">
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="preview">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="abstract">
                          <FileEdit className="h-4 w-4 mr-2" />
                          Abstract
                        </TabsTrigger>
                        <TabsTrigger value="timeline">
                          <Clock className="h-4 w-4 mr-2" />
                          Timeline
                        </TabsTrigger>
                      </TabsList>

                      {/* ── PREVIEW TAB ──────────────────────────────────── */}
                      <TabsContent value="preview" className="mt-4">
                        <div className="space-y-3">
                          {/* Toggle bar */}
                          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border w-fit">
                            <button
                              onClick={() => setViewMode("pdf")}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                viewMode === "pdf"
                                  ? "bg-background shadow-sm text-foreground border border-border"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {(() => {
                                const _sext = selectedVersion?.file_url?.split(".").pop()?.toLowerCase();
                                if (_sext === "docx") return "Document";
                                if (_sext === "tex" || _sext === "latex") return "LaTeX";
                                return "PDF View";
                              })()}
                            </button>
                            <button
                              onClick={() => setViewMode("web")}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                viewMode === "web"
                                  ? "bg-background shadow-sm text-foreground border border-border"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              Web View
                            </button>
                          </div>

                          {/* Rendered view */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={viewMode}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.18 }}
                            >
                              {viewMode === "pdf"
                                ? renderPdfView()
                                : renderWebView()}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </TabsContent>

                      <TabsContent value="abstract" className="mt-4">
                        <div className="rounded-lg border border-border p-4 bg-muted/50">
                          <p className="text-sm leading-relaxed">
                            {selectedPaper.abstract ||
                              "No abstract available for this paper."}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="timeline" className="mt-4">
                        {selectedPaperLog.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No status history available.
                          </p>
                        ) : (
                          <PaperTimeline
                            events={selectedPaperLog.map((l, i) => ({
                              id: l.id || String(i),
                              status: l.status,
                              date: new Date(l.changed_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              ),
                              description: l.status.replace(/_/g, " "),
                              actor: l.changed_by_name
                                ? `${l.changed_by_name} (${l.changed_by_role?.replace(/_/g, " ")})`
                                : undefined,
                              isCurrent: i === selectedPaperLog.length - 1,
                            }))}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-0 bg-gradient-to-br from-purple-900/20 to-purple-800/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Reviewer Management
                    </CardTitle>
                    <CardDescription>
                      Assign and manage reviewers
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => fetchReviewers(selectedPaper.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Assigned Reviewers ({reviewers.length})
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => selectedPaper && navigate(`/sub-editor/papers/${selectedPaper.id}/assign-reviewer`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign New Reviewer
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => setOpenSuggestReviewer(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Suggest Reviewer (CE Approval)
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() =>
                        window.open(
                          getFileUrl(selectedVersion?.file_url),
                          "_blank",
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open Fullscreen PDF
                    </Button>
                  </CardContent>
                </Card>

                {lastDecision ? (
                  <Card className="glass-card border-0 bg-gradient-to-br from-green-900/20 to-green-800/10">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">
                          Decision Submitted
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {lastDecision.action === "approve"
                          ? "Approved"
                          : "Revision Requested"}{" "}
                        on {lastDecision.date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        A new decision can only be made after the author uploads
                        a revised version.
                      </p>
                    </CardContent>
                  </Card>
                ) : selectedPaper.ce_override ? (
                  <Card className="glass-card border-0 bg-gradient-to-br from-red-900/20 to-red-800/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Status Locked by Chief Editor
                      </CardTitle>
                      <CardDescription>
                        The Chief Editor has overridden this paper's status. No
                        further decisions can be made.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  selectedPaper.status === "reviewed" && (
                    <Card className="glass-card border-0 bg-gradient-to-br from-orange-900/20 to-orange-800/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-400">
                          <AlertCircle className="h-5 w-5" />
                          Needs Your Decision
                        </CardTitle>
                        <CardDescription>
                          Review has been submitted. Make your decision.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          onClick={() => {
                            setDecisionAction("approve");
                            fetchPaperReviews(selectedPaper.id);
                            setOpenDecisionDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Forward to Chief Editor
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full hover:bg-amber-500/10 hover:border-amber-500/50"
                          onClick={() => {
                            setDecisionAction("revision");
                            setOpenDecisionDialog(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Request Revision from Author
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}

                <Card className="glass-card border-0 bg-gradient-to-br from-gray-900/30 to-gray-800/20">
                  <CardHeader>
                    <CardTitle className="text-sm">Paper Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedPaper.category || "General"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authors:</span>
                      <span className="text-right">
                        {selectedPaper.authors?.join(", ") || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{formatDate(selectedPaper.deadline)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Associate Editor Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Manage assigned papers and review progress
                  </p>
                </div>
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {stats.total} Papers
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card border-0 bg-gradient-to-br from-blue-900/30 to-blue-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Papers
                      </p>
                      <p className="text-2xl font-bold mt-2">{stats.total}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-amber-900/30 to-amber-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Under Review
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.underReview}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-purple-900/30 to-purple-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Revision
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.pendingRevision}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-gradient-to-br from-green-900/30 to-green-800/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Completed
                      </p>
                      <p className="text-2xl font-bold mt-2">
                        {stats.completed}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats.needsDecision > 0 && (
                <Card className="glass-card border-0 bg-gradient-to-br from-orange-900/30 to-orange-800/20 col-span-full md:col-span-2 lg:col-span-1">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Needs Decision
                        </p>
                        <p className="text-2xl font-bold mt-2 text-orange-400">
                          {stats.needsDecision}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search papers by title, author, or abstract..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={activeTab === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("all")}
                    >
                      All Papers
                    </Button>
                    <Button
                      variant={
                        activeTab === "under_review" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveTab("under_review")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Under Review
                    </Button>
                    <Button
                      variant={
                        activeTab === "pending_revision" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveTab("pending_revision")}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Pending Revision
                    </Button>
                    <Button
                      variant={activeTab === "reviewed" ? "default" : "outline"}
                      size="sm"
                      className={
                        activeTab !== "reviewed" && stats.needsDecision > 0
                          ? "border-orange-500/50 text-orange-400"
                          : ""
                      }
                      onClick={() => setActiveTab("reviewed")}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Needs Decision{" "}
                      {stats.needsDecision > 0 && `(${stats.needsDecision})`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredPapers.length === 0 ? (
              <Card className="glass-card border-0">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No papers found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No papers match your search criteria"
                      : "You have no assigned papers at the moment"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPapers.map((paper, i) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="glass-card hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer group border-0 hover:bg-gradient-to-br hover:from-gray-900/50 hover:to-gray-800/30 transition-all duration-300"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setSelectedVersion(paper.versions[0]);
                        fetchAllReviewers();
                        fetch(`${url}/papers/${paper.id}/status-log`, {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.success) setSelectedPaperLog(d.log || []);
                          })
                          .catch(() => {});
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <Badge className={getStatusColor(paper.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(paper.status)}
                              {paper.status.replace("_", " ")}
                            </span>
                          </Badge>
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                        </div>

                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {paper.title}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {paper.abstract || "No abstract available"}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Submitted
                            </span>
                            <span>{formatDate(paper.submitted_at)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Latest Version
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {paper.versions?.[0]?.version_number}
                            </Badge>
                          </div>

                          {paper.authors && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground truncate">
                                Authors: {paper.authors.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs (unchanged) ─────────────────────────────────────────────── */}

      <Dialog open={openReviewersDialog} onOpenChange={setOpenReviewersDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Reviewers
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {reviewers.length} reviewer{reviewers.length !== 1 ? "s" : ""}
              </span>
            </DialogTitle>
            <DialogDescription>
              Reviewers assigned to this paper
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {reviewers.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-muted">
                  <UserCheck className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <p className="text-muted-foreground">
                  No reviewers assigned yet
                </p>
              </div>
            ) : (
              reviewers.map((reviewer, index) => (
                <div
                  key={reviewer.assignment_id || reviewer.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {reviewer.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Reviewer {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reviewer.username}
                        </p>
                      </div>
                    </div>
                    {reviewer.reviewed_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(reviewer.reviewed_at).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </span>
                    )}
                  </div>

                  {reviewer.expertise && reviewer.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reviewer.expertise.slice(0, 3).map((exp, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {exp}
                        </Badge>
                      ))}
                      {reviewer.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{reviewer.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {reviewer.assignment_status === "submitted" ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Review Completed
                        </span>
                        {reviewer.decision && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium border ${
                              reviewer.decision === "accepted"
                                ? "bg-green-500/10 text-green-700 border-green-500/30"
                                : reviewer.decision === "rejected"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
                            }`}
                          >
                            {reviewer.decision}
                          </span>
                        )}
                      </div>
                      {reviewer.comments && (
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">
                            Comments for Authors:
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {reviewer.comments}
                          </p>
                        </div>
                      )}
                      {reviewer.confidential_comments && (
                        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded p-3 mt-2">
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Confidential (editors only)
                          </p>
                          <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">
                            {reviewer.confidential_comments}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          Pending Review
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => sendReminderToReviewer(reviewer.id)}
                        disabled={reminderSent[reviewer.id]}
                      >
                        {reminderSent[reviewer.id]
                          ? "Reminded ✓"
                          : "Send Reminder"}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign reviewer dialog replaced by /sub-editor/papers/:paperId/assign-reviewer page */}
      {false && (
        <Dialog
        open={openAssignReviewerDialog}
        onOpenChange={setOpenAssignReviewerDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Assign Reviewer
            </DialogTitle>
            <DialogDescription>
              Select a reviewer to assign to this paper
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Reviewer</Label>
              <Select
                value={selectedReviewerId}
                onValueChange={setSelectedReviewerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {allReviewers.map((reviewer) => (
                    <SelectItem
                      key={reviewer.id}
                      value={reviewer.id}
                      className="hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs">
                            {reviewer.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{reviewer.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {reviewer.email}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={assignReviewer}
                disabled={!selectedReviewerId}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {assignLoading ? "Assigning Reviewer..." : "Assign Reviewer"}
              </Button>

              <div className="relative space-y-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Create New Reviewer
                </Label>
                <Input
                  placeholder="Full Name"
                  value={newReviewer.name}
                  onChange={(e) =>
                    setNewReviewer((p) => ({ ...p, name: e.target.value }))
                  }
                  className="placeholder:text-muted-foreground"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={newReviewer.email}
                  onChange={(e) =>
                    setNewReviewer((p) => ({ ...p, email: e.target.value }))
                  }
                  className="placeholder:text-muted-foreground"
                />
                <div className="relative">
                  <Input
                    type={showRevPassword ? "text" : "password"}
                    placeholder="Temporary password (min. 6 chars)"
                    value={newReviewer.password}
                    onChange={(e) =>
                      setNewReviewer((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="placeholder:text-muted-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRevPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showRevPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              onClick={createAndAssignReviewer}
              disabled={
                creatingReviewer ||
                !newReviewer.name ||
                !newReviewer.email ||
                !newReviewer.password
              }
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {creatingReviewer ? "Creating..." : "Create & Assign Reviewer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}

      <Dialog open={openDecisionDialog} onOpenChange={setOpenDecisionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionAction === "approve" && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" /> Approve &
                  Forward to Chief Editor
                </>
              )}
              {decisionAction === "revision" && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-400" /> Request
                  Revision from Author
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {decisionAction === "approve"
                ? "The paper will be forwarded to the Chief Editor for final approval."
                : "The author will be notified to upload a revised version."}
            </DialogDescription>
          </DialogHeader>

          {decisionAction === "approve" && paperReviews.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Reviewer Feedback
              </p>
              {paperReviews.map((r, i) => (
                <div
                  key={r.assignment_id}
                  className="bg-muted rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      Reviewer {i + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {r.decision}
                    </Badge>
                  </div>
                  <p className="text-xs line-clamp-2">{r.comments}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Comments{" "}
              {decisionAction !== "approve" && (
                <span className="text-red-400">*</span>
              )}
              {decisionAction === "approve" && (
                <span className="text-muted-foreground text-xs ml-1">
                  (optional)
                </span>
              )}
            </Label>
            <textarea
              className="w-full rounded-md bg-background border border-border text-foreground p-3 text-sm resize-none focus:outline-none focus:border-primary"
              rows={3}
              placeholder={
                decisionAction === "revision"
                  ? "Describe what needs to be revised..."
                  : "Additional notes for Chief Editor..."
              }
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Verify your identity
            </p>
            <div className="space-y-1">
              <Label className="text-xs">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={decisionEmail}
                onChange={(e) => setDecisionEmail(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Password <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showDecisionPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={decisionPassword}
                  onChange={(e) => setDecisionPassword(e.target.value)}
                  className="h-8 text-sm pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowDecisionPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showDecisionPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpenDecisionDialog(false);
                setDecisionNote("");
                setDecisionAction(null);
                setDecisionEmail("");
                setDecisionPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 ${
                decisionAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : decisionAction === "revision"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={submitDecision}
              disabled={submittingDecision}
            >
              {submittingDecision ? "Submitting..." : "Confirm Decision"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSuggestReviewer} onOpenChange={setOpenSuggestReviewer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Suggest Reviewer
            </DialogTitle>
            <DialogDescription>
              Suggest a reviewer for Chief Editor approval. They will be
              notified and can approve or reject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>
                Full Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="Dr. Jane Smith"
                value={suggestForm.suggested_name}
                onChange={(e) =>
                  setSuggestForm((p) => ({
                    ...p,
                    suggested_name: e.target.value,
                  }))
                }
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label>
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                placeholder="reviewer@university.edu"
                value={suggestForm.suggested_email}
                onChange={(e) =>
                  setSuggestForm((p) => ({
                    ...p,
                    suggested_email: e.target.value,
                  }))
                }
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label>Keywords (press Enter to add)</Label>
              <Input
                placeholder="e.g. machine learning"
                value={suggestForm.keywordInput}
                onChange={(e) =>
                  setSuggestForm((p) => ({
                    ...p,
                    keywordInput: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestForm.keywordInput.trim()) {
                    e.preventDefault();
                    setSuggestForm((p) => ({
                      ...p,
                      keywords: [...p.keywords, p.keywordInput.trim()],
                      keywordInput: "",
                    }));
                  }
                }}
                className="placeholder:text-muted-foreground"
              />
              {suggestForm.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestForm.keywords.map((kw, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setSuggestForm((p) => ({
                          ...p,
                          keywords: p.keywords.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Degrees (press Enter to add)</Label>
              <Input
                placeholder="e.g. PhD Computer Science"
                value={suggestForm.degreeInput}
                onChange={(e) =>
                  setSuggestForm((p) => ({ ...p, degreeInput: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestForm.degreeInput.trim()) {
                    e.preventDefault();
                    setSuggestForm((p) => ({
                      ...p,
                      degrees: [...p.degrees, p.degreeInput.trim()],
                      degreeInput: "",
                    }));
                  }
                }}
                className="placeholder:text-muted-foreground"
              />
              {suggestForm.degrees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestForm.degrees.map((deg, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() =>
                        setSuggestForm((p) => ({
                          ...p,
                          degrees: p.degrees.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      {deg} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              onClick={suggestReviewer}
              disabled={
                suggestLoading ||
                !suggestForm.suggested_name ||
                !suggestForm.suggested_email
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {suggestLoading
                ? "Sending..."
                : "Send Suggestion to Chief Editor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
