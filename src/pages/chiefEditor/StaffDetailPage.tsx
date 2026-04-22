import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Mail,
  UserCheck,
  FileText,
  ImageIcon,
  Download,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";

interface Certification {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

interface AEPaper {
  id: string;
  title: string;
  status: string;
  submitted_at: string;
  journal_name: string;
  acronym: string;
  issue_label: string | null;
  ae_decision: string | null;
  decided_at: string | null;
  assignment_status: string;
  assigned_at: string;
}

interface ReviewPaper {
  id: string;
  title: string;
  status: string;
  submitted_at: string;
  journal_name: string;
  acronym: string;
  issue_label: string | null;
  review_decision: string | null;
  reviewed_at: string | null;
  assignment_status: string;
  assigned_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  degrees: string[] | null;
  keywords: string[] | null;
  profile_pic_url: string | null;
  certifications: Certification[];
  ae_papers: AEPaper[];
  review_papers: ReviewPaper[];
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  under_review: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  pending_revision: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  accepted: "bg-green-500/10 text-green-600 border-green-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  published: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  reviewed: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  assigned_to_sub_editor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

const DECISION_COLORS: Record<string, string> = {
  approve: "bg-green-500/10 text-green-600 border-green-500/30",
  accepted: "bg-green-500/10 text-green-600 border-green-500/30",
  reject: "bg-red-500/10 text-red-600 border-red-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  revision: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-2xl uppercase shrink-0">
      {letters}
    </div>
  );
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StaffDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    selectedId,
    paperId,
    journalId,
    role: navRole,
    scrollPosition,
    fromPath,
  } = (location.state || {}) as {
    selectedId?: string;
    paperId?: string;
    journalId?: string;
    role?: string;
    scrollPosition?: number;
    fromPath?: string;
  };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certViewer, setCertViewer] = useState<Certification | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${url}/chiefEditor/staff/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Not found");
        setProfile(data.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, userId]);

  const handleSelectAndBack = (newSelectedId: string) => {
    navigate((fromPath as any) || (-1 as any), {
      state: { restoredSelectedId: newSelectedId, scrollPosition },
    });
  };

  const handleBack = () => {
    navigate((fromPath as any) || (-1 as any), {
      state: { restoredSelectedId: selectedId, scrollPosition },
    });
  };

  const roleLabel =
    profile?.role === "sub_editor" ? "Associate Editor" : "Reviewer";
  const papers =
    profile?.role === "sub_editor"
      ? (profile?.ae_papers ?? [])
      : (profile?.review_papers ?? []);
  const activePapers = papers.filter((p) =>
    ["assigned", "pending", "accepted_invitation"].includes(
      (p as any).assignment_status,
    ),
  );
  const completedPapers = papers.filter((p) =>
    ["completed"].includes((p as any).assignment_status),
  );
  const rejectedPapers = papers.filter((p) =>
    ["rejected", "reassigned"].includes((p as any).assignment_status),
  );

  if (loading) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout role={user?.role} userName={user?.username}>
        <div className="text-center py-20 space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">
            {error || "Staff member not found."}
          </p>
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const backLabel =
    navRole === "sub_editor" ? "Associate Editors" : "Reviewers";

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to={user?.role === "sub_editor" ? "/sub-editor" : "/chief-editor"}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <button
            onClick={handleBack}
            className="hover:text-foreground transition-colors"
          >
            {backLabel}
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">
            {profile.username}
          </span>
        </nav>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-1.5 -mt-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All {backLabel}
        </Button>

        {/* Header */}
        <div className="flex items-center gap-5">
          {profile.profile_pic_url ? (
            <img
              src={`${profile.profile_pic_url}`}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <Initials name={profile.username} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profile.username}
            </h1>
            <Badge variant="outline" className="mt-1">
              {roleLabel}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {papers.length} total paper{papers.length !== 1 ? "s" : ""}{" "}
              handled
            </p>
          </div>
        </div>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
            >
              <Mail className="h-4 w-4" />
              {profile.email}
            </a>
          </CardContent>
        </Card>

        {/* Degrees */}
        {profile.degrees && profile.degrees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Degrees</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {profile.degrees.map((d, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {d}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Keywords */}
        {profile.keywords && profile.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keywords / Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Certifications
              <Badge variant="secondary" className="text-xs">
                {profile.certifications.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certifications uploaded.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.certifications.map((cert) => {
                  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].some(
                    (ext) => cert.file_name.toLowerCase().endsWith(ext),
                  );
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {isImage ? (
                        <ImageIcon className="h-8 w-8 text-blue-400 shrink-0" />
                      ) : (
                        <FileText className="h-8 w-8 text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cert.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(cert.uploaded_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 shrink-0"
                        onClick={() => setCertViewer(cert)}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Papers section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Papers Handled
              <Badge variant="secondary" className="text-xs">
                {papers.length}
              </Badge>
            </CardTitle>
            {papers.length > 0 && (
              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  <span className="font-semibold text-foreground">
                    {activePapers.length}
                  </span>{" "}
                  Active
                </span>
                <span>·</span>
                <span>
                  <span className="font-semibold text-foreground">
                    {completedPapers.length}
                  </span>{" "}
                  Completed
                </span>
                <span>·</span>
                <span>
                  <span className="font-semibold text-foreground">
                    {rejectedPapers.length}
                  </span>{" "}
                  Reassigned/Rejected
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {papers.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                No papers assigned yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {papers.map((p: any) => {
                  const decision =
                    profile.role === "sub_editor"
                      ? p.ae_decision
                      : p.review_decision;
                  return (
                    <div
                      key={p.id + p.assigned_at}
                      className="px-4 py-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug flex-1 min-w-0 line-clamp-2">
                          {p.title}
                        </p>
                        <Badge
                          className={`shrink-0 text-[10px] ${STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"}`}
                        >
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {p.journal_name}
                        </span>
                        {p.issue_label && <span>{p.issue_label}</span>}
                        {p.assigned_at && (
                          <span>Assigned {fmt(p.assigned_at)}</span>
                        )}
                        {decision && (
                          <Badge
                            className={`text-[10px] ${DECISION_COLORS[decision] || "bg-muted text-muted-foreground"}`}
                          >
                            {decision}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleBack}>
            Back
          </Button>
          {paperId && (
            <Button
              className="flex-1 gap-1.5"
              onClick={() => handleSelectAndBack(profile.id)}
            >
              <UserCheck className="h-4 w-4" />
              Select This Person
            </Button>
          )}
        </div>
      </div>

      {/* Certificate Viewer Modal */}
      <Dialog
        open={!!certViewer}
        onOpenChange={(open) => !open && setCertViewer(null)}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-base truncate max-w-[60%]">
              {certViewer?.file_name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() =>
                  certViewer && window.open(`${certViewer.file_url}`, "_blank")
                }
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCertViewer(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {certViewer &&
              (() => {
                const isImage = ["jpg", "jpeg", "png", "webp", "gif"].some(
                  (ext) => certViewer.file_name.toLowerCase().endsWith(ext),
                );
                return isImage ? (
                  <div className="h-full flex items-center justify-center p-4 bg-muted/30">
                    <img
                      src={`${certViewer.file_url}`}
                      alt={certViewer.file_name}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <iframe
                    src={`${certViewer.file_url}`}
                    title={certViewer.file_name}
                    className="w-full h-full border-0"
                  />
                );
              })()}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
