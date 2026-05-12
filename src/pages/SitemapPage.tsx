import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Home,
  Info,
  Archive,
  ChevronRight,
} from "lucide-react";
import { url } from "../url";

export default function SitemapPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Sitemap — Paperuno";

    Promise.all([
      fetch(`${url}/journal/public`).then((r) => r.json()),
      fetch(`${url}/browse/home/publications`).then((r) => r.json()),
    ])
      .then(([journalsData, articlesData]) => {
        setJournals(journalsData.journals || journalsData || []);
        setRecentArticles(articlesData.publications || articlesData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background mt-12">
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Sitemap</h1>
          <p className="text-muted-foreground">
            Complete directory of all pages and published articles on Paperuno.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Main Pages */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Main Pages</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Home", path: "/" },
              { label: "Browse Journals", path: "/browse" },
              { label: "Archive", path: "/archive" },
              { label: "About", path: "/about" },
              { label: "FAQ", path: "/faq" },
              { label: "Contact Us", path: "/contact-us" },
              { label: "Sign In", path: "/login" },
              { label: "Create Account", path: "/signup" },
            ].map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors text-sm"
              >
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                {page.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Journals */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Journals</h2>
            {!loading && (
              <span className="text-sm text-muted-foreground">
                ({journals.length} journals)
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-muted/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : journals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {journals.map((journal) => (
                <div
                  key={journal.id}
                  className="border rounded-lg p-3 hover:border-primary/30 transition-colors"
                >
                  <Link
                    to={`/journal/${journal.acronym?.toLowerCase()}`}
                    className="flex items-start gap-3"
                  >
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                        {journal.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {journal.acronym?.toUpperCase()} ·{" "}
                        {journal.type || "Open Access"}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-3 mt-2 ml-7">
                    {[
                      { label: "Articles", tab: "articles" },
                      { label: "Editorial Board", tab: "editorial" },
                      { label: "Policies", tab: "oa-policy" },
                    ].map((link) => (
                      <Link
                        key={link.tab}
                        to={`/journal/${journal.acronym?.toLowerCase()}?tab=${link.tab}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No journals available yet.
            </p>
          )}
        </section>

        {/* Recent Articles */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Recent Articles</h2>
            {!loading && recentArticles.length > 0 && (
              <span className="text-sm text-muted-foreground">
                (showing latest {recentArticles.length})
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-muted/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : recentArticles.length > 0 ? (
            <div className="space-y-2">
              {recentArticles.map((article: any) => (
                <Link
                  key={article.id}
                  to={`/${article.journal_acronym?.toLowerCase()}/${article.url_slug}`}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.journal_name} ·{" "}
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : ""}
                    </p>
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  to="/archive"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Archive className="h-4 w-4" />
                  View all articles in archive →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No articles published yet.
            </p>
          )}
        </section>

        {/* XML Sitemaps */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">XML Sitemaps</h2>
            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
              For search engines
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: "Sitemap Index",
                url: "/sitemap.xml",
                desc: "Master sitemap index",
              },
              {
                label: "Pages Sitemap",
                url: "/sitemap-pages.xml",
                desc: "All static pages",
              },
              {
                label: "Journals Sitemap",
                url: "/sitemap-journals.xml",
                desc: "All active journals",
              },
              {
                label: "Articles Sitemap",
                url: "/sitemap-articles-1.xml",
                desc: "Published articles",
              },
              {
                label: "Robots.txt",
                url: "/robots.txt",
                desc: "Crawler instructions",
              },
            ].map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors"
              >
                <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.url}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t bg-muted/20 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Paperuno is a scholarly publishing platform. Publications are issued
            under Indus Academic Press.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            XML sitemaps are automatically refreshed when new content is
            published.
          </p>
        </div>
      </div>
    </div>
  );
}
