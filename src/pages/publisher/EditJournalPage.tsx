import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import {
  ArrowLeft,
  BookOpen,
  Upload,
  X,
  Loader2,
  Pencil,
  ChevronRight,
  Lock,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface JournalData {
  id: string;
  title: string;
  issn: string | null;
  doi: string | null;
  publisher_name: string;
  type: string;
  peer_review_policy: string;
  oa_policy: string;
  author_guidelines: string;
  aims_and_scope: string | null;
  publication_fee: number | null;
  currency: string | null;
  logo_url: string | null;
}

export default function EditJournalPage() {
  const { journalId } = useParams<{ journalId: string }>();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [issn, setIssn] = useState("");
  const [doi, setDoi] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [type, setType] = useState("");
  const [peerReviewPolicy, setPeerReviewPolicy] = useState("");
  const [oaPolicy, setOaPolicy] = useState("");
  const [authorGuidelines, setAuthorGuidelines] = useState("");
  const [aimsAndScope, setAimsAndScope] = useState("");
  const [publicationFee, setPublicationFee] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!journalId || !token) return;
    fetch(`${url}/journal/getJournal/${journalId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.journal)
          throw new Error("Journal not found");
        const j: JournalData = data.journal;
        setTitle(j.title ?? "");
        setIssn(j.issn ?? "");
        setDoi(j.doi ?? "");
        setPublisherName(j.publisher_name ?? "");
        setType(j.type ?? "");
        setPeerReviewPolicy(j.peer_review_policy ?? "");
        setOaPolicy(j.oa_policy ?? "");
        setAuthorGuidelines(j.author_guidelines ?? "");
        setAimsAndScope(j.aims_and_scope ?? "");
        setPublicationFee(
          j.publication_fee != null ? String(j.publication_fee) : "",
        );
        setCurrency(j.currency ?? "USD");
        setCurrentLogoUrl(j.logo_url ?? null);
      })
      .catch((e) =>
        toast({
          variant: "destructive",
          title: "Error",
          description: e.message,
        }),
      )
      .finally(() => setLoading(false));
  }, [journalId, token]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
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

  const validate = () => {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Journal Name is required" });
      return false;
    }
    if (!publisherName.trim()) {
      toast({ variant: "destructive", title: "Publisher Name is required" });
      return false;
    }
    if (!type) {
      toast({ variant: "destructive", title: "Type is required" });
      return false;
    }
    if (!peerReviewPolicy.trim()) {
      toast({
        variant: "destructive",
        title: "Peer Review Policy is required",
      });
      return false;
    }
    if (!oaPolicy.trim()) {
      toast({ variant: "destructive", title: "OA Policy is required" });
      return false;
    }
    if (!authorGuidelines.trim()) {
      toast({
        variant: "destructive",
        title: "Author Guidelines are required",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setFieldErrors({});
      const formData = new FormData();
      if (logo) formData.append("logo", logo);
      formData.append("title", title);
      formData.append("publisher_name", publisherName);
      formData.append("type", type);
      formData.append("peer_review_policy", peerReviewPolicy);
      formData.append("oa_policy", oaPolicy);
      formData.append("author_guidelines", authorGuidelines);
      if (aimsAndScope) formData.append("aims_and_scope", aimsAndScope);
      if (publicationFee !== "") {
        const fee = parseFloat(publicationFee);
        if (!isNaN(fee)) formData.append("publication_fee", String(fee));
      }
      if (currency) formData.append("currency", currency);

      const res = await fetch(`${url}/journal/${journalId}/update`, {
        method: "PATCH",
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
        throw new Error(data.message || "Failed to update journal");
      }

      toast({ title: "Journal updated successfully" });
      navigate("/publisher");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/publisher"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">
            {title || "Journal"}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Edit</span>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/publisher")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Pencil className="h-7 w-7 text-primary" /> Edit Journal
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Update journal details
            </p>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Journal Details
            </CardTitle>
            <CardDescription>
              Edit the journal's core information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
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
                  ) : currentLogoUrl ? (
                    <img
                      src={`${url}/${currentLogoUrl}`}
                      alt="Current cover"
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
                  {(logo || currentLogoUrl) && (
                    <button
                      type="button"
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                      onClick={() => {
                        setLogo(null);
                        setLogoPreview(null);
                        if (logoRef.current) logoRef.current.value = "";
                      }}
                    >
                      <X className="h-3 w-3" /> {logo ? "Remove new logo" : ""}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Journal of AI"
                  className={fieldErrors["title"] ? "border-destructive" : ""}
                />
                {fieldErrors["title"] && (
                  <p className="text-xs text-destructive">
                    {fieldErrors["title"]}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>
                  Publisher Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  placeholder="e.g. GIKI Press"
                  className={
                    fieldErrors["publisher_name"] ? "border-destructive" : ""
                  }
                />
                {fieldErrors["publisher_name"] && (
                  <p className="text-xs text-destructive">
                    {fieldErrors["publisher_name"]}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>ISSN</Label>
                <input
                  value={issn}
                  disabled
                  className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  ISSN cannot be changed after journal creation
                </p>
              </div>
              <div className="space-y-1">
                <Label>DOI</Label>
                <input
                  value={doi}
                  disabled
                  className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  DOI cannot be changed after journal creation
                </p>
              </div>
              <div className="space-y-1">
                <Label>
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_access">Open Access</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Publication Fee per Article</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={publicationFee}
                  onChange={(e) => setPublicationFee(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PKR">PKR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>
                Peer Review Policy <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={peerReviewPolicy}
                onChange={setPeerReviewPolicy}
                placeholder="Describe the peer review process..."
              />
            </div>

            <div className="space-y-1">
              <Label>
                OA Policy <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={oaPolicy}
                onChange={setOaPolicy}
                placeholder="Describe the open access policy..."
              />
            </div>

            <div className="space-y-1">
              <Label>
                Author Guidelines <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={authorGuidelines}
                onChange={setAuthorGuidelines}
                placeholder="Guidelines for authors submitting manuscripts..."
              />
            </div>

            <div className="space-y-1">
              <Label>Aims & Scope</Label>
              <RichTextEditor
                value={aimsAndScope}
                onChange={setAimsAndScope}
                placeholder="Describe the journal's aims and scope..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/publisher")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
