import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  Award,
  FileText,
  Edit2,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Upload,
  Trash2,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { UserRole, roleConfig } from "@/lib/roles";
import { url } from "../url";
import { useToast } from "@/hooks/use-toast";
import { FieldHint } from "@/components/FieldHint";
import { KeywordInput } from "@/components/KeywordInput";

const EDITORIAL_ROLES: UserRole[] = ["chief_editor", "sub_editor", "reviewer"];

const defaultUserData = {
  id: "",
  username: "",
  email: "",
  title: "",
  profile_pic: "",
  created_at: "",
  lastActive: "",
  papersSubmitted: 0,
  papersReviewed: 0,
  citationCount: 0,
  hIndex: 0,
  expertise: [] as string[],
  qualifications: "" as string | null,
  certifications: "" as string | null,
  degrees: [] as string[],
  keywords: [] as string[],
  role: null as UserRole | null,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userData, setUserData] = useState(defaultUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [newDegree, setNewDegree] = useState("");

  interface Certification {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    uploaded_at: string;
  }
  const certInputRef = useRef<HTMLInputElement | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);

  const fetchCertifications = async () => {
    try {
      const res = await fetch(`${url}/profile/certifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setCertifications(result.certifications || []);
    } catch {}
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per file.", variant: "destructive" });
      return;
    }
    setUploadingCert(true);
    try {
      const fd = new FormData();
      fd.append("certification", file);
      const res = await fetch(`${url}/profile/certifications`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Upload failed");
      toast({ title: "Uploaded", description: "Certification added." });
      fetchCertifications();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCert(false);
      if (certInputRef.current) certInputRef.current.value = "";
    }
  };

  const handleCertDelete = async (certId: string) => {
    try {
      const res = await fetch(`${url}/profile/certifications/${certId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      toast({ title: "Deleted", description: "Certification removed." });
      fetchCertifications();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const config = userData.role ? roleConfig[userData.role] : null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/profile/getProfile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        const { user: apiUser, profile: apiProfile } = result.data;
        setUserData({
          id: apiUser.id,
          username: apiUser.username,
          email: apiUser.email,
          role: apiUser.role,
          created_at: apiUser.created_at,
          title: apiUser.title || "",
          profile_pic: apiUser.profile_pic,
          lastActive: apiProfile.lastActive || apiUser.lastActive || "",
          papersSubmitted: apiProfile.papersSubmitted || 0,
          papersReviewed: apiProfile.papersReviewed || 0,
          citationCount: apiProfile.citationCount || 0,
          hIndex: apiProfile.hIndex || 0,
          expertise: Array.isArray(apiProfile.expertise)
            ? apiProfile.expertise
            : [],
          qualifications: apiProfile.qualifications || "",
          certifications: apiProfile.certifications || "",
          degrees: Array.isArray(apiProfile.degrees) ? apiProfile.degrees : [],
          keywords: Array.isArray(apiProfile.keywords)
            ? apiProfile.keywords
            : [],
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch profile",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCertifications();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", userData.username);
      if (userData.qualifications)
        formData.append("qualifications", userData.qualifications);
      if (userData.expertise.length)
        formData.append("expertise", JSON.stringify(userData.expertise));
      if (userData.degrees.length)
        formData.append("degrees", JSON.stringify(userData.degrees));
      if (userData.keywords.length)
        formData.append("keywords", JSON.stringify(userData.keywords));
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await fetch(`${url}/profile/updateProfile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        await fetchProfile();
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsEditing(false);
      if (profilePic) URL.revokeObjectURL(userData.profile_pic);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userData.id) return;

    try {
      setLoading(true);

      const res = await fetch(`${url}/profile/deleteProfile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (result.success) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        toast({
          title: "Success",
          description: "Account deleted successfully",
        });

        window.location.href = "/login";
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete account",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "Weak Password",
        description:
          "Password must be at least 6 characters and include a number and special character",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${url}/profile/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await res.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role={userData.role || "author"}
      userName={userData.username}
    >
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Profile Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2 bg-gradient-primary hover:opacity-90"
                  disabled={loading}
                >
                  <Edit2 className="h-4 w-4" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchProfile();
                      setIsEditing(false);
                    }}
                    className="gap-2 border-border hover:bg-muted text-muted-foreground"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    className="gap-2 bg-gradient-primary hover:opacity-90"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />{" "}
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">
                <User className="h-4 w-4 mr-2" /> Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" /> Personal
                        Information
                      </CardTitle>
                      <CardDescription>
                        Your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                            <AvatarImage src={userData.profile_pic} />
                            <AvatarFallback>
                              {getInitials(userData.username || "U")}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const url = URL.createObjectURL(file);
                                    setProfilePic(file);
                                    setUserData({
                                      ...userData,
                                      profile_pic: url,
                                    });
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>

                        <div className="flex-1 space-y-4">
                          {isEditing ? (
                            <Input
                              value={userData.username}
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  username: e.target.value,
                                })
                              }
                              className="text-xl font-bold"
                            />
                          ) : (
                            <h2 className="text-xl font-bold text-foreground">
                              {userData.username || "No username"}
                            </h2>
                          )}
                          <div className="flex gap-2 items-center">
                            <span>Role:</span>
                            <p className="text-primary font-medium capitalize">
                              {userData.role}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />{" "}
                              {userData.papersSubmitted} papers
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Award className="h-3 w-3" /> h-index:{" "}
                              {userData.hIndex}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Briefcase className="h-3 w-3" />{" "}
                              {userData.papersReviewed} reviews
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                            Email Address
                          </Label>
                          <Input
                            value={userData.email}
                            disabled
                            className="bg-muted cursor-not-allowed text-muted-foreground"
                          />
                          <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                        </div>
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />{" "}
                            Member Since
                          </Label>
                          <p>
                            {userData.created_at
                              ? new Date(
                                  userData.created_at,
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Areas of Expertise</Label>
                        <FieldHint text="Add topics you specialize in. These help match you to relevant papers." />
                        {isEditing ? (
                          <Input
                            value={userData.expertise.join(", ")}
                            onChange={(e) =>
                              setUserData({
                                ...userData,
                                expertise: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter((t) => t),
                              })
                            }
                            placeholder="Enter expertise separated by commas"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {userData.expertise.length ? (
                              userData.expertise.map((skill, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No expertise added yet
                              </p>
                            )}
                          </div>
                        )}

                        <Label>Qualifications</Label>
                        <FieldHint text="Your academic or professional qualifications (e.g. PhD, MSc, Professional certification)." />
                        {isEditing ? (
                          <Textarea
                            value={userData.qualifications || ""}
                            onChange={(e) =>
                              setUserData({
                                ...userData,
                                qualifications: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        ) : (
                          <p>
                            {userData.qualifications ||
                              "No qualifications added yet"}
                          </p>
                        )}

                        <div className="space-y-3">
                          <Label>Certifications &amp; Documents</Label>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG · max 5MB each · up to 5 files</p>
                          {certifications.length > 0 && (
                            <div className="space-y-2">
                              {certifications.map((cert) => (
                                <div key={cert.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5 text-sm bg-muted/30">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">{cert.file_name}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(cert.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer">
                                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                                        <Download className="h-3 w-3" /> View
                                      </Button>
                                    </a>
                                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleCertDelete(cert.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {certifications.length < 5 && (
                            <>
                              <button
                                type="button"
                                onClick={() => certInputRef.current?.click()}
                                disabled={uploadingCert}
                                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                              >
                                {uploadingCert ? (
                                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Uploading…</span>
                                ) : (
                                  <>
                                    <Upload className="h-5 w-5" />
                                    <span>Click or drag to upload a certification</span>
                                  </>
                                )}
                              </button>
                              <input ref={certInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertUpload} />
                            </>
                          )}
                          {certifications.length >= 5 && (
                            <p className="text-xs text-muted-foreground">Maximum 5 certifications reached.</p>
                          )}
                        </div>

                        {userData.role &&
                          EDITORIAL_ROLES.includes(userData.role) && (
                            <>
                              <Label>Degrees</Label>
                              <FieldHint text="Add your academic qualifications (e.g. PhD Computer Science, MIT, 2018)" />
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {userData.degrees.map((deg, idx) => (
                                      <span
                                        key={idx}
                                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                                      >
                                        {deg}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setUserData({
                                              ...userData,
                                              degrees: userData.degrees.filter(
                                                (_, i) => i !== idx,
                                              ),
                                            })
                                          }
                                          className="text-muted-foreground hover:text-destructive ml-1"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      value={newDegree}
                                      onChange={(e) =>
                                        setNewDegree(e.target.value)
                                      }
                                      placeholder="e.g. PhD Computer Science"
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          newDegree.trim()
                                        ) {
                                          e.preventDefault();
                                          setUserData({
                                            ...userData,
                                            degrees: [
                                              ...userData.degrees,
                                              newDegree.trim(),
                                            ],
                                          });
                                          setNewDegree("");
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (newDegree.trim()) {
                                          setUserData({
                                            ...userData,
                                            degrees: [
                                              ...userData.degrees,
                                              newDegree.trim(),
                                            ],
                                          });
                                          setNewDegree("");
                                        }
                                      }}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {userData.degrees.length ? (
                                    userData.degrees.map((deg, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {deg}
                                      </Badge>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No degrees added yet
                                    </p>
                                  )}
                                </div>
                              )}

                              <Label>
                                Keywords{" "}
                                <span className="text-xs text-muted-foreground">
                                  (max 5)
                                </span>
                              </Label>
                              <FieldHint text="Add up to 5 topics you specialize in. These help match you to relevant paper submissions." />
                              {isEditing ? (
                                <KeywordInput
                                  value={userData.keywords}
                                  onChange={(kws) =>
                                    setUserData({ ...userData, keywords: kws })
                                  }
                                  max={5}
                                  placeholder="e.g. Machine Learning"
                                />
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {userData.keywords.length ? (
                                    userData.keywords.map((kw, idx) => (
                                      <Badge key={idx} variant="outline">
                                        {kw}
                                      </Badge>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No keywords added yet
                                    </p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" /> Change
                        Password
                      </CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Current Password</Label>
                        <div className="relative">
                          <Input
                            type={showOldPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="pl-10"
                          />
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                          >
                            {showOldPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>New Password</Label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pl-10"
                          />
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>Confirm Password</Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="pl-10"
                          />
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                      {newPassword &&
                        confirmPassword &&
                        newPassword !== confirmPassword && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" /> Passwords do not
                            match
                          </div>
                        )}
                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          !newPassword ||
                          newPassword !== confirmPassword ||
                          loading
                        }
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
