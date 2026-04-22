import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Download,
  Calendar,
  FileText,
  Users,
  ScrollText,
  ExternalLink,
  Send,
  UserCheck,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { cn, getFileUrl, getPaperUrl } from "@/lib/utils";
import { url } from "@/url";
import Navbar from "./navbar";
import DOMPurify from "dompurify";
import { PageTransition } from "@/components/AnimationWrappers";

// ---- Types ----

interface JournalData {
  id: string;
  title: string;
  acronym: string;
  issn?: string;
  doi?: string;
  publisher_name?: string;
  type?: string;
  peer_review_policy?: string;
  oa_policy?: string;
  author_guidelines?: string;
  aims_and_scope?: string;
  logo_url?: string;
  status?: string;
  publication_fee?: number | null;
  currency?: string;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  pdf_url: string;
}

interface IssueGroup {
  issue_id: string;
  label: string;
  published_at: string;
  papers: Paper[];
}

interface BoardMember {
  id: string;
  name: string;
  profile_pic_url?: string;
  degrees?: string[];
  keywords?: string[];
  role: string;
}

// ---- Helpers ----

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(
      (w) =>
        !["of", "the", "and", "for", "in", "a", "an"].includes(w.toLowerCase()),
    )
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function JournalLogo({
  logoUrl,
  title,
  size = "md",
}: {
  logoUrl?: string;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const sizes = {
    sm: "h-[69px] w-[52px] text-xs",
    md: "h-[111px] w-[83px] text-base",
    lg: "h-[240px] w-[180px] text-3xl",
  };
  const initials = getInitials(title);

  const placeholderColors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-pink-500",
  ];
  const placeholderBg =
    placeholderColors[(title.charCodeAt(0) ?? 0) % placeholderColors.length];

  const imgSrc = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : getFileUrl(logoUrl)
    : null;

  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt={title}
        className={cn("object-cover rounded-xl", sizes[size])}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center font-bold text-white",
        placeholderBg,
        sizes[size],
      )}
    >
      {initials}
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-2xl uppercase shrink-0">
      {letters}
    </div>
  );
}

// ---- Tabs ----

