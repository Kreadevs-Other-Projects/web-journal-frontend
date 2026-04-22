import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { url } from "@/url";

export default function ArticleRedirect() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!paperId) return;
    fetch(`${url}/browse/paper/${paperId}/slug`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.acronym && data.url_slug) {
          navigate(`/${data.acronym.toLowerCase()}/${data.url_slug}`, {
            replace: true,
          });
        } else {
          // Paper not published yet or no slug — render article directly via old endpoint
          navigate(`/articles-view/${paperId}`, { replace: true });
        }
      })
      .catch(() => {
        // On error, keep on this URL; ArticlePage will handle the 404
      });
  }, [paperId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
