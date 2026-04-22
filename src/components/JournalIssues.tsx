import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";

interface JournalIssue {
  id: string;
  year: number;
  volume?: number;
  issue?: number;
  label: string;
  published_at?: string;
}

interface Props {
  journalId: string;
  journalName: string;
  token: string;
  onBack: () => void;
}

export default function JournalIssuesPage({
  journalId,
  journalName,
  token,
  onBack,
}: Props) {
  const { user } = useAuth();

  const [issues, setIssues] = useState<JournalIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [editingIssue, setEditingIssue] = useState<JournalIssue | null>(null);

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    volume: "",
    issue: "",
    label: "",
    published_at: "",
  });

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${url}/journal-issue/getJournalIssues/${journalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setIssues(data.issues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpoint = editingIssue
        ? `${url}/journal-issue/updateJournalIssue/${editingIssue.id}`
        : `${url}/journal-issue/addJournalIssue/${journalId}`;
      const method = editingIssue ? "PUT" : "POST";

      const payload = {
        ...form,
        year: Number(form.year),
        volume: form.volume ? Number(form.volume) : undefined,
        issue: form.issue ? Number(form.issue) : undefined,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchIssues();
        setModalOpen(false);
        setEditingIssue(null);
        setForm({
          year: new Date().getFullYear(),
          volume: "",
          issue: "",
          label: "",
          published_at: "",
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (issue: JournalIssue) => {
    setEditingIssue(issue);
    setForm({
      year: issue.year,
      volume: issue.volume?.toString() || "",
      issue: issue.issue?.toString() || "",
      label: issue.label,
      published_at: issue.published_at || "",
    });
    setModalOpen(true);
  };

  const onDelete = async (id: string) => {
    setIssueToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!issueToDelete) return;
    try {
      const res = await fetch(
        `${url}/journal-issue/deleteJournalIssue/${issueToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) fetchIssues();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteModalOpen(false);
      setIssueToDelete(null);
    }
  };

  return (
    <DashboardLayout role={user.role} userName={user.username}>
      <div className="space-y-6 p-6">
        <Button onClick={onBack} className="mb-4">
          Back to Journals
        </Button>

        <h2 className="text-3xl font-bold text-white">
          {journalName} - Issues
        </h2>

        <Button onClick={() => setModalOpen(true)} className="mb-4 btn-physics">
          <Plus className="h-4 w-4 mr-2" />
          Add Issue
        </Button>

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : issues.length === 0 ? (
          <p className="text-white">No issues found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <Card key={issue.id} className="glass-card">
                <CardHeader>
                  <CardTitle>{issue.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p>Year: {issue.year}</p>
                  <p>Volume: {issue.volume ?? "-"}</p>
                  <p>Issue: {issue.issue ?? "-"}</p>
                  <p>
                    Published:{" "}
                    {issue.published_at
                      ? new Date(issue.published_at).toLocaleString()
                      : "-"}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(issue)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(issue.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={() => setModalOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIssue ? "Edit Issue" : "Add Issue"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Label>Year</Label>
              <Input name="year" value={form.year} onChange={handleChange} />

              <Label>Volume</Label>
              <Input
                name="volume"
                value={form.volume}
                onChange={handleChange}
              />

              <Label>Issue</Label>
              <Input name="issue" value={form.issue} onChange={handleChange} />

              <Label>Label</Label>
              <Input name="label" value={form.label} onChange={handleChange} />

              <Label>Published At</Label>
              <Input
                type="datetime-local"
                name="published_at"
                value={form.published_at}
                onChange={handleChange}
              />
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteModalOpen}
          onOpenChange={() => setDeleteModalOpen(false)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Issue</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete this issue? This action cannot be
              undone.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
