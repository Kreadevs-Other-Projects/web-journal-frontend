import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { KeywordInput } from "@/components/KeywordInput";
import {
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  GripVertical,
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/AnimationWrappers";
import { UserRole } from "@/lib/roles";

interface Journal {
  id: string;
  title: string;
  available_slots?: number | null;
}

interface Reference {
  text: string;
  link: string;
}

interface AuthorDetail {
  name: string;
  email: string;
  affiliation: string;
  orcid: string;
}

interface CorrespondingAuthorDetail {
  name: string;
  email: string;
  affiliation: string;
  phone: string;
}

interface JournalPolicies {
  oa_policy: string | null;
  peer_review_policy: string | null;
}

export default function SubmitPaper() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  // Form state
  const [journalId, setJournalId] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [authorDetails, setAuthorDetails] = useState<AuthorDetail[]>([
    { name: "", email: "", affiliation: "", orcid: "" },
  ]);
  const [correspondingAuthor, setCorrespondingAuthor] =
    useState<CorrespondingAuthorDetail>({
      name: "",
      email: "",
      affiliation: "",
      phone: "",
    });
  const [corrAuthorIsSelf, setCorrAuthorIsSelf] = useState(true);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [references, setReferences] = useState<Reference[]>([
    { text: "", link: "" },
  ]);
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [extracting, setExtracting] = useState(false);
  const [extractedBanner, setExtractedBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [guidelines, setGuidelines] = useState<string | null>(null);
  const [guidelinesRead, setGuidelinesRead] = useState(false);
  const [oaPolicyRead, setOaPolicyRead] = useState(false);
  const [peerReviewRead, setPeerReviewRead] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [showOaPolicyModal, setShowOaPolicyModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);

  // Journal policies
  const [journalPolicies, setJournalPolicies] = useState<JournalPolicies>({
    oa_policy: null,
    peer_review_policy: null,
  });

  // DOI lookup
  const [doiInput, setDoiInput] = useState("");
  const [doiLoading, setDoiLoading] = useState(false);
  const [doiError, setDoiError] = useState("");

  // APC info
  const [apcFee, setApcFee] = useState<number | null>(null);
  const [apcCurrency, setApcCurrency] = useState<string>("USD");
  const [apcAgreed, setApcAgreed] = useState(false);
  // Additional information (collapsible)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [articleType, setArticleType] = useState("");
  const [category, setCategory] = useState("");
  const [conflictOfInterest, setConflictOfInterest] = useState("");
  const [noConflictOfInterest, setNoConflictOfInterest] = useState(false);
  const [fundingInfo, setFundingInfo] = useState("");
  const [dataAvailability, setDataAvailability] = useState("on_request");
  const [ethicalApproval, setEthicalApproval] = useState("");
  const [authorContributions, setAuthorContributions] = useState("");
  // New radio fields
  const [isSpecialIssue, setIsSpecialIssue] = useState(false);
  const [previouslySubmitted, setPreviouslySubmitted] = useState("no");
  const [preprintAvailable, setPreprintAvailable] = useState(false);
  const [humanSubjects, setHumanSubjects] = useState(false);
  const [otherJournalSubmission, setOtherJournalSubmission] = useState("no");

  useEffect(() => {
    setLoadingJournals(true);
    fetch(`${url}/author/getAuthorJournals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJournals(data.journals);
      })
      .finally(() => setLoadingJournals(false));
  }, [token]);

  useEffect(() => {
    fetch(`${url}/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAvailableCategories(d.categories || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!journalId) {
      setGuidelines(null);
      setGuidelinesRead(false);
      setOaPolicyRead(false);
      setPeerReviewRead(false);
      setJournalPolicies({ oa_policy: null, peer_review_policy: null });
      return;
    }
    const fetchGuidelines = async () => {
      try {
        const r = await fetch(`${url}/journal/${journalId}/guidelines`);
        const d = await r.json();
        if (d.success) setGuidelines(d.guidelines || null);
      } catch (_) {}
    };
    fetchGuidelines();

    // Fetch journal policies
    const fetchPolicies = async () => {
      try {
        const r = await fetch(`${url}/journal/getJournal/${journalId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        const j = d.journal || d;
        if (j) {
          setJournalPolicies({
            oa_policy: j.oa_policy || null,
            peer_review_policy: j.peer_review_policy || null,
          });
          setApcFee(
            j.publication_fee != null ? Number(j.publication_fee) : null,
          );
          setApcCurrency(j.currency || "USD");
        }
      } catch (_) {}
    };
    fetchPolicies();

    setGuidelinesRead(false);
    setOaPolicyRead(false);
    setPeerReviewRead(false);
    setApcFee(null);
    setApcCurrency("USD");
    setApcAgreed(false);
  }, [journalId, token]);

  const updateArrayField = <T,>(
    arr: T[],
    setter: (v: T[]) => void,
    idx: number,
    value: T,
  ) => {
    const next = [...arr];
    next[idx] = value;
    setter(next);
  };

  const addRow = <T,>(
    arr: T[],
    setter: (v: T[]) => void,
    empty: T,
    max?: number,
  ) => {
    if (max && arr.length >= max) return;
    setter([...arr, empty]);
  };

  const removeRow = <T,>(arr: T[], setter: (v: T[]) => void, idx: number) => {
    setter(arr.filter((_, i) => i !== idx));
  };

  const handleDOILookup = async () => {
    if (!doiInput.trim()) return;
    setDoiLoading(true);
    setDoiError("");
    try {
      const cleanDoi = doiInput.replace(/^https?:\/\/doi\.org\//i, "").trim();
      const res = await fetch(
        `${url}/crossref/doi?doi=${encodeURIComponent(cleanDoi)}`,
      );
      const data = await res.json();
      if (data.success && data.metadata) {
        const m = data.metadata;
        if (m.title) setTitle(m.title);
        if (m.abstract) setAbstract(m.abstract);
        if (m.keywords?.length) setKeywords(m.keywords.slice(0, 5));
        if (m.authors?.length) {
          setAuthorDetails(
            m.authors.map((a: any) => ({
              name: a.name,
              email: "",
              affiliation: a.affiliation || "",
              orcid: a.orcid || "",
            })),
          );
        }
        toast({
          title: "Metadata imported",
          description:
            "Form fields filled from Crossref. Please review and correct if needed.",
        });
      } else {
        setDoiError(data.message || "DOI not found in Crossref");
      }
    } catch {
      setDoiError("Failed to reach Crossref API");
    } finally {
      setDoiLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "tex", "latex"].includes(ext || "")) {
      toast({
        title: "Invalid file type",
        description: "Only .docx, .pdf and .tex/.latex files are accepted.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }
    setManuscript(file);
    setExtractedBanner(false);

    if (ext === "docx" || ext === "pdf" || ext === "tex" || ext === "latex") {
      setExtracting(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${url}/papers/extract-metadata`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (data.success) {
          if (data.title) setTitle(data.title);
          if (data.abstract) setAbstract(data.abstract);
          if (Array.isArray(data.keywords) && data.keywords.length > 0)
            setKeywords(data.keywords.slice(0, 5));
          if (Array.isArray(data.authors) && data.authors.length > 0) {
            setAuthorDetails(
              data.authors.map((name: string) => ({
                name,
                email: "",
                affiliation: "",
                orcid: "",
              })),
            );
          }
          if (Array.isArray(data.references) && data.references.length > 0) {
            setReferences(
              data.references
                .slice(0, 5)
                .map((t: string) => ({ text: t, link: "" })),
            );
          }
          if (data.correspondingAuthors?.[0]) {
            const ca = data.correspondingAuthors[0];
            setCorrespondingAuthor({
              name: ca.name || "",
              email: ca.email || "",
              affiliation: ca.affiliation || "",
              phone: ca.phone || "",
            });
          }
          setExtractedBanner(true);
        }
      } catch {
        // extraction failed silently — form stays empty
      } finally {
        setExtracting(false);
      }
    }
  };

  const validate = (): string | null => {
    if (!journalId) return "Please select a journal.";
    if (guidelines && !guidelinesRead)
      return "Please confirm you have read the Author Guidelines.";
    if (journalPolicies.oa_policy && !oaPolicyRead)
      return "Please confirm you have read the Open Access (OA) Policy.";
    if (journalPolicies.peer_review_policy && !peerReviewRead)
      return "Please confirm you have read the Peer Review Policy.";
    if (apcFee != null && apcFee > 0 && !apcAgreed)
      return "Please acknowledge the article processing charge (APC) before submitting.";
    if (!title.trim()) return "Title is required.";
    if (title.length > 200) return "Title cannot exceed 200 characters.";
    if (!abstract.trim()) return "Abstract is required.";
    if (abstract.length < 100)
      return "Abstract must be at least 100 characters.";
    if (abstract.length > 3000)
      return "Abstract cannot exceed 3000 characters.";
    if (authorDetails.filter((a) => a.name.trim()).length === 0)
      return "At least one author name is required.";
    if (!authorDetails[0]?.email.trim())
      return "First author email is required.";
    if (!authorDetails[0]?.affiliation.trim())
      return "First author affiliation/institution is required.";
    if (!articleType) return "Please select an article type.";
    if (keywords.length === 0) return "At least one keyword is required.";
    if (keywords.length > 5) return "Maximum 5 keywords allowed.";
    if (!corrAuthorIsSelf && !correspondingAuthor.name.trim())
      return "Corresponding author name is required.";
    if (references.filter((r) => r.text.trim()).length > 5)
      return "Maximum 5 references allowed.";
    if (!manuscript) return "Please upload your manuscript.";
    return null;
  };

  const handleOpenReview = () => {
    const err = validate();
    if (err) {
      toast({
        title: "Validation error",
        description: err,
        variant: "destructive",
      });
      return;
    }
    setShowReview(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("journal_id", journalId);
      formData.append("title", title);
      formData.append("abstract", abstract);

      const filledAuthors = authorDetails.filter((a) => a.name.trim());
      formData.append("author_details", JSON.stringify(filledAuthors));
      formData.append(
        "author_names",
        JSON.stringify(filledAuthors.map((a) => a.name)),
      );

      // When submitter is the CA, send empty list — backend goes directly to 'submitted'
      const correspondingAuthorList = corrAuthorIsSelf
        ? []
        : correspondingAuthor.name.trim()
          ? [correspondingAuthor]
          : [];
      formData.append(
        "corresponding_author_details",
        JSON.stringify(correspondingAuthorList),
      );
      formData.append(
        "corresponding_authors",
        JSON.stringify(correspondingAuthorList.map((c) => c.name)),
      );

      formData.append("keywords", JSON.stringify(keywords));
      formData.append(
        "paper_references",
        JSON.stringify(references.filter((r) => r.text.trim())),
      );
      if (manuscript) formData.append("manuscript", manuscript);
      formData.append("policies_accepted", "true");

      // Additional fields
      if (articleType) formData.append("article_type", articleType);
      if (category) formData.append("category", category);
      formData.append(
        "conflict_of_interest",
        noConflictOfInterest
          ? "The authors declare no conflict of interest."
          : conflictOfInterest,
      );
      if (fundingInfo) formData.append("funding_info", fundingInfo);
      formData.append("data_availability", dataAvailability);
      if (ethicalApproval) formData.append("ethical_approval", ethicalApproval);
      if (authorContributions)
        formData.append("author_contributions", authorContributions);
      formData.append("is_special_issue", String(isSpecialIssue));
      formData.append("previously_submitted", previouslySubmitted);
      formData.append("preprint_available", String(preprintAvailable));
      formData.append("human_subjects", String(humanSubjects));
      formData.append("other_journal_submission", otherJournalSubmission);
      formData.append("apc_agreed", String(apcAgreed));

      const res = await fetch(`${url}/papers/createPaper`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const map: Record<string, string> = {};
          data.errors.forEach((e: { field: string; message: string }) => {
            map[e.field] = e.message;
          });
          setFieldErrors(map);
          setShowReview(false);
        }
        throw new Error(data.message || "Submission failed");
      }
      setFieldErrors({});

      toast({
        title: "Paper submitted!",
        description: "Your paper has been submitted successfully.",
      });
      navigate("/author");
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setShowReview(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(fromIndex) || fromIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const updated = [...authorDetails];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setAuthorDetails(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const selectedJournal = journals.find((j) => j.id === journalId);

  const renderPolicyContent = (content: string | null) => {
    if (!content)
      return (
        <p className="text-sm text-muted-foreground">No policy available.</p>
      );
    if (content.trimStart().startsWith("<")) {
      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      );
    }
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {content}
      </p>
    );
  };

  return (
    <DashboardLayout
      role={(user?.role as UserRole) ?? "author"}
      userName={user?.username}
    >
      <PageTransition>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Submit a Paper</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fill in all fields and upload your manuscript to submit.
            </p>
          </div>

          <div className="space-y-6">
            {/* 0. Upload Manuscript First (auto-extraction for .docx) */}
            <div>
              <Label className="mb-1.5 block">Upload Manuscript *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {extracting ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Extracting metadata…</span>
                  </div>
                ) : manuscript ? (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">
                      {manuscript.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManuscript(null);
                        setExtractedBanner(false);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload{" "}
                      <span className="font-medium text-foreground">.docx</span>
                      ,{" "}
                      <span className="font-medium text-foreground">.pdf</span>{" "}
                      or{" "}
                      <span className="font-medium text-foreground">
                        .tex/.latex
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 10MB · .docx files will auto-fill the form fields
                      below
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".docx,.pdf,.tex,.latex"
                onChange={handleFileChange}
              />
            </div>

            {/* Extraction success banner */}
            {extractedBanner && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Metadata extracted from your document
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please review and correct the pre-filled fields below if
                    needed.
                  </p>
                </div>
              </div>
            )}

            {/* DOI Import */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Import from Existing DOI
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  optional
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                If your paper is already published elsewhere, enter its DOI to
                auto-fill the form.
              </p>
              <div className="flex gap-2">
                <Input
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDOILookup()}
                  placeholder="e.g. 10.1000/xyz123 or https://doi.org/10.1000/xyz123"
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  onClick={handleDOILookup}
                  disabled={doiLoading || !doiInput.trim()}
                  size="sm"
                >
                  {doiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Lookup"
                  )}
                </Button>
              </div>
              {doiError && (
                <p className="text-xs text-destructive mt-1.5">{doiError}</p>
              )}
            </div>

            {/* 1. Select Journal */}
            <div>
              <Label className="mb-1.5 block">Select Journal *</Label>
              {loadingJournals ? (
                <p className="text-sm text-muted-foreground">
                  Loading journals…
                </p>
              ) : (
                <Select
                  value={journalId}
                  onValueChange={(v) => {
                    setJournalId(v);
                    if (fieldErrors["journal_id"])
                      setFieldErrors((p) => {
                        const n = { ...p };
                        delete n["journal_id"];
                        return n;
                      });
                  }}
                >
                  <SelectTrigger
                    className={
                      fieldErrors["journal_id"] ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Choose a journal with open submissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {journals.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No journals currently open for submissions
                      </SelectItem>
                    ) : (
                      journals.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title}
                          {j.available_slots != null && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({j.available_slots} slot
                              {j.available_slots !== 1 ? "s" : ""} left)
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {fieldErrors["journal_id"] && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors["journal_id"]}
                </p>
              )}
            </div>

            {/* APC Info Box */}
            {journalId && apcFee !== null && (
              <div
                className={`rounded-lg border p-4 space-y-3 ${
                  apcFee > 0
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-green-500/40 bg-green-500/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      apcFee > 0 ? "text-amber-400" : "text-green-400"
                    }`}
                  />
                  <div className="space-y-1">
                    {apcFee > 0 ? (
                      <>
                        <p className="text-sm font-medium text-amber-300">
                          Publication Fee (APC)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This journal charges{" "}
                          <strong>
                            {apcCurrency} {apcFee.toFixed(2)}
                          </strong>{" "}
                          per Article. Total cost for this Article:{" "}
                          <strong>
                            {apcCurrency} {apcFee.toFixed(2)}
                          </strong>
                          .
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-green-300">
                          No Publication Fee (Open Access)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This journal has no article processing charge.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {apcFee > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="apc-agreed"
                      checked={apcAgreed}
                      onCheckedChange={(checked) => setApcAgreed(!!checked)}
                    />
                    <label
                      htmlFor="apc-agreed"
                      className="text-sm cursor-pointer"
                    >
                      I understand and agree to the publication fee for this
                      journal
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Policy Acceptance Checkboxes */}
            {journalId &&
              (guidelines ||
                journalPolicies.oa_policy ||
                journalPolicies.peer_review_policy) && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    Journal Policies — all required before submitting
                  </p>

                  {/* 1. Author Guidelines */}
                  {guidelines && (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="guidelines-read"
                        checked={guidelinesRead}
                        onCheckedChange={(checked) =>
                          setGuidelinesRead(!!checked)
                        }
                      />
                      <label
                        htmlFor="guidelines-read"
                        className="flex-1 text-sm cursor-pointer"
                      >
                        I have read and agree to the{" "}
                        <strong>Author Guidelines</strong>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline shrink-0"
                        onClick={() => setShowGuidelinesModal(true)}
                      >
                        Read
                      </button>
                    </div>
                  )}

                  {/* 2. OA Policy */}
                  {journalPolicies.oa_policy && (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="oa-policy-read"
                        checked={oaPolicyRead}
                        onCheckedChange={(checked) =>
                          setOaPolicyRead(!!checked)
                        }
                      />
                      <label
                        htmlFor="oa-policy-read"
                        className="flex-1 text-sm cursor-pointer"
                      >
                        I have read and agree to the{" "}
                        <strong>Open Access (OA) Policy</strong>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline shrink-0"
                        onClick={() => setShowOaPolicyModal(true)}
                      >
                        Read
                      </button>
                    </div>
                  )}

                  {/* 3. Peer Review Policy */}
                  {journalPolicies.peer_review_policy && (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="peer-review-read"
                        checked={peerReviewRead}
                        onCheckedChange={(checked) =>
                          setPeerReviewRead(!!checked)
                        }
                      />
                      <label
                        htmlFor="peer-review-read"
                        className="flex-1 text-sm cursor-pointer"
                      >
                        I have read and agree to the{" "}
                        <strong>Peer Review Policy</strong>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline shrink-0"
                        onClick={() => setShowPeerReviewModal(true)}
                      >
                        Read
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* 2. Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Title *</Label>
                <span
                  className={`text-xs ${title.length > 200 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {title.length}/200
                </span>
              </div>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors["title"])
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n["title"];
                      return n;
                    });
                }}
                maxLength={200}
                placeholder="Enter paper title"
                className={fieldErrors["title"] ? "border-destructive" : ""}
              />
              {fieldErrors["title"] && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors["title"]}
                </p>
              )}
            </div>

            {/* 3. Abstract */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Abstract *</Label>
                <span
                  className={`text-xs ${abstract.length > 3000 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {abstract.length}/500
                </span>
              </div>
              <Textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                maxLength={500}
                placeholder="Provide a brief summary of your research (100–500 characters)"
                rows={6}
              />
              {abstract.length > 0 && abstract.length < 100 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - abstract.length} more characters needed
                </p>
              )}
            </div>

            {/* 4. Author Details */}
            <div>
              <Label className="mb-1.5 block">Author(s) *</Label>
              <div className="space-y-3">
                {authorDetails.map((author, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-lg border p-4 space-y-3 relative transition-colors ${
                      dragOverIndex === i && draggedIndex !== i
                        ? "border-primary bg-primary/5"
                        : draggedIndex === i
                          ? "opacity-40 border-dashed"
                          : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Author {i + 1}
                        </span>
                      </div>
                      {authorDetails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            removeRow(authorDetails, setAuthorDetails, i)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">
                          Full Name *
                        </Label>
                        <Input
                          value={author.name}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                name: e.target.value,
                              },
                            )
                          }
                          placeholder="Dr. Jane Smith"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Email *</Label>
                        <Input
                          type="email"
                          value={author.email}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                email: e.target.value,
                              },
                            )
                          }
                          placeholder="jane@university.edu"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">
                          Affiliation/Institution *
                        </Label>
                        <Input
                          value={author.affiliation}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                affiliation: e.target.value,
                              },
                            )
                          }
                          placeholder="University of Science"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">ORCID</Label>
                        <Input
                          value={author.orcid}
                          onChange={(e) =>
                            updateArrayField(
                              authorDetails,
                              setAuthorDetails,
                              i,
                              {
                                ...author,
                                orcid: e.target.value,
                              },
                            )
                          }
                          placeholder="0000-0000-0000-0000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  addRow(authorDetails, setAuthorDetails, {
                    name: "",
                    email: "",
                    affiliation: "",
                    orcid: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add another author
              </Button>
            </div>

            {/* 5. Corresponding Author */}
            <div>
              <Label className="mb-1.5 block">Corresponding Author</Label>
              <div className="flex items-center gap-3 mb-3 p-3 bg-muted/30 rounded-lg">
                <input
                  type="checkbox"
                  id="corrAuthorIsSelf"
                  checked={corrAuthorIsSelf}
                  onChange={(e) => setCorrAuthorIsSelf(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label
                  htmlFor="corrAuthorIsSelf"
                  className="text-sm cursor-pointer select-none"
                >
                  I am the corresponding author
                </label>
              </div>
              {!corrAuthorIsSelf && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Corresponding Author Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Full Name *</Label>
                      <Input
                        value={correspondingAuthor.name}
                        onChange={(e) =>
                          setCorrespondingAuthor((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Dr. Jane Smith"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Email *</Label>
                      <Input
                        type="email"
                        value={correspondingAuthor.email}
                        onChange={(e) =>
                          setCorrespondingAuthor((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="jane@university.edu"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Affiliation *
                      </Label>
                      <Input
                        value={correspondingAuthor.affiliation}
                        onChange={(e) =>
                          setCorrespondingAuthor((prev) => ({
                            ...prev,
                            affiliation: e.target.value,
                          }))
                        }
                        placeholder="University of Science"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Phone</Label>
                      <Input
                        type="tel"
                        value={correspondingAuthor.phone}
                        onChange={(e) =>
                          setCorrespondingAuthor((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Keywords */}
            <div>
              <Label className="mb-1.5 block">
                Keywords *{" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <KeywordInput
                value={keywords}
                onChange={setKeywords}
                max={5}
                journalId={journalId || undefined}
                placeholder="Type a keyword and press Enter"
                error={fieldErrors["keywords"]}
              />
            </div>

            {/* 7. References */}
            <div>
              <Label className="mb-1.5 block">
                References{" "}
                <span className="text-muted-foreground text-xs">(max 5)</span>
              </Label>
              <div className="space-y-3">
                {references.map((ref, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={ref.text}
                        onChange={(e) =>
                          updateArrayField(references, setReferences, i, {
                            ...ref,
                            text: e.target.value,
                          })
                        }
                        placeholder={`Reference ${i + 1}`}
                      />
                      <Input
                        value={ref.link}
                        onChange={(e) =>
                          updateArrayField(references, setReferences, i, {
                            ...ref,
                            link: e.target.value,
                          })
                        }
                        placeholder="Link (optional)"
                      />
                    </div>
                    {references.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(references, setReferences, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {references.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    addRow(references, setReferences, { text: "", link: "" }, 5)
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add reference
                </Button>
              )}
            </div>

            {/* 8. Article Type (required, always visible) */}
            <div>
              <Label className="mb-1.5 block">Article Type *</Label>
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select article type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Original Research">
                    Original Research
                  </SelectItem>
                  <SelectItem value="Review Article">Review Article</SelectItem>
                  <SelectItem value="Case Report">Case Report</SelectItem>
                  <SelectItem value="Editorial">Editorial</SelectItem>
                  <SelectItem value="Commentary">Commentary</SelectItem>
                  <SelectItem value="Letter to Editor">
                    Letter to Editor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 9. Additional Information (collapsible) */}
            <div className="rounded-lg border border-border">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
                onClick={() => setShowAdditionalInfo((v) => !v)}
              >
                <span>Additional Information</span>
                {showAdditionalInfo ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showAdditionalInfo && (
                <div className="px-4 pb-4 space-y-5 divide-y divide-border">
                  {/* Category/Subject Area */}
                  <div className="pt-4">
                    <Label className="mb-1.5 block">
                      Category / Subject Area
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((c) => (
                          <SelectItem key={c.id} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Field 1 — Special Issue */}
                  <div className="pt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p className="text-sm font-medium">
                        Is this a Special Issue submission?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select whether this paper is intended for a special
                        issue call.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="isSpecialIssue"
                          checked={isSpecialIssue === true}
                          onChange={() => setIsSpecialIssue(true)}
                          className="accent-primary"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="isSpecialIssue"
                          checked={isSpecialIssue === false}
                          onChange={() => setIsSpecialIssue(false)}
                          className="accent-primary"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Field 2 — Previously Submitted */}
                  <div className="pt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p className="text-sm font-medium">
                        Has this manuscript been submitted previously to this
                        journal?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Include prior submissions or desk-rejected versions.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="previouslySubmitted"
                          checked={previouslySubmitted === "yes"}
                          onChange={() => setPreviouslySubmitted("yes")}
                          className="accent-primary"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="previouslySubmitted"
                          checked={previouslySubmitted === "no"}
                          onChange={() => setPreviouslySubmitted("no")}
                          className="accent-primary"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Field 3 — Preprint Available */}
                  <div className="pt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p className="text-sm font-medium">
                        Has a version of this manuscript been made available
                        online (preprint)?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        e.g., arXiv, bioRxiv, SSRN, or similar servers.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="preprintAvailable"
                          checked={preprintAvailable === true}
                          onChange={() => setPreprintAvailable(true)}
                          className="accent-primary"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="preprintAvailable"
                          checked={preprintAvailable === false}
                          onChange={() => setPreprintAvailable(false)}
                          className="accent-primary"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Field 4 — Human Subjects */}
                  <div className="pt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
                    <div>
                      <p className="text-sm font-medium">
                        Informed Consent / Human Subjects
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Does this research involve human participants or
                        personal data?
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="humanSubjects"
                          checked={humanSubjects === true}
                          onChange={() => setHumanSubjects(true)}
                          className="accent-primary"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="humanSubjects"
                          checked={humanSubjects === false}
                          onChange={() => setHumanSubjects(false)}
                          className="accent-primary"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Field 5 — Other Journal Submission */}
                  <div className="pt-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium">
                        Has this paper been submitted to or published in another
                        journal?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Simultaneous submission to multiple journals is not
                        permitted.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="otherJournalSubmission"
                          value="no"
                          checked={otherJournalSubmission === "no"}
                          onChange={() => setOtherJournalSubmission("no")}
                          className="accent-primary mt-0.5"
                        />
                        No, this paper has not been submitted elsewhere
                      </label>
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="otherJournalSubmission"
                          value="under_review_elsewhere"
                          checked={
                            otherJournalSubmission === "under_review_elsewhere"
                          }
                          onChange={() =>
                            setOtherJournalSubmission("under_review_elsewhere")
                          }
                          className="accent-primary mt-0.5"
                        />
                        Yes, it has been submitted to another journal (currently
                        under review)
                      </label>
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="otherJournalSubmission"
                          value="previously_submitted"
                          checked={
                            otherJournalSubmission === "previously_submitted"
                          }
                          onChange={() =>
                            setOtherJournalSubmission("previously_submitted")
                          }
                          className="accent-primary mt-0.5"
                        />
                        Yes, it was previously submitted but withdrawn/rejected
                      </label>
                    </div>
                    {(otherJournalSubmission === "under_review_elsewhere" ||
                      otherJournalSubmission === "previously_submitted") && (
                      <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700/40 p-3 text-sm text-amber-800 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                          Please note: Submitting a paper that is currently
                          under review elsewhere may violate publication ethics.
                          Ensure you have withdrawn from the other journal
                          before proceeding.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Field 6 — Data Availability (dropdown with preview) */}
                  {/* <div className="pt-4">
                    <Label className="mb-1.5 block">Data Availability</Label>
                    <Select value={dataAvailability} onValueChange={setDataAvailability}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_request">Available on reasonable request</SelectItem>
                        <SelectItem value="publicly_available">Publicly available — link/DOI provided in manuscript</SelectItem>
                        <SelectItem value="not_applicable">Not applicable — no new data generated</SelectItem>
                        <SelectItem value="restricted">Restricted — due to privacy / ethical constraints</SelectItem>
                      </SelectContent>
                    </Select>
                    {dataAvailability && (
                      <p className="mt-1.5 text-xs text-muted-foreground italic">
                        {dataAvailability === "on_request" && "The data that support the findings of this study are available from the corresponding author upon reasonable request."}
                        {dataAvailability === "publicly_available" && "The data that support the findings of this study are openly available. A link or DOI has been provided within the manuscript."}
                        {dataAvailability === "not_applicable" && "Data sharing is not applicable to this article as no new data were created or analysed in this study."}
                        {dataAvailability === "restricted" && "The data that support the findings of this study are not publicly available due to privacy or ethical restrictions."}
                      </p>
                    )}
                  </div> */}

                  {/* Field 6 — Conflict of Interest */}
                  <div className="pt-4">
                    <Label className="mb-1.5 block">
                      Conflict of Interest Statement
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="noConflict"
                        checked={noConflictOfInterest}
                        onChange={(e) => {
                          setNoConflictOfInterest(e.target.checked);
                          if (e.target.checked) setConflictOfInterest("");
                        }}
                        className="accent-primary"
                      />
                      <label
                        htmlFor="noConflict"
                        className="text-sm cursor-pointer select-none"
                      >
                        The authors declare no conflict of interest
                      </label>
                    </div>
                    {!noConflictOfInterest && (
                      <Textarea
                        value={conflictOfInterest}
                        onChange={(e) => setConflictOfInterest(e.target.value)}
                        placeholder="Describe any financial, personal, or professional conflicts…"
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Funding Information */}
                  {/* <div className="pt-4">
                    <Label className="mb-1.5 block">Funding Information</Label>
                    <Textarea
                      value={fundingInfo}
                      onChange={(e) => setFundingInfo(e.target.value)}
                      placeholder="List grant numbers and funding bodies"
                      rows={3}
                    />
                  </div> */}

                  {/* Ethical Approval */}
                  {/* <div className="pt-4">
                    <Label className="mb-1.5 block">Ethical Approval</Label>
                    <Textarea
                      value={ethicalApproval}
                      onChange={(e) => setEthicalApproval(e.target.value)}
                      placeholder="IRB number or 'Not applicable'"
                      rows={2}
                    />
                  </div> */}

                  {/* Author Contributions */}
                  <div className="pt-4">
                    <Label className="mb-1.5 block">Author Contributions</Label>
                    <Textarea
                      value={authorContributions}
                      onChange={(e) => setAuthorContributions(e.target.value)}
                      placeholder="Who did what"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Manuscript already uploaded at top */}

            {/* Submit button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/author")}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleOpenReview}>
                Review & Submit
              </Button>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        <Dialog open={showReview} onOpenChange={setShowReview}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Journal</p>
                <p>{selectedJournal?.title || journalId}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Title</p>
                <p>{title}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Abstract</p>
                <p className="whitespace-pre-wrap">{abstract}</p>
              </div>
              {articleType && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Article Type
                  </p>
                  <p>{articleType}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Authors</p>
                <ul className="space-y-1 mt-1">
                  {authorDetails
                    .filter((a) => a.name.trim())
                    .map((a, i) => (
                      <li key={i}>
                        <span className="font-medium">{a.name}</span>
                        {a.affiliation && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {a.affiliation}
                          </span>
                        )}
                        {a.email && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {a.email}
                          </span>
                        )}
                        {a.orcid && (
                          <span className="text-muted-foreground">
                            {" "}
                            · ORCID: {a.orcid}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Corresponding Author
                </p>
                {corrAuthorIsSelf ? (
                  <p className="mt-1 text-muted-foreground italic text-sm">
                    {user?.username} (submitting author) · {user?.email}
                  </p>
                ) : correspondingAuthor.name.trim() ? (
                  <p className="mt-1">
                    <span className="font-medium">
                      {correspondingAuthor.name}
                    </span>
                    {correspondingAuthor.affiliation && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {correspondingAuthor.affiliation}
                      </span>
                    )}
                    {correspondingAuthor.email && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {correspondingAuthor.email}
                      </span>
                    )}
                    {correspondingAuthor.phone && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {correspondingAuthor.phone}
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywords.map((k) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
              {references.filter((r) => r.text.trim()).length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    References
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {references
                      .filter((r) => r.text.trim())
                      .map((r, i) => (
                        <li key={i}>
                          {r.text}
                          {r.link && (
                            <span className="text-muted-foreground">
                              {" "}
                              — {r.link}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {/* Additional info summary */}
              {conflictOfInterest && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Conflict of Interest
                  </p>
                  <p className="whitespace-pre-wrap">{conflictOfInterest}</p>
                </div>
              )}
              {fundingInfo && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Funding Information
                  </p>
                  <p className="whitespace-pre-wrap">{fundingInfo}</p>
                </div>
              )}
              {dataAvailability && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Data Availability
                  </p>
                  <p className="whitespace-pre-wrap">{dataAvailability}</p>
                </div>
              )}
              {ethicalApproval && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Ethical Approval
                  </p>
                  <p className="whitespace-pre-wrap">{ethicalApproval}</p>
                </div>
              )}
              {authorContributions && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Author Contributions
                  </p>
                  <p className="whitespace-pre-wrap">{authorContributions}</p>
                </div>
              )}
              {category && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Category / Subject Area
                  </p>
                  <p>{category}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Manuscript</p>
                <p>{manuscript?.name}</p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowReview(false)}
                disabled={submitting}
              >
                Back to Edit
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirm Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Guidelines Modal */}
        <Dialog
          open={showGuidelinesModal}
          onOpenChange={setShowGuidelinesModal}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Author Guidelines</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {renderPolicyContent(guidelines || "No guidelines available.")}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setGuidelinesRead(true);
                  setShowGuidelinesModal(false);
                }}
              >
                I have read the guidelines
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OA Policy Modal */}
        <Dialog open={showOaPolicyModal} onOpenChange={setShowOaPolicyModal}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Open Access (OA) Policy</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              {renderPolicyContent(journalPolicies.oa_policy)}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setOaPolicyRead(true);
                  setShowOaPolicyModal(false);
                }}
              >
                I have read the OA Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Peer Review Policy Modal */}
        <Dialog
          open={showPeerReviewModal}
          onOpenChange={setShowPeerReviewModal}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Peer Review Policy</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              {renderPolicyContent(journalPolicies.peer_review_policy)}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setPeerReviewRead(true);
                  setShowPeerReviewModal(false);
                }}
              >
                I have read the Peer Review Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardLayout>
  );
}
