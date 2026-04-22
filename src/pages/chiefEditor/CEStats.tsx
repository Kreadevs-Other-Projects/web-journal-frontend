import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";

interface Overall {
  total: number;
  submitted: number;
  under_review: number;
  accepted: number;
  rejected: number;
  published: number;
}

interface AEStat {
  ae_id: string;
  ae_name: string;
  ae_email: string;
  total_assigned: number;
  pending: number;
  approved: number;
  rejected: number;
  revision: number;
}

interface ReviewerStat {
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  total_assigned: number;
  pending: number;
  completed: number;
  accepted: number;
  rejected: number;
  minor_revision: number;
  major_revision: number;
}

const OVERALL_CARDS = [
  { key: "total", label: "Total Papers", color: "text-foreground" },
  { key: "submitted", label: "Awaiting AE", color: "text-yellow-600" },
  { key: "under_review", label: "Under Review", color: "text-purple-600" },
  { key: "accepted", label: "Accepted", color: "text-green-600" },
  { key: "rejected", label: "Rejected", color: "text-red-600" },
  { key: "published", label: "Published", color: "text-teal-600" },
];

export default function CEStats() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<Overall | null>(null);
  const [aeStats, setAeStats] = useState<AEStat[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStat[]>([]);
  const [reminding, setReminding] = useState<string | null>(null);

  const fetchStats = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${url}/chiefEditor/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setOverall(data.data.overall || null);
          setAeStats(data.data.ae_stats || []);
          setReviewerStats(data.data.reviewer_stats || []);
        } else {
          throw new Error(data.message);
        }
      })
      .catch((e) =>
        toast({ variant: "destructive", title: "Error", description: e.message })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleRemindAE = async (aeId: string) => {
    setReminding(`ae-${aeId}`);
    try {
      const res = await fetch(`${url}/chiefEditor/ae/${aeId}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Reminder sent", description: data.message });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setReminding(null);
    }
  };

  const handleRemindReviewer = async (reviewerId: string) => {
    setReminding(`rv-${reviewerId}`);
    try {
      const res = await fetch(`${url}/chiefEditor/reviewer/${reviewerId}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: "Reminder sent", description: data.message });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setReminding(null);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editorial Stats</h1>
          <p className="text-muted-foreground mt-1">
            Performance overview of your editorial team
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Section 3 — Overall summary cards */}
            {overall && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {OVERALL_CARDS.map(({ key, label, color }) => (
                  <Card key={key} className="text-center">
                    <CardContent className="pt-5 pb-4">
                      <p className={`text-3xl font-bold ${color}`}>
                        {(overall as any)[key] ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Section 1 — AE table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Papers by Associate Editor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {aeStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">
                    No associate editor assignments found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Associate Editor
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Total
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Pending Decision
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Approved
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Rejected
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Revision Req.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {aeStats.map((ae) => (
                          <tr
                            key={ae.ae_id}
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(`/chief-editor/papers?ae_id=${ae.ae_id}`)
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium">{ae.ae_name}</p>
                              <p className="text-xs text-muted-foreground">{ae.ae_email}</p>
                            </td>
                            <td className="text-center px-3 py-3 font-semibold">
                              {ae.total_assigned}
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                {ae.pending}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                {ae.approved}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                                {ae.rejected}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                {ae.revision}
                              </Badge>
                            </td>
                            <td
                              className="text-right px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                disabled={
                                  reminding === `ae-${ae.ae_id}` || ae.pending === 0
                                }
                                onClick={() => handleRemindAE(ae.ae_id)}
                                title={
                                  ae.pending === 0
                                    ? "No pending papers"
                                    : `Send reminder for ${ae.pending} pending paper(s)`
                                }
                              >
                                {reminding === `ae-${ae.ae_id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Bell className="h-3 w-3" />
                                )}
                                Remind
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2 — Reviewer table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Papers by Reviewer</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reviewerStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">
                    No reviewer assignments found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Reviewer
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Total
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Pending Review
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Accepted
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Rejected
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Minor Rev.
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Major Rev.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reviewerStats.map((r) => (
                          <tr
                            key={r.reviewer_id}
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/chief-editor/papers?reviewer_id=${r.reviewer_id}`
                              )
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium">{r.reviewer_name}</p>
                              <p className="text-xs text-muted-foreground">{r.reviewer_email}</p>
                            </td>
                            <td className="text-center px-3 py-3 font-semibold">
                              {r.total_assigned}
                            </td>
                            <td className="text-center px-3 py-3">
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                {r.pending}
                              </Badge>
                            </td>
                            <td className="text-center px-3 py-3">{r.accepted}</td>
                            <td className="text-center px-3 py-3">{r.rejected}</td>
                            <td className="text-center px-3 py-3">{r.minor_revision}</td>
                            <td className="text-center px-3 py-3">{r.major_revision}</td>
                            <td
                              className="text-right px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                disabled={
                                  reminding === `rv-${r.reviewer_id}` || r.pending === 0
                                }
                                onClick={() => handleRemindReviewer(r.reviewer_id)}
                                title={
                                  r.pending === 0
                                    ? "No pending reviews"
                                    : `Send reminder for ${r.pending} pending review(s)`
                                }
                              >
                                {reminding === `rv-${r.reviewer_id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Bell className="h-3 w-3" />
                                )}
                                Remind
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
