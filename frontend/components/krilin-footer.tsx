interface KrilinFooterProps {
  subtitle?: string
}

export default function KrilinFooter({ subtitle = "POWER UP YOUR PRODUCTIVITY" }: KrilinFooterProps) {
  return (
    <footer className="bg-[#33272a] text-white p-4 text-center text-xs mt-8">
      <p>© 2025 KRILIN.AI - YOUR POWER-UP SIDEKICK</p>
      <p className="mt-2">{subtitle}</p>
    </footer>
  )
}