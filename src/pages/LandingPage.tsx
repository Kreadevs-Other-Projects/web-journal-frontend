import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Send,
  Search,
  Users,
  Award,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  ChevronDown,
  Filter,
  Folder,
  Calendar,
  ArrowUpDown,
  FileText,
  User,
  Building,
  Hash,
  Info,
  RotateCcw,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FloatingElement,
} from "@/components/AnimationWrappers";
import { url } from "@/url";
import { getFileUrl, getPaperUrl } from "@/lib/utils";

interface SearchFilters {
  query: string;
  category: string;
  year: string;
}

const stats = [
  { label: "Papers Submitted", value: 12847, suffix: "+" },
  { label: "Expert Reviewers", value: 3256, suffix: "" },
  { label: "Acceptance Rate", value: 24, suffix: "%" },
  { label: "Countries", value: 89, suffix: "" },
];

const features = [
  {
    icon: Shield,
    title: "Double-Blind Review",
    description:
      "Complete anonymity between authors and reviewers ensures unbiased evaluation.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "Average review cycle of 4-6 weeks with real-time status tracking.",
  },
  {
    icon: FileCheck,
    title: "Version Control",
    description:
      "Full revision history with diff comparison and timeline view.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Multi-stage review process with expert committee oversight.",
  },
];

