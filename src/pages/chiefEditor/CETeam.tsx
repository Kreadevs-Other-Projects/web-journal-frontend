import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  Loader2,
  UserPlus,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: "sub_editor" | "reviewer";
  inviteForm: { name: string; email: string };
  setInviteForm: React.Dispatch<
    React.SetStateAction<{ name: string; email: string }>
  >;
  inviteFieldErrors: Record<string, string>;
  setInviteFieldErrors: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  inviting: boolean;
  onSubmit: (role: "sub_editor" | "reviewer") => void;
}

function InviteDialog({
  open,
  onOpenChange,
  role,
  inviteForm,
  setInviteForm,
  inviteFieldErrors,
  setInviteFieldErrors,
  inviting,
  onSubmit,
}: InviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite {role === "sub_editor" ? "Associate Editor" : "Reviewer"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            An invitation email will be sent. They will set their own password
            when they accept.
          </p>
          <div className="space-y-1">
            <Label>Full Name *</Label>
            <Input
              placeholder="Full name"
              value={inviteForm.name}
              onChange={(e) => {
                setInviteForm((p) => ({ ...p, name: e.target.value }));
                if (inviteFieldErrors.name)
                  setInviteFieldErrors((p) => {
                    const n = { ...p };
                    delete n.name;
                    return n;
                  });
              }}
              className={inviteFieldErrors.name ? "border-destructive" : ""}
            />
            {inviteFieldErrors.name && (
              <p className="text-xs text-destructive">
                {inviteFieldErrors.name}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteForm.email}
              onChange={(e) => {
                setInviteForm((p) => ({ ...p, email: e.target.value }));
                if (inviteFieldErrors.email)
                  setInviteFieldErrors((p) => {
                    const n = { ...p };
                    delete n.email;
                    return n;
                  });
              }}
              className={inviteFieldErrors.email ? "border-destructive" : ""}
            />
            {inviteFieldErrors.email && (
              <p className="text-xs text-destructive">
                {inviteFieldErrors.email}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              setInviteForm({ name: "", email: "" });
              setInviteFieldErrors({});
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(role)}
            disabled={inviting || !inviteForm.name || !inviteForm.email}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {inviting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TeamMember {
  id: string;
  username: string;
  email: string;
  degrees?: string[] | null;
  keywords?: string[] | null;
  profile_pic_url?: string | null;
  journal_names?: string | null;
  active_assignments?: number;
}

interface PendingInvitation {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  journal_name?: string | null;
}

export default function CETeam() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [subEditors, setSubEditors] = useState<TeamMember[]>([]);
  const [reviewers, setReviewers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [openInviteSE, setOpenInviteSE] = useState(false);
  const [openInviteRev, setOpenInviteRev] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteFieldErrors, setInviteFieldErrors] = useState<
    Record<string, string>
  >({});

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [seData, rvData, invData] = await Promise.all([
        fetch(`${url}/chiefEditor/getSubEditors`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${url}/chiefEditor/getReviewers`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${url}/invitations/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);
      if (seData.success) setSubEditors(seData.data || []);
      if (rvData.success) setReviewers(rvData.data || []);
      if (invData.success) setInvitations(invData.invitations || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleInvite = async (role: "sub_editor" | "reviewer") => {
    if (!inviteForm.name || !inviteForm.email) {
      toast({
        title: "Missing fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    if (!user?.active_journal_id) {
      toast({
        title: "No journal",
        description: "You must be assigned to a journal to invite staff.",
        variant: "destructive",
      });
      return;
    }
    try {
      setInviting(true);
      const res = await fetch(`${url}/invitations/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
          role,
          journal_id: user.active_journal_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const map: Record<string, string> = {};
          data.errors.forEach((e: { field: string; message: string }) => {
            map[e.field] = e.message;
          });
          setInviteFieldErrors(map);
        }
        throw new Error(data.message || "Failed to send invitation");
      }
      setInviteFieldErrors({});
      toast({
        title: "Invitation Sent",
        description: `${inviteForm.name} has been invited as ${role.replace("_", " ")}.`,
      });
      setInviteForm({ name: "", email: "" });
      setOpenInviteSE(false);
      setOpenInviteRev(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setCancellingId(invitationId);
      const res = await fetch(`${url}/invitations/${invitationId}/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel");
      toast({ title: "Invitation cancelled" });
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const MemberCard = ({ member }: { member: TeamMember }) => (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-border last:border-0">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={member.profile_pic_url ?? undefined} />
        <AvatarFallback className="text-xs bg-muted">
          {member.username?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{member.username}</p>
        <p className="text-xs text-muted-foreground">{member.email}</p>
        {member.degrees && member.degrees.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {member.degrees.join(", ")}
          </p>
        )}
        {member.keywords && member.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {member.keywords.map((k, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {k}
              </Badge>
            ))}
          </div>
        )}
        {member.journal_names && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {member.journal_names}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {member.active_assignments ?? 0} active assignment
            {member.active_assignments !== 1 ? "s" : ""}
          </p>
          <Link
            to={`/chief-editor/staff/${member.id}`}
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );

  const PendingCard = ({ inv }: { inv: PendingInvitation }) => (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{inv.name}</p>
        <p className="text-xs text-muted-foreground">{inv.email}</p>
        {inv.journal_name && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {inv.journal_name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          Expires{" "}
          {new Date(inv.expires_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <Badge variant="secondary" className="text-xs shrink-0">
        Pending
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => handleCancelInvitation(inv.id)}
        disabled={cancellingId === inv.id}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );

  const pendingSE = invitations.filter((i) => i.role === "sub_editor");
  const pendingRev = invitations.filter((i) => i.role === "reviewer");

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your editorial team and reviewers
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="sub_editors">
            <TabsList>
              <TabsTrigger value="sub_editors">
                Associate Editors
                <Badge variant="secondary" className="ml-2">
                  {subEditors.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reviewers">
                Reviewers
                <Badge variant="secondary" className="ml-2">
                  {reviewers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* ===== Associate Editors Tab ===== */}
            <TabsContent value="sub_editors" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Active Associate Editors
                </h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setInviteForm({ name: "", email: "" });
                    setOpenInviteSE(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite New
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {subEditors.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-4">
                      No associate editors yet.
                    </p>
                  ) : (
                    subEditors.map((m) => <MemberCard key={m.id} member={m} />)
                  )}
                </CardContent>
              </Card>

              {pendingSE.length > 0 && (
                <>
                  <h2 className="text-base font-semibold flex items-center gap-2 mt-4">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Invitations
                    <Badge variant="secondary">{pendingSE.length}</Badge>
                  </h2>
                  <Card>
                    <CardContent className="p-0">
                      {pendingSE.map((inv) => (
                        <PendingCard key={inv.id} inv={inv} />
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ===== Reviewers Tab ===== */}
            <TabsContent value="reviewers" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Active Reviewers
                </h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setInviteForm({ name: "", email: "" });
                    setOpenInviteRev(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite New
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {reviewers.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-4">
                      No reviewers yet.
                    </p>
                  ) : (
                    reviewers.map((m) => <MemberCard key={m.id} member={m} />)
                  )}
                </CardContent>
              </Card>

              {pendingRev.length > 0 && (
                <>
                  <h2 className="text-base font-semibold flex items-center gap-2 mt-4">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Invitations
                    <Badge variant="secondary">{pendingRev.length}</Badge>
                  </h2>
                  <Card>
                    <CardContent className="p-0">
                      {pendingRev.map((inv) => (
                        <PendingCard key={inv.id} inv={inv} />
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <InviteDialog
        open={openInviteSE}
        onOpenChange={setOpenInviteSE}
        role="sub_editor"
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        inviteFieldErrors={inviteFieldErrors}
        setInviteFieldErrors={setInviteFieldErrors}
        inviting={inviting}
        onSubmit={handleInvite}
      />
      <InviteDialog
        open={openInviteRev}
        onOpenChange={setOpenInviteRev}
        role="reviewer"
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        inviteFieldErrors={inviteFieldErrors}
        setInviteFieldErrors={setInviteFieldErrors}
        inviting={inviting}
        onSubmit={handleInvite}
      />
    </DashboardLayout>
  );
}
