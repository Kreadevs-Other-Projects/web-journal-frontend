import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, ChevronRight, FileText, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  label: string;
  status: string;
  volume: number;
  issue: number;
  year: number;
}

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  status: string;
  issues: Issue[];
}

export default function CEJournals() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/getChiefEditorJournals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJournals(data.journal || []);
        else throw new Error(data.message);
      })
      .catch((e) => toast({ variant: "destructive", title: "Error", description: e.message }))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Journals</h1>
          <p className="text-muted-foreground mt-1">Journals where you are the Chief Editor</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : journals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No journals assigned to you</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journals.map((journal) => {
              const openIssue = journal.issues?.find((i) => i.status === "open");
              const totalIssues = journal.issues?.length || 0;
              return (
                <Card
                  key={journal.id}
                  className="border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/chief-editor/journals/${journal.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
                        {journal.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          journal.status === "active"
                            ? "border-green-500/50 text-green-600 shrink-0"
                            : "shrink-0"
                        }
                      >
                        {journal.status}
                      </Badge>
                    </div>
                    {journal.acronym && (
                      <p className="text-xs text-muted-foreground font-mono">{journal.acronym}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                      </span>
                      {journal.issn && (
                        <span className="text-xs font-mono">ISSN: {journal.issn}</span>
                      )}
                    </div>
                    {openIssue ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                        Open: {openIssue.label || `Vol.${openIssue.volume} Issue ${openIssue.issue}`}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">No open issue</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-primary hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chief-editor/journals/${journal.id}`);
                      }}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
