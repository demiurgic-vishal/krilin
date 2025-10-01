// DEPRECATED: Use EnhancedKrilinHeader instead
// This component is kept for backwards compatibility but should not be used in new development
import KrilinLogo from "../components/krilin-logo"

export default function KrilinHeader() {
  return (
    <header className="bg-[#594a4e] p-2 flex items-center justify-between border-b-2 border-[#33272a]">
      <div className="flex items-center gap-3">
        <KrilinLogo className="w-10 h-10" />
        <div className="font-pixel text-white">
          <h1 className="text-lg tracking-wider">KRILIN.AI</h1>
          <p className="text-[10px] text-[#ffc15e]">LEVEL UP MIND & MATTER</p>
        </div>
      </div>

      <nav className="hidden md:flex gap-4">
        <a href="/" className="font-pixel text-sm text-white hover:text-[#ffc15e] transition-colors">
          HOME
        </a>
        <a href="/productivity" className="font-pixel text-sm text-white hover:text-[#ffc15e] transition-colors">
          PRODUCTIVITY
        </a>
        <a href="/wellness" className="font-pixel text-sm text-white hover:text-[#ffc15e] transition-colors">
          WELLNESS
        </a>
        <a href="/workflows" className="font-pixel text-sm text-white hover:text-[#ffc15e] transition-colors">
          WORKFLOWS
        </a>
      </nav>

      {/* Hamburger menu for mobile */}
      <div className="flex flex-col gap-[3px] md:hidden cursor-pointer">
        <div className="w-5 h-[2px] bg-white"></div>
        <div className="w-5 h-[2px] bg-white"></div>
        <div className="w-5 h-[2px] bg-white"></div>
      </div>
    </header>
  )
}
