import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Search,
  Loader2,
  UserCheck,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Staff {
  id: string;
  username: string;
  email: string;
  degrees: string[] | null;
  keywords: string[] | null;
  profile_pic_url: string | null;
  keyword_matches: number;
  active_papers: number;
}

interface PaperInfo {
  id: string;
  title: string;
  journal_name: string;
  journal_id: string;
  current_ae_id: string | null;
  current_ae_name: string | null;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-base uppercase shrink-0">
      {letters}
    </div>
  );
}

export default function AssignAssociateEditorPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    location.state?.restoredSelectedId ?? null,
  );
  const [assigning, setAssigning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Invite form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteKeywords, setInviteKeywords] = useState<string[]>([]);
  const [inviteKwInput, setInviteKwInput] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!token || !paperId) return;
    // Fetch paper info
    fetch(`${url}/chiefEditor/getAllPapers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const found = (data.data || []).find((p: any) => p.id === paperId);
          if (found) setPaper(found);
        }
      })
      .catch(() => {});
  }, [token, paperId]);

  useEffect(() => {
    if (!paper?.journal_id || !token) return;
    fetch(
      `${url}/chiefEditor/journals/${paper.journal_id}/staff?role=sub_editor&paper_id=${paperId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStaff(data.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [paper, token, paperId]);

  useEffect(() => {
    if (location.state?.scrollPosition) {
      window.scrollTo(0, location.state.scrollPosition);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.username.toLowerCase().includes(q) ||
        (s.keywords || []).some((k) => k.toLowerCase().includes(q)),
    );
  }, [staff, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleConfirmAssign = async () => {
    if (!selectedId || !paperId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${url}/chiefEditor/assignSubEditor/${paperId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subEditorId: selectedId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Associate Editor assigned successfully" });
      navigate("/chief-editor/papers");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e.message,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail || !paper) return;
    setInviting(true);
    try {
      const res = await fetch(`${url}/chiefEditor/inviteSubEditor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: "sub_editor",
          journal_id: paper.journal_id,
          keywords: inviteKeywords,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: `Invitation sent to ${inviteEmail}` });
      setInviteName("");
      setInviteEmail("");
      setInviteKeywords([]);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: e.message,
      });
    } finally {
      setInviting(false);
    }
  };

  const addInviteKeyword = () => {
    const kw = inviteKwInput.trim();
    if (!kw || inviteKeywords.includes(kw) || inviteKeywords.length >= 5)
      return;
    setInviteKeywords((prev) => [...prev, kw]);
    setInviteKwInput("");
  };

  const selectedStaff = staff.find((s) => s.id === selectedId);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/chief-editor"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to="/chief-editor/papers"
            className="hover:text-foreground transition-colors"
          >
            Papers
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">
            {paper?.title || "Assign Associate Editor"}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Assign AE</span>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Assign Associate Editor
            </h1>
            {paper && (
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-medium truncate">{paper.title}</span>
                {" · "}
                {paper.journal_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT — staff cards */}
          <div className="flex-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-primary underline"
                  >
                    Try again
                  </button>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No associate editors found for this journal.
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} associate editors available
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginated.map((s) => {
                    const isCurrentAE = paper?.current_ae_id === s.id;
                    const isSelected = selectedId === s.id;
                    const isBestMatch = s.keyword_matches > 0;

                    return (
                      <Card
                        key={s.id}
                        className={`relative transition-all ${isSelected ? "ring-2 ring-primary border-primary" : ""} ${isCurrentAE ? "border-blue-400/50" : ""}`}
                      >
                        <CardContent className="pt-4 pb-4 space-y-3">
                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1 min-h-[20px]">
                            {isCurrentAE && (
                              <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-400/40">
                                Currently Assigned
                              </Badge>
                            )}
                            {isBestMatch && (
                              <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-400/40">
                                Best Match ({s.keyword_matches})
                              </Badge>
                            )}
                          </div>

                          {/* Avatar + name */}
                          <div className="flex items-center gap-3">
                            {s.profile_pic_url ? (
                              <img
                                src={`${s.profile_pic_url}`}
                                alt={s.username}
                                className="w-12 h-12 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <Initials name={s.username} />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-sm leading-tight truncate">
                                {s.username}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px] mt-0.5"
                              >
                                Associate Editor
                              </Badge>
                            </div>
                          </div>

                          {/* Degrees */}
                          {s.degrees && s.degrees.length > 0 && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {s.degrees.slice(0, 2).join(" · ")}
                            </p>
                          )}

                          {/* Keywords */}
                          {s.keywords && s.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {s.keywords.slice(0, 5).map((kw) => (
                                <span
                                  key={kw}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Workload */}
                          <p className="text-xs text-muted-foreground">
                            Handling{" "}
                            <span className="font-semibold text-foreground">
                              {s.active_papers}
                            </span>{" "}
                            active paper{s.active_papers !== 1 ? "s" : ""}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              onClick={() =>
                                setSelectedId(isSelected ? null : s.id)
                              }
                            >
                              {isSelected ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Selected
                                </>
                              ) : isCurrentAE ? (
                                "Replace"
                              ) : (
                                "Select"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() =>
                                navigate(`/chief-editor/staff/${s.id}`, {
                                  state: {
                                    selectedId,
                                    paperId,
                                    journalId: paper?.journal_id,
                                    role: "sub_editor",
                                    scrollPosition: window.scrollY,
                                    fromPath: location.pathname,
                                  },
                                })
                              }
                            >
                              Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}{" "}
                      of {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1,
                          )
                          .reduce(
                            (acc: (number | string)[], page, idx, arr) => {
                              if (
                                idx > 0 &&
                                (page as number) - (arr[idx - 1] as number) > 1
                              )
                                acc.push("...");
                              acc.push(page);
                              return acc;
                            },
                            [],
                          )
                          .map((page, idx) =>
                            page === "..." ? (
                              <span
                                key={`ellipsis-${idx}`}
                                className="px-2 text-muted-foreground"
                              >
                                ...
                              </span>
                            ) : (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page as number)}
                              >
                                {page}
                              </Button>
                            ),
                          )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT — sidebar */}
          <div className="w-full lg:w-80 space-y-4 shrink-0">
            {/* Invite new AE */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="font-semibold text-sm">
                  Invite New Associate Editor
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Full name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Keywords (max 5)</Label>
                    <div className="flex gap-1">
                      <Input
                        value={inviteKwInput}
                        onChange={(e) => setInviteKwInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addInviteKeyword();
                          }
                        }}
                        placeholder="Add keyword"
                        className="h-8 text-sm flex-1"
                        disabled={inviteKeywords.length >= 5}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={addInviteKeyword}
                        disabled={inviteKeywords.length >= 5}
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inviteKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted border"
                        >
                          {kw}
                          <button
                            onClick={() =>
                              setInviteKeywords((p) =>
                                p.filter((k) => k !== kw),
                              )
                            }
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={handleInvite}
                  disabled={inviting || !inviteName || !inviteEmail}
                >
                  {inviting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Send Invitation
                </Button>
              </CardContent>
            </Card>

            {/* Selected section */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="font-semibold text-sm">Selected</p>
                {selectedStaff ? (
                  <div className="flex items-center gap-2">
                    {selectedStaff.profile_pic_url ? (
                      <img
                        src={selectedStaff.profile_pic_url}
                        alt={selectedStaff.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Initials name={selectedStaff.username} />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedStaff.username}
                      </p>
                      <button
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={() => setSelectedId(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No one selected yet
                  </p>
                )}

                <Button
                  className="w-full"
                  disabled={!selectedId || assigning}
                  onClick={handleConfirmAssign}
                >
                  {assigning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-1" />
                  )}
                  Confirm Assign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
