import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  ChevronRight,
  Edit3,
  Layers,
  FileText,
  MoreVertical,
  ShieldOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JournalIssue {
  id: string;
  label: string;
  year: number;
  volume: number;
  issue: number;
  issueStatus: string;
  paper_count?: number;
  published_paper_count?: number;
}

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  status: string;
  logo_url?: string;
  is_taken_down?: boolean;
  takedown_reason?: string;
  issues: JournalIssue[];
  publication_fee?: number | null;
  currency?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function PublisherJournalsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [takedownOpen, setTakedownOpen] = useState(false);
  const [takedownTarget, setTakedownTarget] = useState<Journal | null>(null);
  const [takedownReason, setTakedownReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/publisher/getJournals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setJournals(data.journals);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load journals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleTakedown = async () => {
    if (!takedownTarget || !takedownReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${url}/publisher/journals/${takedownTarget.id}/takedown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: takedownReason }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Journal taken down" });
        setTakedownOpen(false);
        setTakedownReason("");
        fetchJournals();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (journalId: string) => {
    try {
      const res = await fetch(
        `${url}/publisher/journals/${journalId}/restore`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Journal restored" });
        fetchJournals();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Restore failed",
        variant: "destructive",
      });
    }
  };

  const totalPapers = (j: Journal) =>
    j.issues.reduce((sum, i) => sum + (i.paper_count ?? 0), 0);

  const publishedPapers = (j: Journal) =>
    j.issues.reduce((sum, i) => sum + (i.published_paper_count ?? 0), 0);

  return (
    <DashboardLayout role={user?.role} userName={user?.username ?? ""}>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/publisher")}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Journals</span>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Journals</h1>
          <Button onClick={() => navigate("/publisher/create-journal")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Create Journal
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : journals.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No journals yet. Create your first journal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {journals.map((journal) => (
              <Card key={journal.id} className="flex flex-col overflow-hidden">
                {/* Cover */}
                <div className="relative bg-muted aspect-[3/2] flex items-center justify-center overflow-hidden">
                  {journal.logo_url ? (
                    <img
                      src={getFileUrl(journal.logo_url)}
                      alt={journal.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                  )}
                  {journal.is_taken_down && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-600 text-white text-[10px]">
                        Taken Down
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-sm leading-snug line-clamp-2">
                      {journal.title}
                    </h2>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/publisher/journals/${journal.id}/edit`)
                          }
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Journal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {journal.is_taken_down ? (
                          <DropdownMenuItem
                            onClick={() => handleRestore(journal.id)}
                            className="text-green-600"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setTakedownTarget(journal);
                              setTakedownOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Take Down
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {journal.acronym}
                    </Badge>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[journal.status] ?? STATUS_COLORS.draft}`}
                    >
                      {journal.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-2 text-xs text-muted-foreground space-y-1">
                  {journal.issn && <p>ISSN: {journal.issn}</p>}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {journal.issues.length} Issues
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {totalPapers(journal)} Papers
                    </span>
                    <span>{publishedPapers(journal)} Published</span>
                  </div>
                </CardContent>

                <CardFooter className="px-4 pb-4 pt-2 flex gap-2 mt-auto">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      navigate(`/publisher/journals/${journal.id}`)
                    }
                  >
                    View Journal
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(`/publisher/journals/${journal.id}/edit`)
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Takedown dialog */}
      <Dialog open={takedownOpen} onOpenChange={setTakedownOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Down Journal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will take down <strong>{takedownTarget?.title}</strong> and
            cascade to all its issues and papers.
          </p>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              placeholder="Provide a reason for the takedown..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTakedownOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!takedownReason.trim() || submitting}
              onClick={handleTakedown}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Take Down
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
