export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2 opacity-70">
          <div className="size-5 rounded bg-[image:var(--gradient-primary)]" />
          <span className="text-xs font-semibold">Sentinel Infrastructure</span>
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Security Protocols</a>
          <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Compliance</a>
          <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">API Registry</a>
        </div>
        <span className="text-xs text-muted-foreground/60">© 2026 University Academic Systems</span>
      </div>
    </footer>
  );
}
