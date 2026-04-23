import { useEffect, useState } from "react";
import { getPaperUrl } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ExternalLink, Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { url } from "@/url";
import { motion } from "framer-motion";

interface Paper {
  paper_id: string;

  paper_title: string;

  author_names: string[];

  published_at: string;

  journal_id: string;

  journal_title: string;

  issn?: string;

  issue_id: string;

  year: number;

  volume: number;

  issue: number;

  issue_label?: string;

  doi?: string;

  article_index?: string;

  file_url?: string;
}

interface Filters {
  journals: Array<{ id: string; title: string }>;

  years: number[];
}

function formatDate(d?: string) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  });
}

export default function Archive() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [papers, setPapers] = useState<Paper[]>([]);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<Filters>({ journals: [], years: [] });

  const [loading, setLoading] = useState(true);

  // Filter state

  const [journalId, setJournalId] = useState(
    searchParams.get("journal_id") || "",
  );

  const [year, setYear] = useState(searchParams.get("year") || "");

  const [volume, setVolume] = useState(searchParams.get("volume") || "");

  const [issue, setIssue] = useState(searchParams.get("issue") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const LIMIT = 20;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const r = await fetch(`${url}/archive/filters`);

        const d = await r.json();

        if (d.success)
          setFilters({ journals: d.journals || [], years: d.years || [] });
      } catch (_) {}
    };

    fetchFilters();
  }, []);

  const fetchArchive = async (pg: number = page, searchOverride?: string) => {
    setLoading(true);

    const q = searchOverride !== undefined ? searchOverride : searchInput;
    const params = new URLSearchParams();

    if (journalId) params.set("journal_id", journalId);

    if (year) params.set("year", year);

    if (volume) params.set("volume", volume);

    if (issue) params.set("issue", issue);

    if (q) params.set("search", q);
    params.set("page", String(pg));

    params.set("limit", String(LIMIT));

    try {
      const r = await fetch(`${url}/archive?${params}`);

      const d = await r.json();

      if (d.success) {
        setPapers(d.papers || []);

        setTotal(d.total || 0);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive(1);

    setPage(1);
  }, []);

  const applyFilters = () => {
    setPage(1);

    fetchArchive(1);
  };

  const clearFilters = async () => {
    setJournalId("");

    setYear("");

    setVolume("");

    setIssue("");

    setSearchInput("");
    setPage(1);

    setLoading(true);

    try {
      const r = await fetch(`${url}/archive?page=1&limit=${LIMIT}`);

      const d = await r.json();

      if (d.success) {
        setPapers(d.papers || []);

        setTotal(d.total || 0);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Group papers by journal → year → volume/issue

  const grouped: Record<string, Record<number, Record<string, Paper[]>>> = {};

  papers.forEach((p) => {
    const jKey = p.journal_title;

    const vKey = `Vol ${p.volume}, Issue ${p.issue}`;

    if (!grouped[jKey]) grouped[jKey] = {};

    if (!grouped[jKey][p.year]) grouped[jKey][p.year] = {};

    if (!grouped[jKey][p.year][vKey]) grouped[jKey][p.year][vKey] = [];

    grouped[jKey][p.year][vKey].push(p);
  });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Archive</h1>

            <p className="text-muted-foreground mt-1">
              Browse all published articles
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT SIDEBAR — Filters */}

            <aside className="w-full md:w-64 shrink-0">
              <div className="border rounded-lg p-4 space-y-4 sticky top-24">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </h2>

                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Journal</Label>

                  <Select
                    value={journalId || "__all__"}
                    onValueChange={(v) =>
                      setJournalId(v === "__all__" ? "" : v)
                    }
                  >
                    <SelectTrigger className="text-sm h-8">
                      <SelectValue placeholder="All journals" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__all__">All journals</SelectItem>

                      {filters.journals.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>

                  <Select
                    value={year || "__all__"}
                    onValueChange={(v) => setYear(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="text-sm h-8">
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__all__">All years</SelectItem>

                      {filters.years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button size="sm" className="w-full" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </aside>

            {/* MAIN CONTENT */}

            <div className="flex-1 min-w-0">
              <form
                className="relative mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  fetchArchive(1);
                }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by title or author…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setPage(1);
                      fetchArchive(1, "");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Loading…"
                    : `Showing ${papers.length} of ${total} articles`}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <BookOpen className="h-12 w-12 opacity-30" />

                  <p>No published articles found.</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {Object.entries(grouped).map(([jTitle, years]) => (
                    <div key={jTitle}>
                      <h2 className="text-lg font-semibold mb-3">{jTitle}</h2>

                      {Object.entries(years)

                        .sort(([a], [b]) => Number(b) - Number(a))

                        .map(([yr, volumes]) => (
                          <div key={yr} className="mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                              {yr}
                            </h3>

                            {Object.entries(volumes).map(
                              ([volIssue, volPapers]) => (
                                <div key={volIssue} className="mb-4">
                                  <p className="text-sm font-medium mb-2 pl-2 border-l-2 border-primary">
                                    {volIssue}
                                  </p>

                                  <ul className="space-y-3">
                                    {volPapers.map((p) => (
                                      <li
                                        key={p.paper_id}
                                        className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                                      >
                                        <Link
                                          to={getPaperUrl(p)}
                                          className="font-medium text-sm hover:text-primary leading-snug block mb-1"
                                        >
                                          {p.paper_title}
                                        </Link>

                                        {p.author_names?.length > 0 && (
                                          <p className="text-xs text-muted-foreground mb-1">
                                            {p.author_names.join(", ")}
                                          </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(p.published_at)}
                                          </span>

                                          {p.doi && (
                                            <a
                                              href={`https://doi.org/${p.doi}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                            >
                                              DOI{" "}
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          )}

                                          <Link
                                            to={getPaperUrl(p)}
                                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                          >
                                            Read Article{" "}
                                            <ExternalLink className="h-3 w-3" />
                                          </Link>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ),
                            )}
                          </div>
                        ))}

                      <Separator className="mt-2" />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Pagination */}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => {
                      const p = page - 1;

                      setPage(p);

                      fetchArchive(p);
                    }}
                  >
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const p = page + 1;

                      setPage(p);

                      fetchArchive(p);
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
