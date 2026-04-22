import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  UserPlus,
  UserCheck,
  Search,
  Filter,
  Users,
  FileEdit,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Lock,
  Unlock,
  ThumbsUp,
  ThumbsDown,
  Tag,
  ChevronRight,
  Activity,
  GraduationCap,
  Mail,
  Calendar,
  History,
  RefreshCw,
  Info,
  X,
} from "lucide-react";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Issue {
  id: string;
  year: number;
  volume: number;
  issue: number;
  number: number;
  label: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  status?: string;
}

interface Journal {
  id: string;
  title: string;
  acronym?: string;
  description?: string;
  issn?: string;
  website_url?: string;
  status?: string;
  created_at?: string;
  expiry_at?: string;
  issues: Issue[];
}

interface Paper {
  id: string;
  title: string;
  status: string;
  authors?: string[];
  submittedDate?: string;
  issueId?: string;
  issue_id?: string;
  issue_label?: string;
  journalId?: string;
  keywords?: string[];
  current_ae_id?: string;
  current_ae_name?: string;
  current_ae_email?: string;
}

interface StaffMember {
  id: string;
  username: string;
  email: string;
  degrees?: string[] | null;
  keywords?: string[] | null;
  profile_pic_url?: string | null;
  active_assignments?: number;
}

interface ReviewerRequest {
  id: string;
  paper_id: string;
  paper_title: string;
  sub_editor_name: string;
  suggested_name: string;
  suggested_email: string;
  keywords: string[];
  status: string;
  created_at: string;
}

