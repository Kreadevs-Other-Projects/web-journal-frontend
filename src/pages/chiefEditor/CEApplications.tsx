import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  AtSign,
} from "lucide-react";

interface Application {
  id: string;
  journal_id: string;
  journal_name: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  degrees: string[];
  keywords: string[];
  statement?: string;
  affiliation?: string;
  orcid?: string;
  status: "pending" | "invited" | "rejected";
  applied_role: "reviewer" | "associate_editor";
  created_at: string;
}

function ApplicationCard({
  app,
  onInvite,
  onDecline,
  showActions,
}: {
  app: Application;
  onInvite?: (app: Application) => void;
  onDecline?: (app: Application) => void;
  showActions: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = app.name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const picUrl = app.profile_pic_url ? getFileUrl(app.profile_pic_url) : null;

  return (
    <div className="bg-white dark:bg-card border border-border rounded-lg border-l-4 border-l-blue-600 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-[52px] h-[69px] rounded-lg overflow-hidden shrink-0 bg-muted">
            {picUrl ? (
              <img src={picUrl} alt={app.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-foreground text-base">{app.name}</h3>
                <a href={`mailto:${app.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <AtSign className="h-3 w-3" /> {app.email}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <Badge variant="outline" className="text-xs">{app.journal_name}</Badge>
                <Badge variant="secondary" className={`text-xs ${app.applied_role === "associate_editor" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                  {app.applied_role === "associate_editor" ? "Associate Editor" : "Reviewer"}
                </Badge>
              </div>
            </div>

            {app.affiliation && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Building className="h-3 w-3" /> {app.affiliation}
              </p>
            )}

            {app.orcid && (
              <p className="text-xs text-muted-foreground mt-0.5">ORCID: {app.orcid}</p>
            )}

            {/* Keywords */}
            {app.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {app.keywords.map((k) => (
                  <span key={k} className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 text-xs">
                    {k}
                  </span>
                ))}
              </div>
            )}

            {/* Degrees */}
            {app.degrees?.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {app.degrees.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {d}</li>
                ))}
              </ul>
            )}

            {/* Statement */}
            {app.statement && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded ? "Hide statement" : "View statement"}
                </button>
                {expanded && (
                  <p className="mt-2 text-sm text-foreground leading-relaxed p-3 bg-muted rounded-md">
                    {app.statement}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onInvite?.(app)}
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {app.applied_role === "associate_editor" ? "Invite as Associate Editor" : "Invite as Reviewer"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => onDecline?.(app)}
            >
              <UserX className="h-4 w-4 mr-1.5" /> Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CEApplications() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [roleFilter, setRoleFilter] = useState<"all" | "reviewer" | "associate_editor">("all");
  const [pending, setPending] = useState<Application[]>([]);
  const [invited, setInvited] = useState<Application[]>([]);
  const [rejected, setRejected] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [declineTarget, setDeclineTarget] = useState<Application | null>(null);
  const [actioning, setActioning] = useState(false);

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    const roleParam = roleFilter !== "all" ? `&applied_role=${roleFilter}` : "";
    try {
      const [p, i, r] = await Promise.all([
        fetch(`${url}/chiefEditor/applications?status=pending${roleParam}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${url}/chiefEditor/applications?status=invited${roleParam}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${url}/chiefEditor/applications?status=rejected${roleParam}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (p.success) setPending(p.applications);
      if (i.success) setInvited(i.applications);
      if (r.success) setRejected(r.applications);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [token, roleFilter]);

  const handleInvite = async (app: Application) => {
    if (actioning) return;
    setActioning(true);
    try {
      const res = await fetch(`${url}/chiefEditor/applications/${app.id}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      toast({ title: "Invitation sent", description: data.message });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setActioning(false); }
  };

  const handleDeclineConfirm = async () => {
    if (!declineTarget || actioning) return;
    setActioning(true);
    try {
      const res = await fetch(`${url}/chiefEditor/applications/${declineTarget.id}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      toast({ title: "Application declined", description: data.message });
      setDeclineTarget(null);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setActioning(false); }
  };

  return (
    <DashboardLayout role="chief_editor" userName={user?.username}>
      <div className="max-w-4xl">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review and act on applications submitted via the public journal page
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["all", "reviewer", "associate_editor"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  roleFilter === r
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "all" ? "All Roles" : r === "reviewer" ? "Reviewers" : "Associate Editors"}
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending {pending.length > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="invited">
              Invited {invited.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({invited.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected {rejected.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({rejected.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : pending.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No pending applications.</p>
            ) : (
              <div className="space-y-4">
                {pending.map((app) => (
                  <ApplicationCard key={app.id} app={app} onInvite={handleInvite} onDecline={setDeclineTarget} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invited">
            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : invited.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No invited applications yet.</p>
            ) : (
              <div className="space-y-4">
                {invited.map((app) => (
                  <ApplicationCard key={app.id} app={app} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : rejected.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No rejected applications.</p>
            ) : (
              <div className="space-y-4">
                {rejected.map((app) => (
                  <ApplicationCard key={app.id} app={app} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Decline confirmation dialog */}
      <Dialog open={!!declineTarget} onOpenChange={(open) => { if (!open) setDeclineTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Application</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to decline <strong>{declineTarget?.name}</strong>'s application?
            A polite rejection email will be sent to them.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeclineConfirm}
              disabled={actioning}
            >
              {actioning ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