const testimonials = [
  {
    quote:
      "The most streamlined peer review experience I've ever had. The platform is intuitive and the review process is transparent.",
    author: "Dr. Sarah Chen",
    role: "Professor of Computer Science, MIT",
  },
  {
    quote:
      "As a reviewer, I appreciate the clean interface and the ability to track all my assignments in one place.",
    author: "Prof. James Miller",
    role: "Research Director, Oxford University",
  },
  {
    quote:
      "Our conference proceedings have never been more organized. GIKI Journal transformed our workflow.",
    author: "Dr. Maria Santos",
    role: "Conference Chair, ICML 2025",
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    year: "",
  });
  const [errors, setErrors] = useState<string>("");

  // Home page real data
  const [homeJournals, setHomeJournals] = useState<any[]>([]);
  const [homePapers, setHomePapers] = useState<any[]>([]);
  const [openJournals, setOpenJournals] = useState<any[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(true);
  const [openJournalsLoading, setOpenJournalsLoading] = useState(true);

  // Inline section filters
  const [journalFilters, setJournalFilters] = useState({
    q: "",
    type: "",
    category_id: "",
  });
  const [paperFilters, setPaperFilters] = useState({
    q: "",
    category: "",
    year: "",
  });

  // Journal categories for filter chips
  const [journalCategoryChips, setJournalCategoryChips] = useState<
    { id: string; name: string }[]
  >([]);
  useEffect(() => {
    fetch(`${url}/journal-categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setJournalCategoryChips(d.categories || []);
      })
      .catch(() => {});
  }, []);

  // Debounced journal filter fetch
  useEffect(() => {
    setJournalsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "6" });
        if (journalFilters.q) params.set("q", journalFilters.q);
        if (journalFilters.type) params.set("type", journalFilters.type);
        if (journalFilters.category_id)
          params.set("category_id", journalFilters.category_id);
        const r = await fetch(`${url}/browse/home/journals?${params}`);
        const d = await r.json();
        if (d.success) setHomeJournals(d.journals || []);
      } catch (_) {
      } finally {
        setJournalsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [journalFilters]);

  // Debounced paper filter fetch
  useEffect(() => {
    setPapersLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "6" });
        if (paperFilters.q) params.set("q", paperFilters.q);
        if (paperFilters.category)
          params.set("category", paperFilters.category);
        if (paperFilters.year) params.set("year", paperFilters.year);
        const r = await fetch(`${url}/browse/home/publications?${params}`);
        const d = await r.json();
        if (d.success) setHomePapers(d.papers || []);
      } catch (_) {
      } finally {
        setPapersLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [paperFilters]);

  // Open journals (no filters needed)
  useEffect(() => {
    fetch(`${url}/browse/home/open-journals`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOpenJournals(d.journals || []);
      })
      .catch(() => {})
      .finally(() => setOpenJournalsLoading(false));
  }, []);

  // Upcoming conferences
  const [conferences, setConferences] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${url}/conferences`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConferences(d.conferences || []);
      })
      .catch(() => {});
  }, []);

  // Dynamic categories from API
  const [dynamicCategories, setDynamicCategories] = useState<
    { value: string; label: string }[]
  >([]);
  useEffect(() => {
    fetch(`${url}/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.categories) {
          setDynamicCategories(
            d.categories.map((c: any) => ({ value: c.slug, label: c.name })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (errors) setErrors("");
  };
  const validateFilters = (): boolean => {
    if (!filters.query && !filters.category && !filters.year) {
      setErrors("Please select at least one search filter");
      return false;
    }
    if (filters.query && filters.query.length < 2) {
      setErrors("Search query must be at least 2 characters");
      return false;
    }

    return true;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFilters()) {
      return;
    }

    const params = new URLSearchParams();

    if (filters.query) params.append("q", filters.query);
    if (filters.category) params.append("category", filters.category);
    if (filters.year) params.append("year", filters.year);

    navigate(`/browse?${params.toString()}`);
  };

  const categories = [
    { value: "", label: "All Categories" },
    ...dynamicCategories,
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: "", label: "All Years" },
    ...Array.from({ length: currentYear - 1899 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
    })),
    { value: "older", label: "Older than 1900" },
  ];

  return (
    <PageTransition className="min-h-screen bg-background">
      <div className="noise-overlay" />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-30 dark:opacity-50" />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement delay={0} className="absolute top-1/4 left-[10%]">
            <div className="h-32 w-24 rounded-lg bg-gradient-to-br from-primary/35 dark:from-primary/20 to-primary/15 dark:to-primary/5 backdrop-blur-sm border border-primary/35 dark:border-primary/20 rotate-[-15deg]" />
          </FloatingElement>
          <FloatingElement delay={1} className="absolute top-1/3 right-[15%]">
            <div className="h-40 w-28 rounded-lg bg-gradient-to-br from-accent/35 dark:from-accent/20 to-accent/15 dark:to-accent/5 backdrop-blur-sm border border-accent/35 dark:border-accent/20 rotate-[10deg]" />
          </FloatingElement>
          <FloatingElement delay={2} className="absolute bottom-1/4 left-[20%]">
            <div className="h-28 w-20 rounded-lg bg-gradient-to-br from-info/35 dark:from-info/20 to-info/15 dark:to-info/5 backdrop-blur-sm border border-info/35 dark:border-info/20 rotate-[5deg]" />
          </FloatingElement>
          <FloatingElement
            delay={0.5}
            className="absolute bottom-1/3 right-[25%]"
          >
            <div className="h-36 w-26 rounded-lg bg-gradient-to-br from-success/35 dark:from-success/20 to-success/15 dark:to-success/5 backdrop-blur-sm border border-success/35 dark:border-success/20 rotate-[-8deg]" />
          </FloatingElement>
        </div>

        {/* Hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <StaggerContainer className="max-w-4xl mx-auto">
            <StaggerItem>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-accent font-medium">
                  Conference 2026 Submissions Open
                </span>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-serif-outfit text-5xl md:text-7xl font-bold leading-tight mb-6">
                <span className="text-foreground">Elevate Your</span>
                <br />
                <span className="text-gradient-primary">
                  Scientific Publishing
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                A premium platform for blind peer review and journal management.
                Submit, review, and publish with confidence.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col items-center justify-center gap-8">
                {/* Horizontal Search Bar - Single Line */}
                <div className="w-full max-w-6xl mx-auto">
                  <div className="relative glass-card p-4 rounded-2xl border border-border/50 shadow-2xl">
                    <form onSubmit={handleSearch}>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search Input - Left */}
                        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <Search className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search papers by title, author, or keywords..."
                            value={filters.query}
                            onChange={(e) =>
                              handleFilterChange("query", e.target.value)
                            }
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-foreground placeholder:text-muted-foreground"
                          />
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <select
                              value={filters.category}
                              onChange={(e) =>
                                handleFilterChange("category", e.target.value)
                              }
                              className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                            >
                              {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        {/* Year Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <select
                              value={filters.year}
                              onChange={(e) =>
                                handleFilterChange("year", e.target.value)
                              }
                              className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground appearance-none cursor-pointer"
                            >
                              {years.map((year) => (
                                <option key={year.value} value={year.value}>
                                  {year.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        {/* Search Button */}
                        <Button
                          type="submit"
                          className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-6 py-3 whitespace-nowrap flex-shrink-0"
                        >
                          <Search className="h-5 w-5 mr-2" />
                          Search
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Error Message */}
                  {errors && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errors}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JOURNALS SECTION ===== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                Journals
              </h2>
              <p className="text-muted-foreground mt-1">
                Explore our collection of peer-reviewed academic journals
              </p>
            </div>
            <Link to="/browse">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Journal category chips */}
          {journalCategoryChips.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() =>
                  setJournalFilters((p) => ({ ...p, category_id: "" }))
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  !journalFilters.category_id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                All
              </button>
              {journalCategoryChips.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setJournalFilters((p) => ({
                      ...p,
                      category_id: p.category_id === cat.id ? "" : cat.id,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                    journalFilters.category_id === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Journal search + type filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search journals..."
                value={journalFilters.q}
                onChange={(e) =>
                  setJournalFilters((p) => ({ ...p, q: e.target.value }))
                }
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <select
              value={journalFilters.type}
              onChange={(e) =>
                setJournalFilters((p) => ({ ...p, type: e.target.value }))
              }
              className="py-2 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Types</option>
              <option value="open_access">Open Access</option>
              <option value="subscription">Subscription</option>
            </select>
            {(journalFilters.q ||
              journalFilters.type ||
              journalFilters.category_id) && (
              <button
                onClick={() =>
                  setJournalFilters({ q: "", type: "", category_id: "" })
                }
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {journalsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border p-5 space-y-3"
                >
                  <Skeleton className="h-[62px] w-[62px] rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : homeJournals.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {journalFilters.q ||
              journalFilters.type ||
              journalFilters.category_id
                ? "No journals match your filters."
                : "No journals available yet."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeJournals.map((j) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card flex flex-col group overflow-hidden"
                >
                  {(() => {
                    const placeholderColors = [
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-green-500",
                      "bg-red-500",
                      "bg-orange-500",
                      "bg-pink-500",
                    ];
                    const bg =
                      placeholderColors[
                        (j.title?.charCodeAt(0) ?? 0) % placeholderColors.length
                      ];
                    const initials =
                      j.title
                        ?.split(" ")
                        .filter(
                          (w: string) =>
                            ![
                              "of",
                              "the",
                              "and",
                              "for",
                              "in",
                              "a",
                              "an",
                            ].includes(w.toLowerCase()),
                        )
                        .slice(0, 3)
                        .map((w: string) => w[0]?.toUpperCase() ?? "")
                        .join("") ?? "J";
                    return (
                      <div className="h-[200px] w-full overflow-hidden bg-muted shrink-0">
                        {j.logo_url ? (
                          <img
                            src={getFileUrl(j.logo_url)}
                            alt={j.title}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex flex-col items-center justify-center font-bold text-white ${bg}`}
                          >
                            <span className="text-4xl">{initials}</span>
                            <span className="text-xs text-white/60 mt-1">
                              No Cover
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                        {j.title}
                      </h3>
                      {j.issn && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ISSN: {j.issn}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {j.type && (
                        <Badge variant="secondary" className="text-xs">
                          {j.type === "open_access"
                            ? "Open Access"
                            : "Subscription"}
                        </Badge>
                      )}
                      {j.category_name && (
                        <Badge
                          variant="outline"
                          className="text-xs border-primary/30 text-primary/80"
                        >
                          {j.category_name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {j.article_count ?? 0} article
                        {j.article_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link to={`/journal/${j.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-auto"
                      >
                        View Journal <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== OPEN FOR SUBMISSIONS SECTION ===== */}
      {(openJournalsLoading || openJournals.length > 0) && (
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                  Open for Submissions
                </h2>
                <p className="text-muted-foreground mt-1">
                  Submit your research to these journals currently accepting
                  manuscripts
                </p>
              </div>
            </div>

            {openJournalsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border p-5 space-y-3"
                  >
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openJournals.map((j) => {
                  const placeholderColors = [
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-green-500",
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-pink-500",
                  ];
                  const bg =
                    placeholderColors[
                      (j.title?.charCodeAt(0) ?? 0) % placeholderColors.length
                    ];
                  const initials =
                    j.title
                      ?.split(" ")
                      .filter(
                        (w: string) =>
                          ![
                            "of",
                            "the",
                            "and",
                            "for",
                            "in",
                            "a",
                            "an",
                          ].includes(w.toLowerCase()),
                      )
                      .slice(0, 3)
                      .map((w: string) => w[0]?.toUpperCase() ?? "")
                      .join("") ?? "J";
                  return (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="glass-card p-5 flex flex-col gap-3 border-emerald-500/20"
                    >
                      <div className="flex items-center gap-3">
                        {j.logo_url ? (
                          <div className="w-[45px] h-[60px] rounded-lg overflow-hidden shrink-0">
                            <img
                              src={getFileUrl(j.logo_url)}
                              alt={j.title}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-[45px] h-[60px] rounded-lg flex flex-col items-center justify-center font-bold text-white shrink-0 ${bg}`}
                          >
                            <span className="text-base">{initials}</span>
                            <span className="text-[8px] text-white/60">
                              No Cover
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                            {j.title}
                          </h3>
                          {j.issn && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ISSN: {j.issn}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border">
                          Open
                        </Badge>
                        {j.open_issue_label && (
                          <span className="text-xs text-muted-foreground">
                            {j.open_issue_label}
                          </span>
                        )}
                        {j.slots_remaining !== undefined &&
                          j.slots_remaining > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {j.slots_remaining} slots remaining
                            </span>
                          )}
                      </div>
                      <Link to={`/signup`}>
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-auto"
                        >
                          Submit Now <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== RECENT PUBLICATIONS SECTION ===== */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                Recent Publications
              </h2>
              <p className="text-muted-foreground mt-1">
                Latest research published in our journals
              </p>
            </div>
            <Link to="/archive">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Paper filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or keyword..."
                value={paperFilters.q}
                onChange={(e) =>
                  setPaperFilters((p) => ({ ...p, q: e.target.value }))
                }
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <select
              value={paperFilters.category}
              onChange={(e) =>
                setPaperFilters((p) => ({ ...p, category: e.target.value }))
              }
              className="py-2 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer min-w-[170px]"
            >
              <option value="">All Categories</option>
              {categories.slice(1).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={paperFilters.year}
              onChange={(e) =>
                setPaperFilters((p) => ({ ...p, year: e.target.value }))
              }
              className="py-2 px-3 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer min-w-[120px]"
            >
              {years.slice(0, 6).map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
            {(paperFilters.q || paperFilters.category || paperFilters.year) && (
              <button
                onClick={() =>
                  setPaperFilters({ q: "", category: "", year: "" })
                }
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>

          {papersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border p-5 space-y-3"
                >
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : homePapers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {paperFilters.q || paperFilters.category || paperFilters.year
                ? "No papers match your filters."
                : "No publications yet."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homePapers.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 flex flex-col gap-3"
                >
                  <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-3">
                    {p.title}
                  </h3>
                  {p.author_names && p.author_names.length > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {Array.isArray(p.author_names)
                        ? p.author_names.join(", ")
                        : p.author_names}
                    </p>
                  )}
                  {p.journal_title && (
                    <p className="text-xs text-primary font-medium truncate">
                      {p.journal_title}
                    </p>
                  )}
                  {p.keywords && p.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(p.keywords) ? p.keywords : [])
                        .slice(0, 3)
                        .map((k: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {k}
                          </Badge>
                        ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    {p.published_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <Link to={getPaperUrl(p)}>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                      >
                        Read Article <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="text-gradient-accent">GIKI Journal</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by researchers, for researchers. Experience the future of
              academic publishing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-6 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined process from submission to publication.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Submit",
                desc: "Upload your paper with metadata and keywords",
              },
              {
                step: 2,
                title: "Review",
                desc: "Expert reviewers evaluate your work anonymously",
              },
              {
                step: 3,
                title: "Revise",
                desc: "Address feedback through our version control system",
              },
              {
                step: 4,
                title: "Publish",
                desc: "Accepted papers are published to our public archive",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative flex items-center gap-8 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary">
                  {item.step}
                </div>
                <div className="flex-1 glass-card p-6">
                  <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="absolute left-8 top-16 h-8 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by{" "}
              <span className="text-gradient-accent">Researchers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of academics who trust GIKI Journal for their
              publishing needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 w-4 text-accent">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== UPCOMING CONFERENCES SECTION ===== */}
      {conferences.length > 0 && (
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="mb-10">
              <h2 className="font-serif-outfit text-3xl md:text-4xl font-bold text-foreground">
                Upcoming Conferences
              </h2>
              <p className="text-muted-foreground mt-1">
                Academic events and calls for papers
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {conferences.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 flex flex-col gap-3"
                >
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {new Date(c.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {c.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {c.location}
                    </div>
                  )}
                  {c.link && (
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Learn More
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:bg-gradient-dark" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-15 dark:opacity-30" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Publish Your Research?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join our community of researchers and take the first step towards
              publication.
            </p>
            <Link to="/login?action=submit">
              <Button
                size="lg"
                className="btn-physics bg-gradient-accent text-accent-foreground hover:opacity-90 text-lg px-10 py-6 glow-accent"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
