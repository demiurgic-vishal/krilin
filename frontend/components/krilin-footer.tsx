interface KrilinFooterProps {
  subtitle?: string
}

export default function KrilinFooter({ subtitle = "POWER UP YOUR PRODUCTIVITY" }: KrilinFooterProps) {
  return (
    <footer className="bg-[var(--secondary)] text-[var(--secondary-foreground)] border-t-2 border-[var(--border)] p-4 text-center text-xs mt-8">
      <p className="font-pixel">© 2025 KRILIN.AI - YOUR POWER-UP SIDEKICK</p>
      <p className="mt-2 font-pixel">{subtitle}</p>
    </footer>
  )
}