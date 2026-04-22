import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { url } from "@/url";
import DOMPurify from "dompurify";

interface ApprovalData {
  token_valid: boolean;
  status: string;
  paper: {
    id: string;
    title: string;
    abstract: string;
    journal_name: string;
    submitted_by: string;
    submitted_at: string | null;
    current_version_id: string | null;
    authors: Array<{ name: string; affiliation?: string }>;
    author_details: Array<{ name: string; affiliation?: string }>;
  };
  corr_author: { name: string; email: string };
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PaperApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalAction, setFinalAction] = useState<"approve" | "reject" | null>(null);
  const [paperHtml, setPaperHtml] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await fetch(`${url}/paper-approval/${token}`);
        if (!r.ok) { setNotFound(true); return; }
        const json = await r.json();
        if (!json.success) { setNotFound(true); return; }
        setData(json);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!data?.paper?.id || !data?.paper?.current_version_id) return;
    setHtmlLoading(true);
    fetch(`${url}/papers/${data.paper.id}/version/${data.paper.current_version_id}/html`)
      .then((r) => r.json())
      .then((d) => {
        if (d.html) setPaperHtml(d.html);
      })
      .catch(() => {})
      .finally(() => setHtmlLoading(false));
  }, [data?.paper?.id, data?.paper?.current_version_id]);

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectReason.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${url}/paper-approval/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason }),
      });
      const json = await r.json();
      if (json.success) {
        setSubmitted(true);
        setFinalAction(action);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center py-20 max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-gray-500">This approval link has expired or already been used.</p>
        </div>
      </div>
    );
  }

  if (!data.token_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center py-20 max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Responded</h1>
          <p className="text-gray-500">You have already {data.status} this paper submission.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center py-20 max-w-md">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600">
            {finalAction === "approve"
              ? "The paper has been approved and submitted for editorial review."
              : "The paper has been rejected. The submitting author has been notified."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Corresponding Author Approval</h1>
          <p className="text-gray-500 mt-2">
            Please review the paper details below and approve or reject this submission.
          </p>
        </div>

        {/* Paper details */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{data.paper.title}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {data.paper.journal_name} · Submitted by {data.paper.submitted_by}
          </p>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Abstract</p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.paper.abstract || "No abstract provided."}</p>
          </div>
          {data.paper.authors?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Authors</p>
              <p className="text-sm text-gray-700">{data.paper.authors.map((a) => a.name).join(", ")}</p>
            </div>
          )}
        </div>

        {/* Full Article Web View */}
        {paperHtml && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-gray-900">Full Manuscript</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Web View
              </span>
            </div>
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <div className="max-w-[750px] mx-auto px-10 py-10">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center leading-tight">
                  {data.paper.title}
                </h1>
                {data.paper.author_details?.length > 0 && (
                  <p className="text-center text-sm text-gray-600 mb-1">
                    {data.paper.author_details.map((a) => a.name).join(", ")}
                  </p>
                )}
                <p className="text-center text-xs text-gray-400 mb-6">
                  {data.paper.journal_name}
                  {data.paper.submitted_at ? ` · Submitted ${formatDate(data.paper.submitted_at)}` : ""}
                </p>
                <hr className="mb-6" />
                <div
                  className="paper-webview-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(paperHtml) }}
                />
              </div>
            </div>
          </div>
        )}

        {htmlLoading && (
          <div className="mt-6 border border-gray-200 rounded-xl p-10 text-center bg-white shadow-sm">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading full manuscript...</p>
          </div>
        )}

        {/* Action section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <p className="font-semibold text-gray-900 mb-4">
            As corresponding author, do you approve this submission?
          </p>

          {selectedAction === "reject" && (
            <textarea
              placeholder="Please provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-400"
              required
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleAction("approve")}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              ✓ Approve Submission
            </button>
            <button
              onClick={() => setSelectedAction("reject")}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              ✗ Reject Submission
            </button>
          </div>

          {selectedAction === "reject" && (
            <button
              onClick={() => handleAction("reject")}
              disabled={submitting || !rejectReason.trim()}
              className="w-full mt-3 bg-red-700 hover:bg-red-800 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Rejection"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
