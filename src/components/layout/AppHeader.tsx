export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 backdrop-blur-md px-6">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
    </header>
  );
}
