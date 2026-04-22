export function FieldHint({ text }: { text: string }) {
  return (
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
      {text}
    </p>
  );
}
