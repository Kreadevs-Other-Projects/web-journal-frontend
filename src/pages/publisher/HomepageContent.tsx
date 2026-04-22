import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, MapPin, ExternalLink, Loader2 } from "lucide-react";

interface Conference {
  id: string;
  title: string;
  date: string;
  location?: string;
  link?: string;
  created_at: string;
}

export default function HomepageContent() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ title: "", date: "", location: "", link: "" });

  const fetchConferences = async () => {
    try {
      const r = await fetch(`${url}/conferences`);
      const d = await r.json();
      if (d.success) setConferences(d.conferences || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConferences(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast({ title: "Title and date are required", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const r = await fetch(`${url}/conferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to create conference");
      toast({ title: "Conference added" });
      setForm({ title: "", date: "", location: "", link: "" });
      fetchConferences();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`${url}/conferences/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to delete");
      toast({ title: "Conference deleted" });
      setConferences((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="p-6 max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Homepage Content</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage upcoming conferences shown on the public home page.
          </p>
        </div>

        {/* Add Conference Form */}
        <section className="border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold">Add Upcoming Conference</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. International Conference on AI"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Islamabad, Pakistan"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Link</label>
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Conference
            </Button>
          </form>
        </section>

        {/* Existing Conferences */}
        <section className="space-y-3">
          <h2 className="font-semibold">Upcoming Conferences ({conferences.length})</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : conferences.length === 0 ? (
            <p className="text-muted-foreground text-sm">No conferences yet.</p>
          ) : (
            <ul className="space-y-3">
              {conferences.map((c) => (
                <li key={c.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.title}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.location}
                        </span>
                      )}
                      {c.link && (
                        <a href={c.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