const TABS = [
  { key: "home", label: "Journal Home" },
  { key: "editorial", label: "Editorial Board" },
  { key: "oa-policy", label: "OA Policy" },
  { key: "peer-review", label: "Peer Review Policy" },
  { key: "guidelines", label: "Author Guidelines" },
  { key: "apc-fees", label: "APC / Fees" },
  { key: "articles", label: "Articles" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function IssueAccordion({ issue }: { issue: IssueGroup }) {
  const [open, setOpen] = useState(true); // first open by default, or false

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-muted/30 hover:bg-muted/60 transition-colors text-left"
      >
        <Calendar className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-foreground flex-1">
          {issue.label}
        </span>
        <span className="text-xs text-muted-foreground mr-3">
          {formatDate(issue.published_at)}
        </span>
        <Badge variant="outline" className="text-xs mr-2">
          {issue.papers.length} article{issue.papers.length !== 1 ? "s" : ""}
        </Badge>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/30">
              {issue.papers.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground italic">
                  No articles in this issue yet.
                </p>
              ) : (
                issue.papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="px-5 py-4 flex items-start gap-4 group hover:bg-muted/20 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={getPaperUrl(paper)}
                        className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {paper.title}
                      </Link>
                      {paper.abstract && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {paper.abstract}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary h-8 px-2"
                      >
                        <a
                          href={`${url}${paper.pdf_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3 w-3 mr-1" /> PDF
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary h-8 px-2"
                      >
                        <Link to={getPaperUrl(paper)}>
                          <ExternalLink className="h-3 w-3 mr-1" /> View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Main Component ----

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "home";

  const [journal, setJournal] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<IssueGroup[]>([]);
  const [issuesLoaded, setIssuesLoaded] = useState(false);
  const [board, setBoard] = useState<{
    chief_editors: BoardMember[];
    associate_editors: BoardMember[];
  } | null>(null);
  const [boardLoaded, setBoardLoaded] = useState(false);

  const setTab = (key: TabKey) => setSearchParams({ tab: key });

  // Fetch journal details
  useEffect(() => {
    if (!id) return;
    const fetchJournal = async () => {
      try {
        const r = await fetch(`${url}/journal/getJournal/${id}`);
        const data = await r.json();
        if (data.success && data.journal) setJournal(data.journal);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [id]);

  // Lazy-load articles
  useEffect(() => {
    if (activeTab !== "articles" || issuesLoaded || !id) return;
    const fetchIssues = async () => {
      try {
        const r = await fetch(`${url}/browse/getBrowseData?journalId=${id}`);
        const data = await r.json();
        if (data.success && data.data.length > 0) {
          // New shape: data.data[0].issues is the array of issues
          const journalData = data.data[0];
          setIssues(journalData.issues || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIssuesLoaded(true);
      }
    };
    fetchIssues();
  }, [activeTab, id, issuesLoaded]);

  // Lazy-load editorial board
  useEffect(() => {
    if (activeTab !== "editorial" || boardLoaded || !id) return;
    const fetchBoard = async () => {
      try {
        const r = await fetch(`${url}/journal/${id}/editorial-board`);
        const data = await r.json();
        if (data.success)
          setBoard({
            chief_editors: data.chief_editors || [],
            associate_editors: data.associate_editors || [],
          });
      } catch (e) {
        console.error(e);
      } finally {
        setBoardLoaded(true);
      }
    };
    fetchBoard();
  }, [activeTab, id, boardLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground text-lg">Journal not found.</p>
          <Button asChild variant="outline">
            <Link to="/browse">Browse Journals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background">
      <Navbar />

      {/* Journal Header */}
      <div className="border-b border-border/50 pt-20 pb-0 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="py-8 flex flex-col md:flex-row md:items-center gap-6">
            <JournalLogo
              logoUrl={journal.logo_url}
              title={journal.title}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-primary font-medium uppercase tracking-wide">
                  Journal
                </span>
                {journal.type && (
                  <Badge variant="secondary" className="text-xs">
                    {journal.type === "open_access"
                      ? "Open Access"
                      : "Subscription"}
                  </Badge>
                )}
                {journal.status && (
                  <Badge
                    variant={
                      journal.status === "active" ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {journal.status}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {journal.title}
              </h1>
              {journal.publisher_name && (
                <p className="text-base text-muted-foreground mb-2">
                  {journal.publisher_name}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {journal.issn && (
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">
                    ISSN: {journal.issn}
                  </span>
                )}
                {journal.doi && <span>DOI: {journal.doi}</span>}
                {journal.acronym && (
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">
                    {journal.acronym}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-2">
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to={`/signup`}>
                  <Send className="h-4 w-4 mr-2" /> Submit an Article
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={`/apply-reviewer?journalId=${journal.id}&journal=${journal.acronym || ""}&role=reviewer`}
                >
                  <UserCheck className="h-4 w-4 mr-2" /> Apply as Reviewer
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={`/apply-reviewer?journalId=${journal.id}&journal=${journal.acronym || ""}&role=associate_editor`}
                >
                  <UserCheck className="h-4 w-4 mr-2" /> Apply as Associate
                  Editor
                </Link>
              </Button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Journal Home */}
          {activeTab === "home" && (
            <div className="max-w-3xl space-y-8">
              {journal.aims_and_scope ? (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Aims &amp; Scope
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {journal.aims_and_scope}
                  </p>
                </section>
              ) : (
                <p className="text-muted-foreground italic">
                  No aims and scope published yet.
                </p>
              )}
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {journal.issn && (
                  <div className="glass-card p-4">
                    <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">
                      ISSN
                    </p>
                    <p className="font-mono font-medium">{journal.issn}</p>
                  </div>
                )}
                {journal.type && (
                  <div className="glass-card p-4">
                    <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">
                      Access Type
                    </p>
                    <p className="font-medium">
                      {journal.type === "open_access"
                        ? "Open Access"
                        : "Subscription"}
                    </p>
                  </div>
                )}
                {journal.publisher_name && (
                  <div className="glass-card p-4">
                    <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">
                      Publisher
                    </p>
                    <p className="font-medium">{journal.publisher_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editorial Board */}
          {activeTab === "editorial" && (
            <div className="space-y-10">
              {!boardLoaded ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading editorial board…
                </div>
              ) : (
                <>
                  {/* Editor in Chief */}
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-6">
                      Editor-in-Chief ({board?.chief_editors.length ?? 0})
                    </h2>
                    {board?.chief_editors.length === 0 ? (
                      <p className="text-muted-foreground italic">
                        No chief editor assigned yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {board?.chief_editors.map((member) => (
                          <div
                            key={member.id}
                            className="p-5 flex items-start gap-4 transition-all bg-background/50 border-none shadow-none"
                          >
                            {/* Profile Pic on Left side */}
                            <div className="shrink-0">
                              {member.profile_pic_url ? (
                                <img
                                  alt={member.name}
                                  src={`${member.profile_pic_url}`}
                                  className="w-20 h-20 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <Initials name={member.name} />
                              )}
                            </div>

                            {/* Details on Right side */}
                            <div className="flex-1 min-w-0 text-left">
                              <h3 className="font-bold text-foreground text-base truncate">
                                {member.name}
                              </h3>

                              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                                Editor-in-Chief
                              </p>

                              {member.degrees?.length ? (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                  {member.degrees.join(", ")}
                                </p>
                              ) : null}

                              {member.keywords?.length ? (
                                <div className="mt-2">
                                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
                                    Areas of Interest
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {member.keywords
                                      .slice(0, 3)
                                      .map((kw, i) => (
                                        <Badge
                                          key={i}
                                          variant="secondary"
                                          className="text-[9px] px-1.5 py-0 h-4"
                                        >
                                          {kw}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <Separator />

                  {/* Associate Editors */}
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-6">
                      Associate Editors ({board?.associate_editors.length ?? 0})
                    </h2>
                    {board?.associate_editors.length === 0 ? (
                      <p className="text-muted-foreground italic">
                        No associate editors assigned yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {board?.associate_editors.map((member) => (
                          <div
                            key={member.id}
                            className="p-5 flex items-start gap-4 transition-all bg-background/50 border-none shadow-none"
                          >
                            {/* Profile Pic on Left side */}
                            <div className="shrink-0">
                              {member.profile_pic_url ? (
                                <img
                                  alt={member.name}
                                  src={`${member.profile_pic_url}`}
                                  className="w-20 h-20 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <Initials name={member.name} />
                              )}
                            </div>

                            {/* Details on Right side */}
                            <div className="flex-1 min-w-0 text-left">
                              <h3 className="font-bold text-foreground text-base truncate">
                                {member.name}
                              </h3>

                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Associate Editor
                              </p>

                              {member.degrees?.length ? (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                  {member.degrees.join(", ")}
                                </p>
                              ) : null}

                              {member.keywords?.length ? (
                                <div className="mt-2">
                                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
                                    Areas of Interest
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {member.keywords
                                      .slice(0, 3)
                                      .map((kw, i) => (
                                        <Badge
                                          key={i}
                                          variant="secondary"
                                          className="text-[9px] px-1.5 py-0 h-4"
                                        >
                                          {kw}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {/* OA Policy */}
          {activeTab === "oa-policy" && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <ScrollText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Open Access Policy
                </h2>
              </div>
              {journal.oa_policy ? (
                journal.oa_policy.trim().startsWith("<") ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(journal.oa_policy),
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {journal.oa_policy}
                  </p>
                )
              ) : (
                <p className="text-muted-foreground italic">
                  No OA policy published yet.
                </p>
              )}
            </div>
          )}

          {/* Peer Review Policy */}
          {activeTab === "peer-review" && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Peer Review Policy
                </h2>
              </div>
              {journal.peer_review_policy ? (
                journal.peer_review_policy.trim().startsWith("<") ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(journal.peer_review_policy),
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {journal.peer_review_policy}
                  </p>
                )
              ) : (
                <p className="text-muted-foreground italic">
                  No peer review policy published yet.
                </p>
              )}
            </div>
          )}

          {/* Author Guidelines */}
          {activeTab === "guidelines" && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Author Guidelines
                  </h2>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Link to={`/author/submit?journal=${journal.id}`}>
                    <Send className="h-3 w-3 mr-2" /> Submit to{" "}
                    {journal.acronym || journal.title}
                  </Link>
                </Button>
              </div>
              {journal.author_guidelines ? (
                journal.author_guidelines.trim().startsWith("<") ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(journal.author_guidelines),
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {journal.author_guidelines}
                  </p>
                )
              ) : (
                <p className="text-muted-foreground italic">
                  No author guidelines published yet.
                </p>
              )}
            </div>
          )}

          {/* APC / Fees */}
          {activeTab === "apc-fees" && (
            <div className="max-w-3xl space-y-8">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Article Processing Charges (APC)
                </h2>
              </div>

              {!journal.publication_fee ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    This journal charges no article processing fee.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">
                      {journal.title}
                    </span>{" "}
                    is a fully open access journal with no charges to authors or
                    readers.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">
                      {journal.title}
                    </span>{" "}
                    charges a publication fee to cover the costs of open access
                    publishing.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Publication Fee
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {journal.publication_fee}{" "}
                        <span className="text-base font-normal text-muted-foreground">
                          {journal.currency}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        per page
                      </p>
                    </div>
                    <div className="glass-card p-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Estimated Cost
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {journal.publication_fee * 10}{" "}
                        <span className="text-base font-normal text-muted-foreground">
                          {journal.currency}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        based on avg. 10-page manuscript
                      </p>
                    </div>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">
                      Payment Policy
                    </h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      {[
                        "Payment is only required after your paper has been accepted for publication.",
                        "Authors will receive a formal invoice by email upon acceptance.",
                        "Payment must be completed within 7 days of invoice date.",
                        "Accepted payment methods: Bank transfer (receipt upload required).",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      Fee Waivers
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Authors from low-income countries or with demonstrated
                      financial hardship may apply for a full or partial fee
                      waiver. Contact the editorial office for more information.
                    </p>
                  </section>

                  <p className="text-sm text-muted-foreground border-t border-border/50 pt-6">
                    For queries regarding APC, contact:{" "}
                    <a
                      href="mailto:support@giki.com"
                      className="text-primary hover:underline"
                    >
                      support@giki.com
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Articles */}
          {activeTab === "articles" && (
            <div>
              {!issuesLoaded ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading articles…
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground">
                    No published articles yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue, idx) => (
                    <IssueAccordion key={issue.issue_id ?? idx} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
