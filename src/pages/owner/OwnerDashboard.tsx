import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  BookOpen,
  Settings,
  Calendar,
  Globe,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Mail,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/components/ui/use-toast";

interface Journal {
  id: string;
  title: string;
  acronym: string;
  issn: string;
  chief_editor_id: string;
  chief_editor_username: string;
  owner_id: string;
  status: string;
  description: string;
  website_url: string;
  created_at: string;
  updated_at: string;
  expiry_at: string;
}

interface Editor {
  id: string;
  username: string;
  email: string;
}

interface Issue {
  id: string;
  journal_id: string;
  amount: number;
  created_at: string;
}

interface Journal {
  pending_payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  } | null;
}

export default function OwnerDashboard(): JSX.Element {
  const { user, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [journals, setJournals] = useState<Journal[]>([]);
  // PAYMENT_DISABLED: const [sendingInvoice, setSendingInvoice] = useState(false);
  const [chiefEditors, setChiefEditors] = useState<Editor[]>([]);
  const [editorDialog, setEditorDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [loadingEditors, setLoadingEditors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // PAYMENT_DISABLED: const [uploadReceiptDialog, setUploadReceiptDialog] = useState(false);
  // PAYMENT_DISABLED: const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  // PAYMENT_DISABLED: const [loadingPayments, setLoadingPayments] = useState(false);
  // PAYMENT_DISABLED: const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null);

  // PAYMENT_DISABLED: const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchJournals = async () => {
    try {
      const res = await fetch(`${url}/journal/getOwnerJournal/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setJournals(data.journals ?? []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch journals",
        variant: "destructive",
      });
    }
  };

  const fetchChiefEditors = async () => {
    if (!selectedJournal) return;
    setLoadingEditors(true);
    try {
      const res = await fetch(`${url}/owner/getChief-Editor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChiefEditors(data.data);
      } else {
        toast({
          title: "Failed to fetch chief editor",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error fetching chief editor",
        description: e.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoadingEditors(false);
    }
  };

  const removeEditor = async (editorId: string) => {
    if (!selectedJournal) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove this editor?",
    );
    if (!confirmed) return;

    setChiefEditors((prev) => prev.filter((e) => e.id !== editorId));

    try {
      const res = await fetch(
        `${url}/owner/journal/${selectedJournal.id}/editor/${editorId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to remove editor");

      toast({
        title: "Editor Removed",
        description: "The editor has been removed successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to remove editor",
        variant: "destructive",
      });
      fetchChiefEditors();
    }
  };

  /* PAYMENT_DISABLED: Payment step hidden per client instruction
  const sendInvoice = async (journalId: string) => {
    try {
      setSendingInvoice(true);

      const endpoint = `${url}/owner/sendJournalExpiry/${journalId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiryDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send invoice");
      }

      toast({
        title: "Invoice Sent Successfully",
        description: `Total invoice amount: ${data.data.amount} PKR`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Invoice Failed",
        description: err.message || "Could not send invoice",
      });
    } finally {
      setSendingInvoice(false);
    }
  };
  */

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      active: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      inactive: { variant: "destructive", icon: XCircle },
      draft: { variant: "outline", icon: AlertCircle },
    };
    const config = variants[status.toLowerCase()] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  /* PAYMENT_DISABLED: Payment step hidden per client instruction
  const fetchPendingPayments = async (journalId: string) => {
    try {
      setLoadingPayments(true);

      const res = await fetch(
        `${url}/owner/getPendingJournalPayment/${journalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load payments");

      setPendingPayments(data.data || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const uploadReceipt = async (paymentId: string, file: File) => {
    try {
      setUploadingPaymentId(paymentId);

      const formData = new FormData();
      formData.append("receipt", file);

      const res = await fetch(`${url}/owner/uploadpaymentImage/${paymentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast({
        title: "Receipt Uploaded",
        description: "Payment receipt uploaded successfully",
      });

      fetchPendingPayments(selectedJournal!.id);
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload receipt",
        variant: "destructive",
      });
    } finally {
      setUploadingPaymentId(null);
    }
  };
  */

  const filteredJournals = journals.filter((journal) => {
    const matchesSearch =
      journal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.issn.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" ||
      journal.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalJournals: journals.length,
    activeJournals: journals.filter((j) => j.status.toLowerCase() === "active")
      .length,
    pendingJournals: journals.filter(
      (j) => j.status.toLowerCase() === "pending",
    ).length,
    totalEditors: chiefEditors.length,
  };

  useEffect(() => {
    if (!isLoading && user?.role === "owner") fetchJournals();
  }, [user, isLoading]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );

  if (!user || user.role !== "owner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Unauthorized Access</h2>
            <p className="text-muted-foreground">
              You don't have permission to view this page.
            </p>
          </div>
        </Card>
      </div>
    );

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Full authority over journals and editorial roles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Editor
            </Button>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Journal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Journals
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalJournals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.activeJournals} active this month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Journals
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeJournals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.activeJournals / stats.totalJournals) * 100 || 0}% of
                total
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Editors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEditors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {stats.totalJournals} journals
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Authority Level
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Full</div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete editorial control
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="journals" className="space-y-4">
          <TabsList className="glass-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journals">Journals</TabsTrigger>
            <TabsTrigger value="editors">Editors</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="journals" className="space-y-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search journals by title, acronym, or ISSN..."
                      className="w-full pl-10 pr-4 py-2 bg-background/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 bg-background/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-700">
                        <TableHead>Journal Details</TableHead>
                        <TableHead>ISSN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Chief Editor</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJournals.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No journals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredJournals.map((journal) => (
                          <TableRow
                            key={journal.id}
                            className="border-b border-gray-700 hover:bg-gray-800/50"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {journal.title}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                                    {journal.acronym}
                                  </span>
                                  {journal.website_url && (
                                    <a
                                      href={journal.website_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary"
                                    >
                                      <Globe className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {journal.issn}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(journal.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {journal.chief_editor_username
                                      ?.slice(0, 2)
                                      .toUpperCase() || "CE"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate max-w-[100px]">
                                  {journal.chief_editor_username ||
                                    "Not assigned"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  journal.created_at,
                                ).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  journal.expiry_at,
                                ).toLocaleDateString()}
                              </div>
                            </TableCell>
                            {/* PAYMENT_DISABLED: Payment step hidden per client instruction */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedJournal(journal);
                                    fetchPendingPayments(journal.id);
                                    setUploadReceiptDialog(true);
                                  }}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>

                                {new Date(journal.expiry_at).getTime() -
                                  Date.now() <=
                                  30 * 24 * 60 * 60 * 1000 &&
                                  journal.status !== "pending_payment" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2"
                                      onClick={() => sendInvoice(journal.id)}
                                      disabled={sendingInvoice}
                                    >
                                      {sendingInvoice
                                        ? "Sending..."
                                        : "Send Invoice"}
                                    </Button>
                                  )} */}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editors">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Chief Editors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chiefEditors.map((editor) => (
                    <Card
                      key={editor.id}
                      className="bg-background/50 border border-gray-700"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {editor.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{editor.username}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {editor.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Chief Editor</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* PAYMENT_DISABLED: Payment step hidden per client instruction */}
      {/* <Dialog open={uploadReceiptDialog} onOpenChange={setUploadReceiptDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Upload Payment Receipts – {selectedJournal?.title}
            </DialogTitle>
          </DialogHeader>

          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No pending payments found
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-lg p-4 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-black">
                      {p.payment_type === "renewal"
                        ? "Renewal Payment"
                        : "Issue Payment"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: {p.amount} {p.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      ref={(el) => (fileInputRefs.current[p.id] = el)}
                      onChange={(e) =>
                        e.target.files && uploadReceipt(p.id, e.target.files[0])
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadingPaymentId === p.id}
                      onClick={() => fileInputRefs.current[p.id]?.click()}
                    >
                      {uploadingPaymentId === p.id
                        ? "Uploading..."
                        : "Upload Receipt"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog> */}
      <Dialog open={editorDialog} onOpenChange={setEditorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Chief Editors - {selectedJournal?.title}
            </DialogTitle>
          </DialogHeader>

          {loadingEditors ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {chiefEditors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No chief editors assigned to this journal</p>
                    <Button variant="outline" className="mt-4 gap-2">
                      <UserPlus className="h-4 w-4" />
                      Assign Chief Editor
                    </Button>
                  </div>
                ) : (
                  chiefEditors.map((editor) => (
                    <div
                      key={editor.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {editor.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{editor.username}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {editor.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => removeEditor(editor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>{" "}
    </DashboardLayout>
  );
}
