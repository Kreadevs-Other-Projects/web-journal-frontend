import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { url } from "@/url";

interface Props {
  paperId: string | null;
  token: string;
  open: boolean;
  onClose: () => void;
  onProceed?: (paperId: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  authors: "Author(s)",
  abstract: "Abstract",
  keywords: "Keywords",
  references: "References",
  journal_title: "Journal",
  volume: "Volume",
  issue: "Issue",
  doi: "DOI",
  publication_date: "Publication Date",
};

export default function MetadataValidationModal({ paperId, token, open, onClose, onProceed }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; missing_fields: string[]; paper: Record<string, unknown> } | null>(null);

  useEffect(() => {
    if (!open || !paperId) return;
    setLoading(true);
    setResult(null);
    fetch(`${url}/papers/${paperId}/metadata-check`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setResult(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, paperId, token]);

  const allFields = Object.keys(FIELD_LABELS);
  const total = allFields.length;
  const complete = result ? total - result.missing_fields.length : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Metadata Validation</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking metadata…
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{complete} of {total} required fields complete</span>
              {result.valid
                ? <Badge className="bg-green-600 text-white">All Valid</Badge>
                : <Badge variant="destructive">{result.missing_fields.length} Missing</Badge>}
            </div>

            <ul className="space-y-2">
              {allFields.map((field) => {
                const isMissing = result.missing_fields.includes(field);
                return (
                  <li key={field} className="flex items-center justify-between text-sm">
                    <span className={isMissing ? "text-destructive" : "text-foreground"}>
                      {FIELD_LABELS[field]}
                    </span>
                    {isMissing
                      ? <XCircle className="h-4 w-4 text-destructive" />
                      : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </li>
                );
              })}
            </ul>

            {!result.valid && (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
                Missing fields must be filled before publication. Assign the paper to an issue and ensure DOI is set via the Publish Paper flow.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Failed to load metadata.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {result?.valid && onProceed && paperId && (
            <Button onClick={() => { onProceed(paperId); onClose(); }}>
              Proceed to Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
