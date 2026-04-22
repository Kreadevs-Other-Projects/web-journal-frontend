import { useEffect, useRef } from "react";
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep focus in editor
        onClick();
      }}
      className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value into DOM only when it differs (avoids cursor jumps)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    reportChange();
  };

  const reportChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const href = prompt("Enter URL:");
    if (href) exec("createLink", href);
  };

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-muted/30">
        <ToolbarButton onClick={() => exec("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border self-center mx-0.5" />
        <ToolbarButton onClick={() => exec("formatBlock", "h1")} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "h2")} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "h3")} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border self-center mx-0.5" />
        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border self-center mx-0.5" />
        <ToolbarButton onClick={insertLink} title="Insert link">
          <Link className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={reportChange}
        onBlur={reportChange}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[120px] p-3 text-sm focus:outline-none prose prose-sm max-w-none dark:prose-invert",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
        )}
      />
    </div>
  );
}
