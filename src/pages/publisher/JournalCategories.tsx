import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import { Trash2, Plus, Tag, Pencil, X, Check } from "lucide-react";

interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  journal_count: number;
  created_at: string;
}

export default function PublisherJournalCategories() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<JournalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Add
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    fetch(`${url}/journal-categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.categories || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`${url}/journal-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setNewName("");
      setNewDescription("");
      setShowAddForm(false);
      fetchCategories();
      toast({ title: "Category added" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: JournalCategory) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${url}/journal-categories/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setEditId(null);
      fetchCategories();
      toast({ title: "Category updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: JournalCategory) => {
    if (cat.journal_count > 0) return;
    try {
      const res = await fetch(`${url}/journal-categories/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      fetchCategories();
      toast({ title: "Category deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="publisher" userName={user?.username}>
      <div className="max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Journal Categories</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Subject categories that publishers can assign to journals. Used for filtering on the public home page.
            </p>
          </div>
          <Button onClick={() => setShowAddForm((v) => !v)} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Category
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-card border border-border rounded-lg space-y-3">
            <h2 className="font-semibold text-sm">New Category</h2>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name (e.g., Medical Sciences)"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
                {adding ? "Adding..." : "Add"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setNewName(""); setNewDescription(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-card border border-border rounded-lg p-4">
                {editId === cat.id ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Category name" />
                    <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description (optional)" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                        <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {cat.journal_count} journal{cat.journal_count !== 1 ? "s" : ""}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.journal_count > 0}
                        title={cat.journal_count > 0 ? `${cat.journal_count} journal(s) using this category` : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
