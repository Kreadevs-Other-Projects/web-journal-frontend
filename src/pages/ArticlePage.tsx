import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Share2,
  Calendar,
  BookOpen,
  Tag,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { url } from "@/url";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AuthorDetail {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

interface ArticleData {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author_names: string[];
  author_details?: AuthorDetail[];
  corresponding_authors?: string[];
  corresponding_author_details?: AuthorDetail[];
  paper_references?: { text: string; link?: string }[];
  submitted_at: string;
  published_at?: string;
  publication_date?: string;
  author_username: string;
  journal_id: string;
  journal_title: string;
  issn?: string;
  volume?: number;
  issue?: number;
  year?: number;
  issue_label?: string;
  doi?: string;
  file_url?: string;
  html_content?: string;
  html_url?: string;
  pdf_url?: string;
  xml_url?: string;
  status: string;
  // Additional information fields
  article_type?: string;
  conflict_of_interest?: string;
  funding_info?: string;
  data_availability?: string;
  ethical_approval?: string;
  author_contributions?: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArticlePage() {
  const { paperId, acronym, slug } = useParams<{
    paperId?: string;
    acronym?: string;
    slug?: string;
  }>();
  const { toast } = useToast();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [showArticleInfo, setShowArticleInfo] = useState(false);
  const [resolvedPaperId, setResolvedPaperId] = useState<string | null>(null);
  const [latestJournals, setLatestJournals] = useState<
    {
      id: string;
      title: string;
      issn?: string;
      logo_url?: string;
      article_count: number;
      type?: string;
    }[]
  >([]);

  useEffect(() => {
    fetch(`${url}/browse/home/journals?limit=6`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLatestJournals(data.journals || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const apiUrl =
          acronym && slug
            ? `${url}/browse/article/${acronym}/${slug}`
            : `${url}/browse/paper/${paperId}`;
        const r = await fetch(apiUrl);
        const data = await r.json();
        if (data.success) {
          setArticle(data.paper);
          setResolvedPaperId(data.paper?.id ?? paperId ?? null);
          if (data.paper?.html_content) {
            setHtmlContent(data.paper.html_content);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [paperId, acronym, slug]);

  // Option B: fetch HTML on-demand for papers without cached html_content
  useEffect(() => {
    if (!article || htmlContent !== null || !resolvedPaperId) return;
    const ext = article.file_url?.toLowerCase();
    if (
      !ext ||
      (!ext.endsWith(".docx") &&
        !ext.endsWith(".pdf") &&
        !ext.endsWith(".tex") &&
        !ext.endsWith(".latex"))
    )
      return;
    setHtmlLoading(true);
    const fetchHtml = async () => {
      try {
        const r = await fetch(`${url}/browse/paper/${resolvedPaperId}/html`);
        const data = await r.json();
        if (data.success && data.html) setHtmlContent(data.html);
      } catch (_) {
      } finally {
        setHtmlLoading(false);
      }
    };
    fetchHtml();
  }, [article, resolvedPaperId, htmlContent]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article URL copied to clipboard.",
    });
  };

  // SEO meta tag for authors — must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!article?.author_details?.length) return;
    const authorNames = article.author_details.map((a) => a.name).join(", ");
    let meta = document.querySelector(
      'meta[name="author"]',
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "author";
      document.head.appendChild(meta);
    }
    meta.content = authorNames;
    return () => {
      meta?.remove();
    };
  }, [article]);

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

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground text-lg">Article not found.</p>
          <Button asChild variant="outline">
            <Link to="/browse">Browse Journals</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Build author display string with affiliations if structured data available
  const authorsDisplay = (() => {
    if (article.author_details && article.author_details.length > 0) {
      return article.author_details
        .map((a) => (a.affiliation ? `${a.name} (${a.affiliation})` : a.name))
        .join(", ");
    }
    if (article.author_names?.length) return article.author_names.join(", ");
    return article.author_username || "Unknown";
  })();

  const volumeIssue =
    article.issue_label ||
    (article.volume && article.issue
      ? `Vol. ${article.volume}, No. ${article.issue} (${article.year})`
      : null);

  const publishedDate = article.publication_date || article.published_at;

  // Collect non-empty additional info fields
  const additionalInfoFields: { label: string; value: string }[] = [
    article.article_type
      ? { label: "Article Type", value: article.article_type }
      : null,
    article.conflict_of_interest
      ? { label: "Conflict of Interest", value: article.conflict_of_interest }
      : null,
    article.funding_info
      ? { label: "Funding Information", value: article.funding_info }
      : null,
    article.data_availability
      ? { label: "Data Availability", value: article.data_availability }
      : null,
    article.ethical_approval
      ? { label: "Ethical Approval", value: article.ethical_approval }
      : null,
    article.author_contributions
      ? { label: "Author Contributions", value: article.author_contributions }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* HEADER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/journal/${article.journal_id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {article.journal_title}
                </Link>
                {volumeIssue && (
                  <span className="text-sm text-muted-foreground">
                    · {volumeIssue}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {article.article_type || "Research Article"}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {article.title}
              </h1>

              {/* Structured authors with affiliation superscripts */}
              {article.author_details?.length > 0 ? (
                <>
                  {/* Authors */}
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    {article.author_details.map((author, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">
                          {author.name}
                        </span>

                        {author.affiliation && (
                          <span className="text-xs text-muted-foreground">
                            [{i + 1}]
                          </span>
                        )}

                        {i !== article.author_details.length - 1 && (
                          <span className="text-muted-foreground">•</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Affiliations */}
                  <div className="mt-2 space-y-1">
                    {article.author_details.map((author, i) =>
                      author.affiliation ? (
                        <div
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="font-medium text-primary">
                            [{i + 1}]
                          </span>
                          <span>{author.affiliation}</span>
                        </div>
                      ) : null,
                    )}
                  </div>

                  {/* Corresponding Author */}
                  {article.corresponding_author_details?.[0] && (
                    <div className="mt-3 text-xs bg-muted/50 px-3 py-2 rounded-lg border">
                      <span className="font-medium text-foreground">
                        Corresponding Author:
                      </span>{" "}
                      {article.corresponding_author_details[0].name}
                      {article.corresponding_author_details[0].email && (
                        <a
                          href={`mailto:${article.corresponding_author_details[0].email}`}
                          className="ml-2 text-primary hover:underline"
                        >
                          {article.corresponding_author_details[0].email}
                        </a>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {authorsDisplay}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {publishedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Published {formatDate(publishedDate)}
                  </span>
                )}
                {article.journal_title && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {article.journal_title}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* METADATA BAR */}
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3">
                {article.doi && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">DOI:</span>
                    <a
                      href={`https://doi.org/${article.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      https://doi.org/{article.doi}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    CC BY 4.0
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Open Access
                  </span>
                </div>

                {article.keywords?.length ? (
                  <div className="flex items-start gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    {article.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* File download: label depends on file type */}
                  {(article.pdf_url || article.file_url) && (
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(
                          getFileUrl(article.pdf_url || article.file_url),
                          "_blank",
                        )
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {(() => {
                        const _ext = (article.pdf_url || article.file_url)
                          ?.split(".")
                          .pop()
                          ?.toLowerCase();
                        if (_ext === "docx") return "Download Word Document";
                        if (_ext === "tex" || _ext === "latex")
                          return "Download LaTeX Source";
                        return "Download PDF";
                      })()}
                    </Button>
                  )}
                  {/* HTML format */}
                  {article.html_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(`${url}${article.html_url}`, "_blank")
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download HTML
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="gap-2 opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      HTML
                    </Button>
                  )}
                  {/* XML format */}
                  {article.xml_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(`${url}${article.xml_url}`, "_blank")
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download XML
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="gap-2 opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      XML
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ABSTRACT */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                Abstract
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {article.abstract || "No abstract available."}
              </p>
            </section>

            {/* FULL TEXT */}
            <Separator />
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Full Text
              </h2>
              {htmlLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading full text…
                </div>
              ) : htmlContent ? (
                <div className="space-y-4">
                  <div
                    className="paper-content"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(htmlContent),
                    }}
                  />
                  {article.file_url && (
                    <p className="text-sm text-muted-foreground pt-2 border-t border-border/40">
                      <a
                        href={getFileUrl(article.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download original manuscript
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-6 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Full text is not available for web viewing
                    {article.file_url?.endsWith(".tex")
                      ? " (.tex files cannot be rendered inline)"
                      : ""}
                    .
                  </p>
                  {article.file_url && (
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(getFileUrl(article.file_url), "_blank")
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Manuscript
                    </Button>
                  )}
                </div>
              )}
            </section>

            {/* REFERENCES */}
            {article.paper_references &&
              Array.isArray(article.paper_references) &&
              article.paper_references.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      References
                    </h2>
                    <ol className="space-y-2">
                      {article.paper_references.map((ref, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-muted-foreground"
                        >
                          <span className="shrink-0 font-medium text-foreground">
                            [{i + 1}]
                          </span>
                          <span>
                            {ref.text}
                            {ref.link && (
                              <>
                                {" "}
                                <a
                                  href={ref.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  [link]
                                </a>
                              </>
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              )}

            {/* ARTICLE INFORMATION (collapsible) */}
            {additionalInfoFields.length > 0 && (
              <>
                <Separator />
                <section>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-2 text-xl font-semibold text-foreground hover:text-primary transition-colors"
                    onClick={() => setShowArticleInfo((v) => !v)}
                  >
                    <span>Article Information</span>
                    {showArticleInfo ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {showArticleInfo && (
                    <div className="mt-4 space-y-4">
                      {additionalInfoFields.map((field) => (
                        <div key={field.label}>
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {field.label}
                          </h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* BOTTOM DOWNLOAD */}
            {(article.pdf_url || article.file_url) && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() =>
                    window.open(
                      getFileUrl(article.pdf_url || article.file_url),
                      "_blank",
                    )
                  }
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download Full Manuscript
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* LATEST JOURNALS */}
      {latestJournals.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Latest Journals
              </h2>
              <Link
                to="/browse"
                onClick={() => window.scrollTo(0, 0)}
                className="text-sm text-primary hover:underline font-medium"
              >
                View all →
              </Link>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {latestJournals.map((j) => (
                <Link
                  key={j.id}
                  to={`/journal/${j.id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group"
                >
                  <div className="relative rounded-lg overflow-hidden border border-border bg-background hover:shadow-md transition">
                    {j.logo_url ? (
                      <img
                        src={getFileUrl(j.logo_url)}
                        alt={j.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}

                    {/* TITLE */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-[11px] text-white line-clamp-2">
                        {j.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {j.issn}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
