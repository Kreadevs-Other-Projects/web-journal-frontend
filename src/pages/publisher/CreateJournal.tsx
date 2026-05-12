import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  User,
  Upload,
  X,
  Plus,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { FieldHint } from "@/components/FieldHint";

interface JournalFields {
  title: string;
  issn: string;
  doi: string;
  publisher_name: string;
  type: string;
  peer_review_policy: string;
  oa_policy: string;
  author_guidelines: string;
  aims_and_scope: string;
  journal_category_id: string;
  publication_fee: string;
  currency: string;
}

interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  journal_count: number;
}

interface StaffFields {
  name: string;
  email: string;
}

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "in",
  "for",
  "on",
  "at",
  "to",
  "a",
  "an",
  "by",
  "with",
  "de",
  "journal",
]);

function previewAcronym(title: string): string {
  if (!title.trim()) return "";
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()));

  let acronym = "";
  if (words.length >= 4) {
    acronym = words
      .slice(0, 4)
      .map((w) => w[0].toUpperCase())
      .join("");
  } else if (words.length === 3) {
    acronym = words.map((w) => w[0].toUpperCase()).join("");
    const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
    acronym += (longest[1] ?? longest[0]).toUpperCase();
  } else if (words.length === 2) {
    acronym = words.map((w) => w.slice(0, 2).toUpperCase()).join("");
  } else if (words.length === 1) {
    acronym = words[0].slice(0, 4).toUpperCase();
  } else {
    const clean = title.replace(/\s/g, "").replace(/[^a-zA-Z]/g, "");
    acronym = clean.slice(0, 4).toUpperCase();
  }
  if (acronym.length > 4) acronym = acronym.slice(0, 4);
  if (acronym.length < 4) {
    const firstWord = words[0] ?? title.replace(/\s/g, "");
    while (acronym.length < 4) {
      const nextChar =
        firstWord[acronym.length] ?? firstWord[firstWord.length - 1];
      acronym += nextChar.toUpperCase();
    }
  }
  return acronym;
}

const defaultJournal: JournalFields = {
  title: "",
  issn: "",
  doi: "",
  // publisher_name: "",
  publisher_name: "Indus Academic Press",
  type: "",
  peer_review_policy: "",
  oa_policy: "",
  author_guidelines: "",
  aims_and_scope: "",
  journal_category_id: "",
  publication_fee: "",
  currency: "PKR",
};

const defaultStaff: StaffFields = { name: "", email: "" };

const STEPS = ["Journal Details", "Chief Editor", "Journal Manager"];

