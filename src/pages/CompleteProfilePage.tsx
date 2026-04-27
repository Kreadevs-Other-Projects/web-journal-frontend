import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { User, Plus, X, BookOpen, Briefcase, ChevronRight } from "lucide-react";
import { roleConfig } from "@/lib/roles";

const EDITORIAL_ROLES = ["chief_editor", "sub_editor", "reviewer"];

export default function CompleteProfilePage() {
  const { user, token, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "";

  const [displayName, setDisplayName] = useState(user?.username ?? "");
  const [affiliation, setAffiliation] = useState("");
  const [bio, setBio] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [website, setWebsite] = useState("");
  const [degrees, setDegrees] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Profile picture must be under 2MB.",
      });
      return;
    }
    setProfilePic(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const addDegree = () => setDegrees((d) => [...d, ""]);
  const removeDegree = (i: number) =>
    setDegrees((d) => d.filter((_, idx) => idx !== i));
  const updateDegree = (i: number, val: string) =>
    setDegrees((d) => d.map((x, idx) => (idx === i ? val : x)));

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || keywords.length >= 5) return;
    if (keywords.includes(kw)) return;
    setKeywords((k) => [...k, kw]);
    setKeywordInput("");
  };
  const removeKeyword = (kw: string) =>
    setKeywords((k) => k.filter((x) => x !== kw));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const formData = new FormData();
    if (displayName) formData.append("username", displayName);
    if (affiliation) formData.append("affiliation", affiliation);
    if (bio) formData.append("bio", bio);
    if (organizationName)
      formData.append("organization_name", organizationName);
    if (website) formData.append("website", website);
    if (profilePic) formData.append("profile_pic", profilePic);

    const filteredDegrees = degrees.filter((d) => d.trim());
    if (filteredDegrees.length > 0) {
      formData.append("degrees", JSON.stringify(filteredDegrees));
    }
    if (keywords.length > 0) {
      formData.append("keywords", JSON.stringify(keywords));
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${url}/profile/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update token so profile_completed = true
      login(data.token);

      toast({
        title: "Profile complete!",
        description: "Welcome to Paperuno.",
      });

      const config = roleConfig[role];
      navigate(config?.route ?? "/", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (displayName || user?.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
            <BookOpen className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Paperuno{displayName ? `, ${displayName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Before you get started, please complete your profile. This helps
            others know who you are.
          </p>
          <p className="text-xs text-amber-400 mt-2 font-medium">
            Profile completion is required to use the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="glass-card mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center overflow-hidden hover:border-blue-400 transition-colors flex-shrink-0"
              >
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {initials}
                  </span>
                )}
              </button>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Click the circle to upload a photo. JPG, PNG or WebP, max 2MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePicChange}
              />
            </CardContent>
          </Card>

          <Card className="glass-card mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                />
              </div>

              {(EDITORIAL_ROLES.includes(role) ||
                role === "author" ||
                role === "journal_manager") && (
                <div>
                  <Label htmlFor="affiliation">
                    Affiliation / Institution{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="affiliation"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. GIKI, Department of Computer Science"
                    className="mt-1"
                    required
                  />
                </div>
              )}

              {role === "publisher" && (
                <div>
                  <Label htmlFor="organizationName">
                    Organization Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Springer Nature"
                    className="mt-1"
                    required
                  />
                </div>
              )}

              {role === "publisher" && (
                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourorganization.com"
                    className="mt-1"
                  />
                </div>
              )}

              {(role === "author" ||
                role === "publisher" ||
                role === "journal_manager") && (
                <div>
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    placeholder="Brief bio about yourself..."
                    rows={3}
                    className="mt-1 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {bio.length}/500
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {EDITORIAL_ROLES.includes(role) && (
            <>
              <Card className="glass-card mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Academic Degrees
                  </CardTitle>
                  <CardDescription>
                    Add your academic degrees (at least one required)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {degrees.map((deg, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={deg}
                        onChange={(e) => updateDegree(i, e.target.value)}
                        placeholder="e.g. PhD Computer Science, MIT, 2018"
                        required={i === 0}
                      />
                      {degrees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDegree(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={addDegree}
                  >
                    <Plus className="h-3 w-3" /> Add Degree
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Areas of Expertise</CardTitle>
                  <CardDescription>
                    Add keywords that describe your research expertise (max 5,
                    at least 1 required)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      placeholder="e.g. Machine Learning"
                      disabled={keywords.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyword}
                      disabled={keywords.length >= 5 || !keywordInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw) => (
                        <Badge
                          key={kw}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => removeKeyword(kw)}
                        >
                          {kw} <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {keywords.length}/5 keywords added
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <Button
            type="submit"
            className="w-full gap-2 text-base py-6"
            disabled={submitting}
          >
            {submitting ? (
              "Saving..."
            ) : (
              <>
                Save Profile & Continue <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