export default function ChiefEditor() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [subEditors, setSubEditors] = useState<StaffMember[]>([]);
  const [reviewers, setReviewers] = useState<StaffMember[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [subEditorId, setSubEditorId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [subEditorEmail, setSubEditorEmail] = useState("");
  const [newSubEditor, setNewSubEditor] = useState({ name: "", email: "" });
  const [creatingSubEditor, setCreatingSubEditor] = useState(false);
  const [openReviewerDialog, setOpenReviewerDialog] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [newReviewer, setNewReviewer] = useState({ name: "", email: "" });
  const [creatingReviewer, setCreatingReviewer] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    reviewed: 0,
    needsDecision: 0,
  });

  const [ceDecisionPaper, setCeDecisionPaper] = useState<Paper | null>(null);
  const [ceDecisionAction, setCeDecisionAction] = useState<"accepted" | "rejected" | "revision" | "">("");
  const [ceDecisionNote, setCeDecisionNote] = useState("");
  const [submittingCeDecision, setSubmittingCeDecision] = useState(false);
  const [ceDecisionEmail, setCeDecisionEmail] = useState("");
  const [ceDecisionPassword, setCeDecisionPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [dashboardTab, setDashboardTab] = useState("overview");
  const [teamTab, setTeamTab] = useState("sub_editors");

  const [openCreateSE, setOpenCreateSE] = useState(false);
  const [newTeamSE, setNewTeamSE] = useState({ name: "", email: "" });
  const [creatingTeamSE, setCreatingTeamSE] = useState(false);

  const [openCreateRev, setOpenCreateRev] = useState(false);
  const [newTeamRev, setNewTeamRev] = useState({ name: "", email: "" });
  const [creatingTeamRev, setCreatingTeamRev] = useState(false);

  const [reviewerRequests, setReviewerRequests] = useState<ReviewerRequest[]>([]);
  const [reviewerRequestsLoading, setReviewerRequestsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Replace AE
  const [replaceAEPaper, setReplaceAEPaper] = useState<Paper | null>(null);
  const [replaceAESubEditorId, setReplaceAESubEditorId] = useState("");
  const [replacingAE, setReplacingAE] = useState(false);

  // Decision History
  const [historyPaper, setHistoryPaper] = useState<Paper | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showCEHint, setShowCEHint] = useState(() =>
    !localStorage.getItem("hint_dismissed_chief_editor")
  );
  const dismissCEHint = () => {
    localStorage.setItem("hint_dismissed_chief_editor", "true");
    setShowCEHint(false);
  };

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/chiefEditor/getChiefEditorJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJournals(data.journal || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to load journals", description: "Unable to fetch journals", variant: "destructive" });
    }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/chiefEditor/getAllPapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const papersData = data.data || [];
      setPapers(papersData);
      setFilteredPapers(papersData);
      const pending = papersData.filter((p: Paper) => p.status === "submitted").length;
      const assigned = papersData.filter((p: Paper) => p.status === "assigned").length;
      const reviewed = papersData.filter((p: Paper) => p.status === "reviewed").length;
      const needsDecision = papersData.filter((p: Paper) => p.status === "sub_editor_approved").length;
      setStats({ total: papersData.length, pending, assigned, reviewed, needsDecision });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load papers", description: "Unable to fetch papers at the moment.", variant: "destructive" });
    }
  };

  const [myAssignedPapers, setMyAssignedPapers] = useState<any[]>([]);
  const [myReviewAssignments, setMyReviewAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchPapers();
      fetchJournals();
      if (user?.roles?.some((r) => r.role === "sub_editor")) {
        fetch(`${url}/subEditor/getAssignedPapers`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => setMyAssignedPapers(d.papers || d.data || []))
          .catch(() => {});
      }
      if (user?.roles?.some((r) => r.role === "reviewer")) {
        fetch(`${url}/reviewer/getAssignedPapers`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => setMyReviewAssignments(d.papers || d.data || []))
          .catch(() => {});
      }
    }
  }, [token]);

  const fetchPapersByIssue = async (issueId: string) => {
    try {
      const res = await fetch(`${url}/chiefEditor/getPapersByIssue/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const issuePapers = data.papers || [];
      setPapers(issuePapers);
      setFilteredPapers(issuePapers);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load papers", description: "Unable to fetch papers for this issue.", variant: "destructive" });
    }
  };

  const fetchPapersByJournal = async (journalId: string) => {
    try {
      const res = await fetch(`${url}/chiefEditor/getPapers/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const journalPapers = data.papers || [];
      setPapers(journalPapers);
      setFilteredPapers(journalPapers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    if (!token) return;
    const [subEditorsRes, reviewersRes] = await Promise.all([
      fetch(`${url}/chiefEditor/getSubEditors`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/chiefEditor/getReviewers`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const subEditorsData = await subEditorsRes.json();
    setSubEditors(subEditorsData.data || []);
    const reviewersData = await reviewersRes.json();
    setReviewers(reviewersData.data || []);
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const fetchReviewerRequests = async () => {
    try {
      setReviewerRequestsLoading(true);
      const res = await fetch(`${url}/subEditor/pending-reviewer-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReviewerRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewerRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (token && dashboardTab === "team") {
      fetchReviewerRequests();
    }
  }, [token, dashboardTab]);

  useEffect(() => {
    let filtered = papers;
    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.authors?.some((author) => author.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }
    if (activeTab !== "all") {
      filtered = filtered.filter((paper) => paper.status === activeTab);
    }
    setFilteredPapers(filtered);
  }, [searchQuery, activeTab, papers]);

  const assignPaperToIssue = async (paperId: string, issueId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/chiefEditor/assignPaperToIssue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paperId, issueId }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Paper Assigned", description: "Paper assigned to issue successfully." });
      setOpenIssueDialog(false);
      if (selectedIssueId) fetchPapersByIssue(selectedIssueId);
      else if (selectedJournalId) fetchPapersByJournal(selectedJournalId);
      else fetchPapers();
    } catch (e) {
      console.error(e);
      toast({ title: "Assignment Failed", description: "Could not assign paper to issue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleIssueStatus = async (issueId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";
      const res = await fetch(`${url}/chiefEditor/updateIssueStatus/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update issue status");
      setJournals((prev) =>
        prev.map((j) => ({
          ...j,
          issues: j.issues.map((iss) => (iss.id === issueId ? { ...iss, status: newStatus } : iss)),
        })),
      );
      toast({
        title: "Issue Status Updated",
        description: `Issue ${newStatus === "closed" ? "closed" : "opened for submissions"} successfully.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Update Failed", description: e.message || "Could not update issue status.", variant: "destructive" });
    }
  };

  const assignSubEditor = async () => {
    if (!selectedPaper || !subEditorId) return;
    try {
      setLoading(true);
      const res = await fetch(`${url}/chiefEditor/assignSubEditor/${selectedPaper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subEditorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not assign sub-editor.");
      toast({ title: "Sub-Editor Assigned", description: "Sub-editor assigned successfully." });
      setSubEditorId("");
      setOpenDialog(false);
      if (selectedIssueId) fetchPapersByIssue(selectedIssueId);
      else if (selectedJournalId) fetchPapersByJournal(selectedJournalId);
      else fetchPapers();
    } catch (e: any) {
      toast({ title: "Assignment Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inviteSubEditorByEmail = async () => {
    if (!subEditorEmail) return;
    try {
      setInviteLoading(true);
      const res = await fetch(`${url}/chiefEditor/inviteSubEditor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: subEditorEmail }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Invitation Sent", description: `Sub-editor invited successfully to ${subEditorEmail}` });
      setSubEditorEmail("");
      const subEditorsRes = await fetch(`${url}/chiefEditor/getSubEditors`, { headers: { Authorization: `Bearer ${token}` } });
      const subEditorsData = await subEditorsRes.json();
      setSubEditors(subEditorsData.data || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Invitation Failed", description: `Could not invite ${subEditorEmail}`, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const createAndAssignSubEditor = async () => {
    if (!newSubEditor.name || !newSubEditor.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    if (!selectedPaper) return;
    try {
      setCreatingSubEditor(true);
      const journalId = selectedPaper.journalId ?? selectedJournalId;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSubEditor.name, email: newSubEditor.email, role: "sub_editor", journal_id: journalId, paper_id: selectedPaper.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newSubEditor.name} will be assigned as sub-editor upon acceptance.` });
      setNewSubEditor({ name: "", email: "" });
      setOpenDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingSubEditor(false);
    }
  };

  const assignExistingReviewer = async () => {
    if (!selectedPaper || !selectedReviewerId) return;
    try {
      setAssigningReviewer(true);
      const res = await fetch(`${url}/subEditor/assignReviewer/${selectedPaper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewerId: selectedReviewerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign reviewer");
      toast({ title: "Success", description: "Reviewer assigned successfully" });
      setSelectedReviewerId("");
      setOpenReviewerDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigningReviewer(false);
    }
  };

  const createAndAssignReviewer = async () => {
    if (!newReviewer.name || !newReviewer.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    if (!selectedPaper) return;
    try {
      setCreatingReviewer(true);
      const journalId = selectedPaper.journalId ?? selectedJournalId;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newReviewer.name, email: newReviewer.email, role: "reviewer", journal_id: journalId, paper_id: selectedPaper.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newReviewer.name} will be assigned as reviewer upon acceptance.` });
      setNewReviewer({ name: "", email: "" });
      setOpenReviewerDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingReviewer(false);
    }
  };

  const createTeamSubEditor = async () => {
    if (!newTeamSE.name || !newTeamSE.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    try {
      setCreatingTeamSE(true);
      const journalId = selectedJournalId ?? journals[0]?.id ?? undefined;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTeamSE.name, email: newTeamSE.email, role: "sub_editor", journal_id: journalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newTeamSE.name} will appear as Associate Editor upon acceptance.` });
      setNewTeamSE({ name: "", email: "" });
      setOpenCreateSE(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingTeamSE(false);
    }
  };

  const createTeamReviewer = async () => {
    if (!newTeamRev.name || !newTeamRev.email) {
      toast({ title: "Missing fields", description: "Name and email are required", variant: "destructive" });
      return;
    }
    try {
      setCreatingTeamRev(true);
      const journalId = selectedJournalId ?? journals[0]?.id ?? undefined;
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTeamRev.name, email: newTeamRev.email, role: "reviewer", journal_id: journalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send invitation");
      toast({ title: "Invitation Sent", description: `${newTeamRev.name} will appear as Reviewer upon acceptance.` });
      setNewTeamRev({ name: "", email: "" });
      setOpenCreateRev(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingTeamRev(false);
    }
  };

  const handleReviewerRequest = async (requestId: string, action: "approved" | "rejected") => {
    try {
      setProcessingRequestId(requestId);
      const res = await fetch(`${url}/subEditor/reviewer-requests/${requestId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process request");
      toast({ title: action === "approved" ? "Request Approved" : "Request Rejected", description: `Reviewer request has been ${action}.` });
      fetchReviewerRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const replaceSubEditor = async () => {
    if (!replaceAEPaper || !replaceAESubEditorId) return;
    try {
      setReplacingAE(true);
      const res = await fetch(`${url}/chiefEditor/papers/${replaceAEPaper.id}/replace-ae`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newSubEditorId: replaceAESubEditorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to replace Associate Editor");
      toast({ title: "AE Replaced", description: "The Associate Editor has been replaced successfully." });
      setReplaceAEPaper(null);
      setReplaceAESubEditorId("");
      fetchPapers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setReplacingAE(false);
    }
  };

  const fetchDecisionHistory = async (paper: Paper) => {
    setHistoryPaper(paper);
    setHistoryEntries([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${url}/chiefEditor/papers/${paper.id}/decision-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch history");
      setHistoryEntries(data.data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitCeDecision = async () => {
    if (!ceDecisionPaper || !ceDecisionAction) return;
    if (!ceDecisionEmail || !ceDecisionPassword) {
      toast({ title: "Credentials required", description: "Enter your email and password to confirm this decision.", variant: "destructive" });
      return;
    }
    try {
      setSubmittingCeDecision(true);
      const res = await fetch(`${url}/chiefEditor/decide/${ceDecisionPaper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision: ceDecisionAction, decision_note: ceDecisionNote, email: ceDecisionEmail, password: ceDecisionPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit decision");
      toast({ title: "Decision Submitted", description: `Paper has been ${ceDecisionAction}.` });
      setCeDecisionPaper(null);
      setCeDecisionAction("");
      setCeDecisionNote("");
      setCeDecisionEmail("");
      setCeDecisionPassword("");
      fetchPapers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingCeDecision(false);
    }
  };

  const handleIssueClick = (issue: Issue, journalId: string) => {
    setSelectedJournalId(journalId);
    setSelectedIssueId(issue.id);
    fetchPapersByIssue(issue.id);
  };

  const handleJournalClick = (journalId: string) => {
    setSelectedJournalId(journalId);
    setSelectedIssueId(null);
    fetchPapersByJournal(journalId);
  };

  const clearFilters = () => {
    setSelectedJournalId(null);
    setSelectedIssueId(null);
    fetchPapers();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <Clock className="h-3 w-3" />;
      case "assigned":
      case "assigned_to_sub_editor": return <Users className="h-3 w-3" />;
      case "reviewed": return <CheckCircle className="h-3 w-3" />;
      case "sub_editor_approved": return <AlertCircle className="h-3 w-3" />;
      case "accepted": return <CheckCircle className="h-3 w-3" />;
      case "rejected": return <AlertCircle className="h-3 w-3" />;
      default: return <FileEdit className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "assigned":
      case "assigned_to_sub_editor": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "reviewed": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "sub_editor_approved": return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "accepted": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rejected": return "bg-red-100 text-red-800 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const selectedJournal = journals.find((j) => j.id === selectedJournalId);
  const selectedIssue = selectedJournal?.issues.find((i) => i.id === selectedIssueId);

  const statusFilterTabs = [
    { key: "all", label: "All", count: stats.total },
    { key: "submitted", label: "Pending", count: stats.pending },
    { key: "assigned_to_editor", label: "Assigned", count: stats.assigned },
    { key: "reviewed", label: "Reviewed", count: stats.reviewed },
    { key: "sub_editor_approved", label: "Needs Decision", count: stats.needsDecision },
  ];

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        {showCEHint && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Welcome, Chief Editor</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You've been assigned as Chief Editor. Start by opening an issue for submissions, then review incoming papers and assign them to Associate Editors.
              </p>
            </div>
            <button onClick={dismissCEHint} className="text-blue-400 hover:text-blue-600 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chief Editor</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back, <span className="font-medium text-foreground">{user?.username}</span>
              {journals.length > 0 && (
                <span> · {journals.length} journal{journals.length !== 1 ? "s" : ""} assigned</span>
              )}
            </p>
          </div>
          {stats.needsDecision > 0 && (
            <div className="flex items-center gap-2.5 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 shrink-0">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {stats.needsDecision} paper{stats.needsDecision !== 1 ? "s" : ""} awaiting decision
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                onClick={() => { setDashboardTab("overview"); setActiveTab("sub_editor_approved"); }}
              >
                View <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Papers", value: stats.total, icon: FileText, color: "blue" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "amber" },
            { label: "Assigned", value: stats.assigned, icon: Users, color: "purple" },
            { label: "Reviewed", value: stats.reviewed, icon: CheckCircle, color: "green" },
            { label: "Needs Decision", value: stats.needsDecision, icon: AlertCircle, color: "orange" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card
              key={label}
              className={`border shadow-sm cursor-pointer transition-colors hover:bg-muted/30 ${
                label === "Needs Decision" && value > 0 ? "border-orange-200 bg-orange-50/40" : ""
              }`}
              onClick={() => {
                if (label === "Needs Decision" && value > 0) {
                  setDashboardTab("overview");
                  setActiveTab("sub_editor_approved");
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
                  <div className={`h-7 w-7 rounded-md bg-${color}-50 flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 text-${color}-600`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${label === "Needs Decision" && value > 0 ? "text-orange-700" : "text-foreground"}`}>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── MAIN TABS ── */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-sm px-4">Overview</TabsTrigger>
            <TabsTrigger value="team" className="text-sm px-4 gap-1.5">
              Team
              {(subEditors.length + reviewers.length) > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                  {subEditors.length + reviewers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          <TabsContent value="overview" className="space-y-6 mt-5">

            {/* Journals section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide text-muted-foreground">
                  Journals
                </h2>
                <Badge variant="outline" className="text-xs">
                  {journals.length} journal{journals.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {journals.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No journals assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {journals.map((journal) => (
                    <Card key={journal.id} className="border shadow-sm overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleJournalClick(journal.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {journal.title}
                              </span>
                              {journal.acronym && (
                                <Badge variant="secondary" className="text-xs h-5 px-1.5 shrink-0">
                                  {journal.acronym}
                                </Badge>
                              )}
                              {journal.status && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs h-5 px-1.5 shrink-0 capitalize ${
                                    journal.status === "active"
                                      ? "border-green-200 text-green-700 bg-green-50"
                                      : ""
                                  }`}
                                >
                                  {journal.status}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {journal.issn && <span>ISSN: {journal.issn}</span>}
                              <span>{journal.issues.length} issue{journal.issues.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>

                      {journal.issues.length > 0 && (
                        <div className="border-t bg-muted/20 px-4 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {journal.issues.map((issue) => (
                              <div
                                key={issue.id}
                                className="flex items-center justify-between bg-background border rounded-md px-3 py-2 cursor-pointer hover:border-blue-300 transition-colors group"
                                onClick={() => handleIssueClick(issue, journal.id)}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground group-hover:text-blue-700 truncate">
                                    {issue.label || `Vol ${issue.volume}, Issue ${issue.issue}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Year {issue.year}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {issue.status === "closed" ? (
                                    <Badge variant="outline" className="text-xs h-5 bg-red-50 border-red-200 text-red-700">
                                      <Lock className="h-2.5 w-2.5 mr-0.5" /> Closed
                                    </Badge>
                                  ) : issue.status === "draft" ? (
                                    <Badge variant="outline" className="text-xs h-5 bg-yellow-50 border-yellow-200 text-yellow-700">
                                      <FileEdit className="h-2.5 w-2.5 mr-0.5" /> Draft
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs h-5 bg-green-50 border-green-200 text-green-700">
                                      <Unlock className="h-2.5 w-2.5 mr-0.5" /> Open
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title={issue.status === "closed" ? "Open for submissions" : "Close submissions"}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleIssueStatus(issue.id, issue.status || "open");
                                    }}
                                  >
                                    {issue.status === "closed" ? (
                                      <Unlock className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                      <Lock className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Active filter banner */}
            {(selectedJournalId || selectedIssueId) && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">Filtering:</span>
                  <span className="truncate">
                    {selectedIssue
                      ? `${selectedJournal?.title} → ${selectedIssue.label || `Vol ${selectedIssue.volume}, Issue ${selectedIssue.issue}`}`
                      : selectedJournal?.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 px-2.5 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 shrink-0"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Papers section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Papers</h2>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">{filteredPapers.length}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedJournalId ?? "all"}
                    onValueChange={(val) => (val === "all" ? clearFilters() : handleJournalClick(val))}
                  >
                    <SelectTrigger className="h-8 text-xs w-40">
                      <SelectValue placeholder="All Journals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Journals</SelectItem>
                      {journals.map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search papers..."
                      className="h-8 text-xs pl-8 w-52"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Status filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {statusFilterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeTab === tab.key
                        ? tab.key === "sub_editor_approved"
                          ? "bg-orange-500 text-white"
                          : "bg-foreground text-background"
                        : tab.key === "sub_editor_approved" && tab.count > 0
                          ? "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-xs ${activeTab === tab.key ? "opacity-80" : "opacity-60"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Papers list */}
              {filteredPapers.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No papers found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery ? "Try different search terms" : "No papers match the selected filter"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border overflow-hidden divide-y bg-background">
                  {filteredPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 flex-1 min-w-0">
                            {paper.title}
                          </p>
                          <Badge className={`text-xs shrink-0 ${getStatusColor(paper.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(paper.status)}
                              {paper.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {paper.authors && paper.authors.length > 0 && (
                            <span className="truncate max-w-xs">{paper.authors.join(", ")}</span>
                          )}
                          {paper.submittedDate && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="h-3 w-3" />
                              {new Date(paper.submittedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {(paper.issue_id || paper.issueId) && (
                            <span className="flex items-center gap-1 shrink-0 text-blue-600">
                              <BookOpen className="h-3 w-3" />
                              {paper.issue_label || "Assigned to issue"}
                            </span>
                          )}
                        </div>

                        {paper.status === "sub_editor_approved" && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-xs text-orange-600 font-medium flex items-center gap-1 mr-1">
                              <AlertCircle className="h-3 w-3" /> Final decision required:
                            </span>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("accepted"); }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("revision"); }}
                            >
                              <FileEdit className="h-3 w-3 mr-1" /> Revision
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => { setCeDecisionPaper(paper); setCeDecisionAction("rejected"); }}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>

                      {paper.status !== "sub_editor_approved" && (() => {
                        const subEditorAssigned = paper.status !== "submitted";
                        return (
                          <TooltipProvider>
                            <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs whitespace-nowrap"
                                onClick={() => fetchDecisionHistory(paper)}
                              >
                                <History className="h-3 w-3 mr-1" /> History
                              </Button>
                              {subEditorAssigned ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="h-7 px-2.5 text-xs whitespace-nowrap border-green-400 text-green-600"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" /> Sub Editor Assigned
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs whitespace-nowrap border-orange-300 text-orange-700 hover:bg-orange-50"
                                    onClick={() => { setReplaceAEPaper(paper); setReplaceAESubEditorId(""); }}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" /> Replace AE
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs whitespace-nowrap"
                                  onClick={() => { setSelectedPaper(paper); setOpenDialog(true); }}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" /> Assign Editor
                                </Button>
                              )}
                              {subEditorAssigned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs whitespace-nowrap"
                                  onClick={() => {
                                    setSelectedPaper(paper);
                                    setSelectedReviewerId("");
                                    setNewReviewer({ name: "", email: "" });
                                    setOpenReviewerDialog(true);
                                  }}
                                >
                                  <UserCheck className="h-3 w-3 mr-1" /> Assign Reviewer
                                </Button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="h-7 px-2.5 text-xs whitespace-nowrap w-full"
                                      >
                                        <UserCheck className="h-3 w-3 mr-1" /> Assign Reviewer
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p>Assign a Sub Editor first</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {!(paper.issue_id || paper.issueId) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs whitespace-nowrap"
                                  onClick={() => { setSelectedPaper(paper); setOpenIssueDialog(true); }}
                                >
                                  <BookOpen className="h-3 w-3 mr-1" /> Assign Issue
                                </Button>
                              )}
                            </div>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-role: Sub-Editor section */}
            {user?.roles?.some((r) => r.role === "sub_editor") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    My Assigned Papers (as Associate Editor)
                  </h2>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">{myAssignedPapers.length}</Badge>
                </div>
                {myAssignedPapers.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No papers currently assigned to you as Associate Editor.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {myAssignedPapers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 p-4 bg-background hover:bg-muted/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.journal_name || p.journal?.title}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">{p.status?.replace(/_/g, " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-role: Reviewer section */}
            {user?.roles?.some((r) => r.role === "reviewer") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    My Review Assignments
                  </h2>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">{myReviewAssignments.length}</Badge>
                </div>
                {myReviewAssignments.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No review assignments currently.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {myReviewAssignments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 p-4 bg-background hover:bg-muted/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.journal_name || p.journal?.title}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">{p.status?.replace(/_/g, " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ═══════════ TEAM TAB ═══════════ */}
          <TabsContent value="team" className="space-y-5 mt-5">
            <Tabs value={teamTab} onValueChange={setTeamTab}>
              <TabsList className="h-9">
                <TabsTrigger value="sub_editors" className="text-sm gap-1.5">
                  Associate Editors
                  {subEditors.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">{subEditors.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reviewers" className="text-sm gap-1.5">
                  Reviewers
                  {reviewers.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">{reviewers.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reviewer_requests" className="text-sm gap-1.5">
                  Reviewer Requests
                  {reviewerRequests.length > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">{reviewerRequests.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Associate Editors */}
              <TabsContent value="sub_editors" className="mt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Associate Editors</h2>
                    <Badge variant="outline" className="text-xs">{subEditors.length}</Badge>
                  </div>
                  <Button onClick={() => setOpenCreateSE(true)} size="sm" className="h-8 gap-1.5 text-xs">
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Editor
                  </Button>
                </div>

                {subEditors.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-14 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/25 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No associate editors yet</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">Invite editors to help manage paper reviews</p>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpenCreateSE(true)}>
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add First Editor
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subEditors.map((se) => (
                      <Card key={se.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {se.profile_pic_url ? (
                                <img src={se.profile_pic_url} alt={se.username} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-blue-700">
                                  {se.username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">{se.username}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <Mail className="h-2.5 w-2.5 shrink-0" />
                                {se.email}
                              </p>
                            </div>
                          </div>
                          {se.degrees && se.degrees.length > 0 && (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2.5">
                              <GraduationCap className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{se.degrees.join(", ")}</span>
                            </div>
                          )}
                          {se.keywords && se.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {se.keywords.map((k, i) => (
                                <Badge key={i} variant="secondary" className="text-xs h-5 px-1.5">{k}</Badge>
                              ))}
                            </div>
                          )}
                          {se.active_assignments !== undefined && (
                            <div className="flex items-center gap-1.5 pt-2.5 border-t">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {se.active_assignments} active paper{se.active_assignments !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviewers */}
              <TabsContent value="reviewers" className="mt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Reviewers</h2>
                    <Badge variant="outline" className="text-xs">{reviewers.length}</Badge>
                  </div>
                  <Button onClick={() => setOpenCreateRev(true)} size="sm" className="h-8 gap-1.5 text-xs">
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Reviewer
                  </Button>
                </div>

                {reviewers.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-14 text-center">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/25 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No reviewers yet</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">Add expert reviewers to evaluate papers</p>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpenCreateRev(true)}>
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add First Reviewer
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reviewers.map((r) => (
                      <Card key={r.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {r.profile_pic_url ? (
                                <img src={r.profile_pic_url} alt={r.username} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-purple-700">
                                  {r.username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">{r.username}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <Mail className="h-2.5 w-2.5 shrink-0" />
                                {r.email}
                              </p>
                            </div>
                          </div>
                          {r.degrees && r.degrees.length > 0 && (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2.5">
                              <GraduationCap className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{r.degrees.join(", ")}</span>
                            </div>
                          )}
                          {r.keywords && r.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {r.keywords.map((k, i) => (
                                <Badge key={i} variant="secondary" className="text-xs h-5 px-1.5">{k}</Badge>
                              ))}
                            </div>
                          )}
                          {r.active_assignments !== undefined && (
                            <div className="flex items-center gap-1.5 pt-2.5 border-t">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Reviewing {r.active_assignments} paper{r.active_assignments !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviewer Requests */}
              <TabsContent value="reviewer_requests" className="mt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Pending Reviewer Requests</h2>
                    {reviewerRequests.length > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 px-1.5">{reviewerRequests.length}</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={fetchReviewerRequests}
                    disabled={reviewerRequestsLoading}
                  >
                    {reviewerRequestsLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                {reviewerRequestsLoading ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-2">
                    <Activity className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading requests...</p>
                  </div>
                ) : reviewerRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-14 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/25 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">All clear</p>
                      <p className="text-xs text-muted-foreground mt-1">No pending reviewer requests</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reviewerRequests.map((req) => (
                      <Card key={req.id} className="border shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{req.paper_title}</p>
                            <p className="text-xs text-muted-foreground mt-1">Requested by {req.sub_editor_name}</p>
                          </div>
                          <div className="bg-muted/40 rounded-md p-3 space-y-0.5">
                            <p className="text-xs font-medium text-foreground">Suggested: {req.suggested_name}</p>
                            <p className="text-xs text-muted-foreground">{req.suggested_email}</p>
                          </div>
                          {req.keywords && req.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {req.keywords.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs h-5 px-1.5">
                                  <Tag className="h-2.5 w-2.5 mr-0.5" />{kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                              disabled={processingRequestId === req.id}
                              onClick={() => handleReviewerRequest(req.id, "approved")}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                              disabled={processingRequestId === req.id}
                              onClick={() => handleReviewerRequest(req.id, "rejected")}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* ═══════════ DIALOGS ═══════════ */}

        {/* Assign Sub-Editor to paper */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assign Sub-Editor
              </DialogTitle>
            </DialogHeader>

            {selectedPaper && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Paper</Label>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <p className="font-medium text-foreground text-sm">{selectedPaper.title}</p>
                      <Badge variant="outline" className={`mt-2 text-xs ${getStatusColor(selectedPaper.status)}`}>
                        {selectedPaper.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Sub-Editor</Label>
                  {subEditors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sub-editors available.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {subEditors.map((se) => {
                        const paperKeywords: string[] = selectedPaper?.keywords ?? [];
                        const overlap = (se.keywords ?? []).filter((k) => paperKeywords.includes(k));
                        const isSelected = subEditorId === se.id;
                        return (
                          <div
                            key={se.id}
                            onClick={() => setSubEditorId(se.id)}
                            className={`rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {se.profile_pic_url ? (
                                  <img src={se.profile_pic_url} alt={se.username} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-semibold text-primary">{se.username.slice(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{se.username}</p>
                                  {overlap.length > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Best Match</Badge>
                                  )}
                                </div>
                                {se.degrees && se.degrees.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{se.degrees.join(", ")}</p>
                                )}
                                {se.keywords && se.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {se.keywords.map((k, i) => (
                                      <Badge key={i} variant="outline" className={`text-xs ${overlap.includes(k) ? "border-green-400 text-green-700" : ""}`}>{k}</Badge>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {se.active_assignments ?? 0} active paper{se.active_assignments !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button className="w-full" onClick={assignSubEditor} disabled={!subEditorId}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "Assigning..." : "Assign Sub-Editor"}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or invite new</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">An invitation email will be sent. They will be assigned to this paper when they accept.</p>
                  <Input placeholder="Full Name" value={newSubEditor.name} onChange={(e) => setNewSubEditor((p) => ({ ...p, name: e.target.value }))} />
                  <Input type="email" placeholder="Email address" value={newSubEditor.email} onChange={(e) => setNewSubEditor((p) => ({ ...p, email: e.target.value }))} />
                  <Button className="w-full" onClick={createAndAssignSubEditor} disabled={creatingSubEditor || !newSubEditor.name || !newSubEditor.email}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingSubEditor ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <div className="text-xs text-muted-foreground">{subEditors.length} available sub-editors</div>
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Paper to Issue */}
        <Dialog open={openIssueDialog} onOpenChange={setOpenIssueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Assign Paper to Issue
              </DialogTitle>
            </DialogHeader>
            {selectedPaper && selectedJournal && (
              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 pb-4">
                    <p className="font-medium text-foreground text-sm">{selectedPaper.title}</p>
                  </CardContent>
                </Card>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Issue</Label>
                  <Select onValueChange={(issueId) => assignPaperToIssue(selectedPaper.id, issueId)}>
                    <SelectTrigger><SelectValue placeholder="Choose an issue" /></SelectTrigger>
                    <SelectContent>
                      {selectedJournal.issues
                        .filter((issue) => issue.status !== "closed")
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            {issue.label || `Vol ${issue.volume}, Issue ${issue.issue} (${issue.year})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenIssueDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Reviewer */}
        <Dialog open={openReviewerDialog} onOpenChange={setOpenReviewerDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign Reviewer
              </DialogTitle>
            </DialogHeader>
            {selectedPaper && (
              <div className="space-y-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 pb-4">
                    <p className="font-medium text-foreground text-sm">{selectedPaper.title}</p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Existing Reviewer</Label>
                  {reviewers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviewers available.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {reviewers.map((r) => {
                        const paperKeywords: string[] = selectedPaper?.keywords ?? [];
                        const overlap = (r.keywords ?? []).filter((k) => paperKeywords.includes(k));
                        const isSelected = selectedReviewerId === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReviewerId(r.id)}
                            className={`rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {r.profile_pic_url ? (
                                  <img src={r.profile_pic_url} alt={r.username} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-semibold text-purple-700">{r.username.slice(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{r.username}</p>
                                  {overlap.length > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Best Match</Badge>
                                  )}
                                </div>
                                {r.degrees && r.degrees.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.degrees.join(", ")}</p>
                                )}
                                {r.keywords && r.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {r.keywords.map((k, i) => (
                                      <Badge key={i} variant="outline" className={`text-xs ${overlap.includes(k) ? "border-green-400 text-green-700" : ""}`}>{k}</Badge>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Reviewing {r.active_assignments ?? 0} paper{r.active_assignments !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button className="w-full" onClick={assignExistingReviewer} disabled={!selectedReviewerId || assigningReviewer}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {assigningReviewer ? "Assigning..." : "Assign Reviewer"}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or invite new</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">An invitation email will be sent. They will be assigned to this paper when they accept.</p>
                  <Input placeholder="Full Name" value={newReviewer.name} onChange={(e) => setNewReviewer((p) => ({ ...p, name: e.target.value }))} />
                  <Input type="email" placeholder="Email address" value={newReviewer.email} onChange={(e) => setNewReviewer((p) => ({ ...p, email: e.target.value }))} />
                  <Button className="w-full" onClick={createAndAssignReviewer} disabled={creatingReviewer || !newReviewer.name || !newReviewer.email}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingReviewer ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter className="sm:justify-between">
              <div className="text-xs text-muted-foreground">{reviewers.length} available reviewers</div>
              <Button variant="ghost" onClick={() => setOpenReviewerDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team: Add Associate Editor */}
        <Dialog open={openCreateSE} onOpenChange={setOpenCreateSE}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Associate Editor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">An invitation email will be sent. They will set their own password when they accept.</p>
              <Input placeholder="Full Name" value={newTeamSE.name} onChange={(e) => setNewTeamSE((p) => ({ ...p, name: e.target.value }))} />
              <Input type="email" placeholder="Email address" value={newTeamSE.email} onChange={(e) => setNewTeamSE((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpenCreateSE(false); setNewTeamSE({ name: "", email: "" }); }}>Cancel</Button>
              <Button onClick={createTeamSubEditor} disabled={creatingTeamSE || !newTeamSE.name || !newTeamSE.email}>
                <UserPlus className="h-4 w-4 mr-2" />
                {creatingTeamSE ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team: Add Reviewer */}
        <Dialog open={openCreateRev} onOpenChange={setOpenCreateRev}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Reviewer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">An invitation email will be sent. They will set their own password when they accept.</p>
              <Input placeholder="Full Name" value={newTeamRev.name} onChange={(e) => setNewTeamRev((p) => ({ ...p, name: e.target.value }))} />
              <Input type="email" placeholder="Email address" value={newTeamRev.email} onChange={(e) => setNewTeamRev((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpenCreateRev(false); setNewTeamRev({ name: "", email: "" }); }}>Cancel</Button>
              <Button onClick={createTeamReviewer} disabled={creatingTeamRev || !newTeamRev.name || !newTeamRev.email}>
                <UserPlus className="h-4 w-4 mr-2" />
                {creatingTeamRev ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CE Final Decision */}
        <Dialog
          open={!!ceDecisionPaper}
          onOpenChange={(open) => {
            if (!open) { setCeDecisionPaper(null); setCeDecisionAction(""); setCeDecisionNote(""); setCeDecisionEmail(""); setCeDecisionPassword(""); }
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Final Decision —{" "}
                {ceDecisionAction === "accepted" ? "Accept" : ceDecisionAction === "rejected" ? "Reject" : "Request Revision"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground line-clamp-2">{ceDecisionPaper?.title}</p>
              <div className="space-y-2">
                <Label htmlFor="ce-note">Decision Note (optional)</Label>
                <textarea
                  id="ce-note"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a note for the author or editorial record..."
                  value={ceDecisionNote}
                  onChange={(e) => setCeDecisionNote(e.target.value)}
                />
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verify your identity</p>
                <div className="space-y-1">
                  <Label className="text-xs">Email <span className="text-red-400">*</span></Label>
                  <Input type="email" placeholder="your@email.com" value={ceDecisionEmail} onChange={(e) => setCeDecisionEmail(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Password <span className="text-red-400">*</span></Label>
                  <Input type="password" placeholder="••••••••" value={ceDecisionPassword} onChange={(e) => setCeDecisionPassword(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setCeDecisionPaper(null); setCeDecisionAction(""); setCeDecisionNote(""); setCeDecisionEmail(""); setCeDecisionPassword(""); }}>
                Cancel
              </Button>
              <Button
                onClick={submitCeDecision}
                disabled={submittingCeDecision}
                className={
                  ceDecisionAction === "accepted"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ceDecisionAction === "rejected"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : ""
                }
              >
                {submittingCeDecision
                  ? "Submitting..."
                  : `Confirm ${ceDecisionAction === "accepted" ? "Accept" : ceDecisionAction === "rejected" ? "Reject" : "Revision"}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Replace Associate Editor */}
        <Dialog open={!!replaceAEPaper} onOpenChange={(open) => { if (!open) { setReplaceAEPaper(null); setReplaceAESubEditorId(""); } }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                Replace Associate Editor
              </DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                The current associate editor will be removed and replaced with your selection.
              </p>
            </DialogHeader>
            {replaceAEPaper && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{replaceAEPaper.title}</p>

                {replaceAEPaper.current_ae_name && (
                  <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50/50 px-3 py-2">
                    <span className="text-xs text-orange-700 font-medium">Current:</span>
                    <span className="text-xs text-orange-900">{replaceAEPaper.current_ae_name}</span>
                    <span className="text-xs text-muted-foreground">({replaceAEPaper.current_ae_email})</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Replacement</Label>
                  {subEditors.filter((se) => se.id !== replaceAEPaper.current_ae_id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No other associate editors available.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {subEditors
                        .filter((se) => se.id !== replaceAEPaper.current_ae_id)
                        .map((se) => {
                          const isSelected = replaceAESubEditorId === se.id;
                          return (
                            <div
                              key={se.id}
                              onClick={() => setReplaceAESubEditorId(se.id)}
                              className={`rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                                  {se.profile_pic_url ? (
                                    <img src={se.profile_pic_url} alt={se.username} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-blue-700">{se.username.slice(0, 2).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">{se.username}</p>
                                  <p className="text-xs text-muted-foreground truncate">{se.email}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setReplaceAEPaper(null); setReplaceAESubEditorId(""); }}>Cancel</Button>
              <Button
                onClick={replaceSubEditor}
                disabled={!replaceAESubEditorId || replacingAE}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {replacingAE ? "Replacing..." : "Replace AE"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decision History */}
        <Dialog open={!!historyPaper} onOpenChange={(open) => { if (!open) { setHistoryPaper(null); setHistoryEntries([]); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Decision History
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {historyPaper && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{historyPaper.title}</p>
              )}
              {historyLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading history...
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="text-center py-10">
                  <History className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
                  <p className="text-sm text-muted-foreground">No decision history yet</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {historyEntries.map((entry: any, idx: number) => {
                    const roleColors: Record<string, string> = {
                      reviewer: "bg-purple-100 text-purple-700",
                      sub_editor: "bg-blue-100 text-blue-700",
                      chief_editor: "bg-orange-100 text-orange-700",
                    };
                    const decisionColors: Record<string, string> = {
                      accept: "text-green-600",
                      approve: "text-green-600",
                      accepted: "text-green-600",
                      revision: "text-amber-600",
                      pending_revision: "text-amber-600",
                      reject: "text-red-600",
                      rejected: "text-red-600",
                    };
                    return (
                      <div key={idx} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                            <History className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          {idx < historyEntries.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs ${roleColors[entry.role_type] || "bg-muted text-muted-foreground"}`}>
                              {entry.role_type?.replace("_", " ")}
                            </Badge>
                            <span className={`text-sm font-semibold ${decisionColors[entry.decision?.toLowerCase()] || "text-foreground"}`}>
                              {entry.decision}
                            </span>
                            {entry.version_number && (
                              <span className="text-xs text-muted-foreground">v{entry.version_number}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.username} · {entry.decided_at ? new Date(entry.decided_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </p>
                          {entry.comments && (
                            <p className="text-xs text-foreground mt-1 bg-muted/40 rounded p-2 line-clamp-3">{entry.comments}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setHistoryPaper(null); setHistoryEntries([]); }}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
