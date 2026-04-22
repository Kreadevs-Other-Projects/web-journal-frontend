import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { url } from "@/url";
import {
  UserCheck,
  Plus,
  X,
  Upload,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function ApplyReviewerPage() {
  const [searchParams] = useSearchParams();
  const journalId = searchParams.get("journalId") || "";
  const journalAcronym = searchParams.get("journal") || "";
  const appliedRole = searchParams.get("role") === "associate_editor" ? "associate_editor" : "reviewer";
  const roleLabel = appliedRole === "associate_editor" ? "Associate Editor" : "Reviewer";

  const [journalName, setJournalName] = useState<string>("");
  const [journalLoading, setJournalLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [orcid, setOrcid] = useState("");
  const [statement, setStatement] = useState("");
  const [degrees, setDegrees] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Fetch journal name
  useEffect(() => {
    if (!journalId) { setJournalLoading(false); return; }
    fetch(`${url}/journal/getJournal/${journalId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.journal) setJournalName(d.journal.title || d.journal.journal_title || "");
      })
      .catch(() => {})
      .finally(() => setJournalLoading(false));
  }, [journalId]);

  // --- Degrees ---
  const addDegree = () => {
    if (degrees.length < 5) setDegrees([...degrees, ""]);
  };
  const removeDegree = (i: number) => setDegrees(degrees.filter((_, idx) => idx !== i));
  const updateDegree = (i: number, val: string) =>
    setDegrees(degrees.map((d, idx) => (idx === i ? val : d)));

  // --- Keywords ---
  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed || keywords.length >= 5 || keywords.includes(trimmed)) return;
    setKeywords([...keywords, trimmed]);
    setKeywordInput("");
  };
  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
    }
  };

  // --- Profile pic ---
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePicPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- Validate ---
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email address";
    if (!journalId) errs.journal = "Journal ID is missing from URL";
    if (statement.length > 500) errs.statement = "Statement must be 500 characters or less";
    return errs;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("journalId", journalId);
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (affiliation.trim()) formData.append("affiliation", affiliation.trim());
      if (orcid.trim()) formData.append("orcid", orcid.trim());
      if (statement.trim()) formData.append("statement", statement.trim());
      formData.append("degrees", JSON.stringify(degrees.filter((d) => d.trim())));
      formData.append("keywords", JSON.stringify(keywords));
      if (profilePic) formData.append("profile_pic", profilePic);
      formData.append("applied_role", appliedRole);

      const res = await fetch(`${url}/contact/apply-reviewer`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Submission failed");

      setSubmittedEmail(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setErrors({ form: err.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 max-w-lg pt-28 pb-20 text-center">
          <div className="flex flex-col items-center gap-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-foreground">Application Submitted Successfully</h1>
            <p className="text-muted-foreground leading-relaxed">
              Your application has been sent to the editorial team of{" "}
              <strong>{journalName || "the journal"}</strong>. You will receive a
              confirmation at <strong>{submittedEmail}</strong>.
            </p>
            <Link to="/browse">
              <Button variant="outline">
                Apply to Another Journal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 max-w-2xl pt-24 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span className="text-sm text-primary font-medium uppercase tracking-wide">{roleLabel} Application</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Apply as {roleLabel}</h1>
          {(journalName || journalLoading) && (
            <p className="text-muted-foreground mt-1">
              Journal:{" "}
              {journalLoading ? (
                <span className="inline-block h-4 w-40 bg-muted rounded animate-pulse align-middle" />
              ) : (
                <strong>{journalName}</strong>
              )}
            </p>
          )}
          <p className="text-muted-foreground text-sm mt-2">
            Submit your qualifications to the editorial team
          </p>
        </div>

        {errors.journal && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {errors.journal}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.smith@university.edu"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Profile Picture */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Profile Picture <span className="text-muted-foreground font-normal">(optional)</span></label>
            <div className="flex items-start gap-4">
              <div
                className="w-[72px] h-[96px] rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden shrink-0 bg-muted"
                onClick={() => profilePicRef.current?.click()}
              >
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="text-center">
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <p>JPG, PNG or WebP, max 2MB.</p>
                {profilePic && (
                  <button
                    type="button"
                    className="text-destructive flex items-center gap-1 mt-2"
                    onClick={() => { setProfilePic(null); setProfilePicPreview(null); if (profilePicRef.current) profilePicRef.current.value = ""; }}
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
            <input ref={profilePicRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleProfilePicChange} />
          </div>

          {/* Degrees */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Degrees <span className="text-muted-foreground font-normal">(max 5)</span>
            </label>
            <div className="space-y-2">
              {degrees.map((deg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deg}
                    onChange={(e) => updateDegree(i, e.target.value)}
                    placeholder={`e.g. PhD Computer Science, MIT, 2018`}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {degrees.length > 1 && (
                    <button type="button" onClick={() => removeDegree(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {degrees.length < 5 && (
              <button type="button" onClick={addDegree} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                <Plus className="h-4 w-4" /> Add Degree
              </button>
            )}
          </div>

          {/* Keywords / Areas of Expertise */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Areas of Expertise <span className="text-muted-foreground font-normal">(max 5)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {keywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-0.5 text-sm">
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Type and press Enter or comma..."
                disabled={keywords.length >= 5}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={keywords.length >= 5 || !keywordInput.trim()}
                onClick={() => addKeyword(keywordInput)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length >= 5 && (
              <p className="text-xs text-muted-foreground">Maximum 5 keywords reached.</p>
            )}
          </div>

          {/* Statement */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Brief Statement <span className="text-muted-foreground font-normal">(optional, max 500 chars)</span>
            </label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Briefly describe your research background and why you'd like to review for this journal..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{statement.length}/500</p>
            {errors.statement && <p className="text-xs text-destructive">{errors.statement}</p>}
          </div>

          {/* Affiliation */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Current Institution / Affiliation <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="e.g. MIT Department of Computer Science"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {/* ORCID */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              ORCID <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0000-0000-0000"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {errors.form && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {errors.form}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