export default function CreateJournal() {
  const { user, token, switchRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [journal, setJournal] = useState<JournalFields>({
    ...defaultJournal,
    // publisher_name: (user as any)?.organization_name || user?.username || "",
    publisher_name: "Indus Academic Press",
  });
  const [chiefEditor, setChiefEditor] = useState<StaffFields>(defaultStaff);
  const [journalManager, setJournalManager] =
    useState<StaffFields>(defaultStaff);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [journalCategories, setJournalCategories] = useState<JournalCategory[]>(
    [],
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // ISSN Crossref verification
  const [issnVerifying, setIssnVerifying] = useState(false);
  const [issnVerified, setIssnVerified] = useState(false);
  const [issnCrossrefTitle, setIssnCrossrefTitle] = useState("");
  const [issnWarning, setIssnWarning] = useState("");

  const verifyISSN = async (issn: string) => {
    const raw = issn.replace(/[^0-9Xx]/gi, "");
    if (raw.length !== 8) return;
    setIssnVerifying(true);
    setIssnVerified(false);
    setIssnCrossrefTitle("");
    setIssnWarning("");
    try {
      const res = await fetch(`${url}/crossref/journal/${raw}`);
      const data = await res.json();
      if (data.success && data.journal?.title) {
        setIssnVerified(true);
        setIssnCrossrefTitle(data.journal.title);
        if (
          journal.title.trim() &&
          data.journal.title.toLowerCase() !==
            journal.title.trim().toLowerCase()
        ) {
          setIssnWarning(
            `This ISSN belongs to "${data.journal.title}" in Crossref. Please verify this is correct.`,
          );
        }
      }
    } catch {
      // silently ignore — ISSN not in Crossref is ok for new journals
    } finally {
      setIssnVerifying(false);
    }
  };

  const fetchJournalCategories = () => {
    fetch(`${url}/journal-categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setJournalCategories(d.categories || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchJournalCategories();
  }, []);

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim() || addingCategory) return;
    setAddingCategory(true);
    try {
      const res = await fetch(`${url}/journal-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setNewCategoryName("");
      fetchJournalCategories();
      updateJournal("journal_category_id", data.category.id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, WebP, or GIF allowed.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be under 2MB.",
        variant: "destructive",
      });
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const updateJournal = (field: keyof JournalFields, value: string) => {
    setJournal((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  };

  const updateChiefEditor = (field: keyof StaffFields, value: string) =>
    setChiefEditor((prev) => ({ ...prev, [field]: value }));

  const updateJournalManager = (field: keyof StaffFields, value: string) =>
    setJournalManager((prev) => ({ ...prev, [field]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (
        !journal.title ||
        !journal.type ||
        !journal.peer_review_policy ||
        !journal.oa_policy ||
        !journal.author_guidelines
      ) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return false;
      }
    }
    if (step === 1) {
      if (!chiefEditor.name || !chiefEditor.email) {
        toast({
          title: "Missing fields",
          description: "Please fill in all Chief Editor fields",
          variant: "destructive",
        });
        return false;
      }
    }
    if (step === 2) {
      if (!journalManager.name || !journalManager.email) {
        toast({
          title: "Missing fields",
          description: "Please fill in all Journal Manager fields",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      formData.append("title", journal.title);
      if (journal.issn) formData.append("issn", journal.issn);
      if (journal.doi) formData.append("doi", journal.doi);
      formData.append("publisher_name", journal.publisher_name);
      formData.append("type", journal.type);
      formData.append("peer_review_policy", journal.peer_review_policy);
      formData.append("oa_policy", journal.oa_policy);
      formData.append("author_guidelines", journal.author_guidelines);
      if (journal.aims_and_scope)
        formData.append("aims_and_scope", journal.aims_and_scope);
      if (
        journal.publication_fee !== "" &&
        journal.publication_fee !== undefined
      ) {
        const fee = parseFloat(journal.publication_fee);
        if (!isNaN(fee)) formData.append("publication_fee", String(fee));
      }
      if (journal.currency) formData.append("currency", journal.currency);
      if (journal.journal_category_id)
        formData.append("journal_category_id", journal.journal_category_id);
      formData.append("chief_editor", JSON.stringify(chiefEditor));
      formData.append("journal_manager", JSON.stringify(journalManager));

      const res = await fetch(`${url}/journal/publisherCreate`, {
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
        }
        throw new Error(data.message || "Failed to create journal");
      }
      setFieldErrors({});

      toast({
        title: "Journal Created",
        description:
          "Journal created successfully. Vol 1, Issue 1 has been created as a draft. Ask your Chief Editor to open it for submissions. Invitation emails sent to Chief Editor and Journal Manager.",
      });

      // Refresh JWT so new journal_manager role appears in role switcher
      try {
        await switchRole("publisher" as UserRole, null);
      } catch {}

      navigate("/publisher");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create journal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Create New Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Journal Details
              </CardTitle>
              <CardDescription>
                Fill in the core information for the new journal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-1">
                <Label>
                  Journal Cover{" "}
                  <span className="text-muted-foreground font-normal">
                    (Portrait recommended: 3:4 ratio)
                  </span>
                </Label>
                <div className="flex items-start gap-4">
                  <div
                    className="w-[90px] h-[120px] rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden shrink-0"
                    onClick={() => logoRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Cover preview"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="text-center px-1">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">
                          Upload
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Optional. JPG, PNG, WebP or GIF, max 2MB.</p>
                    <p className="text-xs mt-1">
                      Upload a portrait-oriented cover image for best display.
                    </p>
                    {logo && (
                      <button
                        type="button"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview(null);
                          if (logoRef.current) logoRef.current.value = "";
                        }}
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  onChange={handleLogoChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>
                    Journal Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={journal.title}
                    onChange={(e) => updateJournal("title", e.target.value)}
                    placeholder="e.g. Journal of Artificial Intelligence"
                    className={fieldErrors["title"] ? "border-destructive" : ""}
                  />
                  {fieldErrors["title"] && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors["title"]}
                    </p>
                  )}
                  {!fieldErrors["title"] && (
                    <FieldHint text="The official full name of your journal as it should appear in publications." />
                  )}
                  {journal.title && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Acronym preview:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {previewAcronym(journal.title)}
                      </span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Publisher Name</Label>
                  <input
                    value={journal.publisher_name}
                    disabled
                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-70"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Set from your account profile
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>ISSN</Label>
                  <div className="relative">
                    <Input
                      value={journal.issn}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .replace(/[^0-9Xx]/g, "")
                          .toUpperCase();
                        const formatted =
                          cleaned.length <= 4
                            ? cleaned
                            : cleaned.slice(0, 4) + "-" + cleaned.slice(4, 8);
                        updateJournal("issn", formatted);
                        setIssnVerified(false);
                        setIssnCrossrefTitle("");
                        setIssnWarning("");
                      }}
                      onBlur={(e) => verifyISSN(e.target.value)}
                      placeholder="0000-000X"
                      maxLength={9}
                      className={
                        fieldErrors["issn"] ? "border-destructive" : ""
                      }
                    />
                    {issnVerifying && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {fieldErrors["issn"] ? (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors["issn"]}
                    </p>
                  ) : (
                    <FieldHint text="Format: XXXX-XXXX · Last character can be a number or X" />
                  )}
                  {issnVerified && !issnWarning && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Verified in Crossref: {issnCrossrefTitle}
                      </span>
                    </div>
                  )}
                  {issnWarning && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        {issnWarning}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>DOI</Label>
                  <Input
                    value={journal.doi}
                    onChange={(e) => updateJournal("doi", e.target.value)}
                    placeholder="e.g. 10.12345/journal.2026.001"
                    className={fieldErrors["doi"] ? "border-destructive" : ""}
                  />
                  {fieldErrors["doi"] ? (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrors["doi"]}
                    </p>
                  ) : (
                    <FieldHint text="Format: 10.XXXXX/suffix — e.g. 10.12345/tm.2026.001" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label>
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={journal.type}
                    onValueChange={(v) => updateJournal("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_access">Open Access</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHint text="Open Access means free for readers. Subscription requires payment to read." />
                </div>
                <div className="space-y-1">
                  <Label>Publication Fee per Article</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={journal.publication_fee}
                    onChange={(e) =>
                      updateJournal("publication_fee", e.target.value)
                    }
                    placeholder="e.g. 50"
                  />
                  <FieldHint text="Leave blank if no fee (Open Access). Used to calculate APC for authors." />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Select
                    value={journal.currency}
                    onValueChange={(v) => updateJournal("currency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHint text="Select the currency for all payment invoices for this journal." />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label>Subject Category</Label>
                <div className="flex gap-2">
                  <Select
                    value={journal.journal_category_id}
                    onValueChange={(v) =>
                      updateJournal("journal_category_id", v)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a subject category" />
                    </SelectTrigger>
                    <SelectContent>
                      {journalCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category..."
                      className="w-40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuickAddCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleQuickAddCategory}
                      disabled={!newCategoryName.trim() || addingCategory}
                      title="Add new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>
                  Peer Review Policy <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.peer_review_policy}
                  onChange={(html) => updateJournal("peer_review_policy", html)}
                  placeholder="Describe the peer review process..."
                />
                <FieldHint text="Describe how manuscripts are reviewed. This is shown publicly to authors." />
              </div>

              <div className="space-y-1">
                <Label>
                  OA Policy <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.oa_policy}
                  onChange={(html) => updateJournal("oa_policy", html)}
                  placeholder="Describe the open access policy..."
                />
                <FieldHint text="Describe your open access terms and licensing. Required for DOAJ indexing." />
              </div>

              <div className="space-y-1">
                <Label>
                  Author Guidelines <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={journal.author_guidelines}
                  onChange={(html) => updateJournal("author_guidelines", html)}
                  placeholder="Guidelines for authors submitting manuscripts..."
                />
                <FieldHint text="Instructions for authors on how to prepare and submit manuscripts." />
              </div>

              <div className="space-y-1">
                <Label>Aims & Scope</Label>
                <RichTextEditor
                  value={journal.aims_and_scope}
                  onChange={(html) => updateJournal("aims_and_scope", html)}
                  placeholder="Describe the journal's aims and scope..."
                />
                <FieldHint text="What topics does this journal cover? Who is the target audience?" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Invite Chief Editor
              </CardTitle>
              <CardDescription>
                An invitation email will be sent. They will set their own
                password when they accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={chiefEditor.name}
                  onChange={(e) => updateChiefEditor("name", e.target.value)}
                  placeholder="Chief Editor's full name"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={chiefEditor.email}
                  onChange={(e) => updateChiefEditor("email", e.target.value)}
                  placeholder="chief.editor@example.com"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Invite Journal Manager
              </CardTitle>
              <CardDescription>
                An invitation email will be sent. They will set their own
                password when they accept.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={journalManager.name}
                  onChange={(e) => updateJournalManager("name", e.target.value)}
                  placeholder="Journal Manager's full name"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={journalManager.email}
                  onChange={(e) =>
                    updateJournalManager("email", e.target.value)
                  }
                  placeholder="journal.manager@example.com"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={step === 0 ? () => navigate("/publisher") : handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {submitting ? "Creating..." : "Create Journal & Send Invites"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
