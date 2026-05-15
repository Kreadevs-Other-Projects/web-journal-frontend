import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Lock, MessageSquare } from 'lucide-react';

interface ReviewCommentDisplayProps {
  comments: string | null | undefined;
  confidentialComments?: string | null | undefined;
  showConfidential?: boolean;
  className?: string;
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

function CommentContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'h2', 'h3', 'h4', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'span', 'div',
      'sup', 'sub', 'hr',
    ],
    ALLOWED_ATTR: ['class', 'style'],
  });

  if (isHtml(html)) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none
          [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5
          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
          [&_p]:mb-2 [&_p]:leading-relaxed [&_p:last-child]:mb-0
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:space-y-0.5
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:space-y-0.5
          [&_li]:text-sm
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40
          [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
          [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto
          [&_strong]:font-semibold [&_em]:italic [&_u]:underline
          [&_hr]:border-border [&_hr]:my-3"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{html}</p>
  );
}

export function ReviewCommentDisplay({
  comments,
  confidentialComments,
  showConfidential = false,
  className,
}: ReviewCommentDisplayProps) {
  const hasComments = comments && comments.trim();
  const hasConfidential = confidentialComments && confidentialComments.trim();

  if (!hasComments && !hasConfidential) {
    return (
      <p className="text-sm text-muted-foreground italic">No comments provided.</p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {hasComments && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Comments for Authors
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <CommentContent html={comments} />
          </div>
        </div>
      )}

      {showConfidential && hasConfidential && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="h-3.5 w-3.5 text-purple-500" />
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Confidential — Editors Only
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <CommentContent html={confidentialComments} />
          </div>
        </div>
      )}
    </div>
  );
}
