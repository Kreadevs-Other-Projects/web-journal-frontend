import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { url } from "@/url";

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  max?: number;
  journalId?: string;
  placeholder?: string;
  error?: string;
}

export function KeywordInput({
  value,
  onChange,
  max = 5,
  journalId,
  placeholder,
  error,
}: KeywordInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [journalSuggestions, setJournalSuggestions] = useState<string[]>([]);

  // Fetch journal-level top keywords when journalId changes
  useEffect(() => {
    if (!journalId) {
      setJournalSuggestions([]);
      return;
    }
    fetch(`${url}/papers/keywords/journal/${journalId}?limit=8`)
      .then((r) => r.json())
      .then((d) => setJournalSuggestions(d.keywords || []))
      .catch(() => {});
  }, [journalId]);

  // Debounced suggestions as user types
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: input, limit: "8" });
      if (journalId) params.append("journal_id", journalId);
      fetch(`${url}/papers/keywords/suggestions?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.keywords) {
            setSuggestions(d.keywords.filter((k: string) => !value.includes(k)));
          }
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [input, journalId, value]);

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= max) return;
    onChange([...value, trimmed]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addKeyword(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeKeyword(value[value.length - 1]);
    }
  };

  const visibleJournalSuggestions = journalSuggestions.filter(
    (k) => !value.includes(k),
  );

  return (
    <div className="space-y-2">
      {/* Journal-level suggested keywords */}
      {visibleJournalSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Suggested for this journal:
          </p>
          <div className="flex flex-wrap gap-1">
            {visibleJournalSuggestions.slice(0, 8).map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => addKeyword(kw)}
                disabled={value.includes(kw) || value.length >= max}
                className="text-xs px-2 py-0.5 border rounded-full hover:bg-primary/10 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chip input */}
      <div className="relative">
        <div
          className={`flex flex-wrap gap-1.5 p-2 border rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ${
            error ? "border-destructive" : "border-input"
          }`}
        >
          {value.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
            >
              {kw}
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                className="hover:text-primary/60"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {value.length < max && (
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={
                value.length === 0
                  ? (placeholder ?? "Type to search or add keywords...")
                  : ""
              }
              className="flex-1 min-w-[140px] outline-none bg-transparent text-sm"
            />
          )}
        </div>

        {/* Dropdown suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                onMouseDown={() => addKeyword(suggestion)}
              >
                <span>{suggestion}</span>
                <span className="text-xs text-muted-foreground">+ Add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {error
          ? error
          : `${value.length}/${max} keywords${value.length >= max ? " — maximum reached" : ""}`}
      </p>
    </div>
  );
}
