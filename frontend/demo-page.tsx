import KrilinLogo from "@/components/krilin-logo"
import KrilinButton from "@/components/krilin-button"
import KrilinHeader from "@/components/krilin-header"
import KrilinCard from "@/components/krilin-card"
import KrilinPowerMeter from "@/components/krilin-power-meter"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaeb] to-[#fff0d4] font-pixel">
      <KrilinHeader />

      <main className="container mx-auto p-4 md:p-8">
        {/* Hero section with improved visual effects */}
        <section className="grid md:grid-cols-2 gap-8 items-center mb-16 relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffc15e20] to-transparent rounded-lg -z-10"></div>
          
          <div className="px-4 py-6 backdrop-blur-sm bg-white/10 rounded-lg border-2 border-[#33272a] transform transition-all duration-300 hover:scale-[1.02]">
            <h1 className="text-3xl md:text-5xl mb-6 text-[#33272a] text-shadow-sm">POWER UP YOUR AI</h1>
            <p className="mb-8 text-[#594a4e] text-lg leading-relaxed">
              Krilin.AI analyzes your data with the precision of a Z-fighter. Train your models and reach power levels
              over 9000!
            </p>
            <div className="flex flex-wrap gap-4">
              <KrilinButton className="transform transition-all duration-200 hover:scale-105 hover:-rotate-1 shadow-lg">GET STARTED</KrilinButton>
              <KrilinButton variant="secondary" className="transform transition-all duration-200 hover:scale-105 hover:rotate-1 shadow-lg">LEARN MORE</KrilinButton>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative p-4">
              {/* Pulsing background effect */}
              <div className="absolute inset-0 bg-[#ff6b3520] rounded-full animate-pulse"></div>
              
              {/* Main logo with enhanced effects */}
              <div className="relative animate-bounce-slow">
                <KrilinLogo className="w-48 h-48 md:w-64 md:h-64 drop-shadow-lg" />
                <div className="absolute inset-0 crt-effect scanlines animate-scanline"></div>
                
                {/* Energy aura effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#ffc15e50] to-[#ff6b3550] rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards section with improved visual hierarchy and interactions */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <KrilinCard title="ANALYZE" className="transform transition-all duration-300 hover:scale-105 hover:-rotate-1 hover:shadow-lg">
            <div className="text-center mb-4">
              <div className="inline-block p-3 bg-[#ff6b3520] rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-base mb-4 text-[#594a4e]">Scan data patterns with Krilin's perception abilities.</p>
            </div>
            <KrilinPowerMeter value={85} label="ACCURACY" className="animate-fade-in" />
          </KrilinCard>

          <KrilinCard title="TRAIN" className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-center mb-4">
              <div className="inline-block p-3 bg-[#ffc15e20] rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#ffc15e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-base mb-4 text-[#594a4e]">Level up your models with intensive training regimens.</p>
            </div>
            <KrilinPowerMeter value={65} label="TRAINING" className="animate-fade-in delay-100" />
          </KrilinCard>

          <KrilinCard title="DEPLOY" className="transform transition-all duration-300 hover:scale-105 hover:rotate-1 hover:shadow-lg">
            <div className="text-center mb-4">
              <div className="inline-block p-3 bg-[#4ecdc420] rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#4ecdc4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-base mb-4 text-[#594a4e]">Launch your AI with the speed of Krilin's Destructo Disc.</p>
            </div>
            <KrilinPowerMeter value={95} label="SPEED" className="animate-fade-in delay-200" />
          </KrilinCard>
        </section>

        {/* Power level metrics section with improved design */}
        <section className="pixel-border p-8 bg-gradient-to-r from-[#33272a] to-[#594a4e] text-white mb-16 rounded-lg shadow-lg transform transition-all hover:shadow-xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-4 h-4 bg-[#ff6b35] mr-2"></div>
            <h2 className="text-3xl font-bold text-center">POWER LEVEL METRICS</h2>
            <div className="w-4 h-4 bg-[#ff6b35] ml-2"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#ffffff10] backdrop-blur-sm p-4 rounded-lg border border-[#ffffff30] transform transition-all duration-300 hover:scale-[1.02]">
              <KrilinPowerMeter value={42} label="CPU USAGE" className="mb-4 animate-fade-in" />
              <KrilinPowerMeter value={78} label="MEMORY" className="mb-2 animate-fade-in delay-100" />
            </div>
            <div className="bg-[#ffffff10] backdrop-blur-sm p-4 rounded-lg border border-[#ffffff30] transform transition-all duration-300 hover:scale-[1.02]">
              <KrilinPowerMeter value={91} label="ACCURACY" className="mb-4 animate-fade-in delay-200" />
              <KrilinPowerMeter value={88} label="RESPONSE TIME" className="mb-2 animate-fade-in delay-300" />
            </div>
          </div>
          
          <div className="text-center mt-6 text-[#ffc15e] animate-pulse">
            <p className="text-sm">TRAINING PROGRESS: OUTSTANDING</p>
          </div>
        </section>
        
        {/* New testimonial section */}
        <section className="mb-16 px-4">
          <h2 className="text-2xl mb-8 text-center text-[#33272a]">Z-FIGHTER TESTIMONIALS</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border-2 border-[#33272a] shadow-md transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-[#ff6b35] rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold text-[#33272a]">GOKU</h3>
                  <p className="text-xs text-[#594a4e]">LEGENDARY Z-FIGHTER</p>
                </div>
              </div>
              <p className="text-sm text-[#594a4e]">"Krilin.AI helped me train my algorithms faster than the Hyperbolic Time Chamber!"</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border-2 border-[#33272a] shadow-md transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-[#4ecdc4] rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold text-[#33272a]">BULMA</h3>
                  <p className="text-xs text-[#594a4e]">TECH GENIUS</p>
                </div>
              </div>
              <p className="text-sm text-[#594a4e]">"The data analysis capabilities in Krilin.AI are even more impressive than Capsule Corp technology!"</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border-2 border-[#33272a] shadow-md transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-[#ffc15e] rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold text-[#33272a]">VEGETA</h3>
                  <p className="text-xs text-[#594a4e]">SAIYAN PRINCE</p>
                </div>
              </div>
              <p className="text-sm text-[#594a4e]">"Even I, the Prince of Saiyans, was impressed by the power level of this AI system. It's over 9000!"</p>
            </div>
          </div>
        </section>
        {/* Call-to-action section */}
        <section className="text-center mb-20 p-8 bg-gradient-to-r from-[#ff6b3520] to-[#ffc15e20] rounded-lg">
          <h2 className="text-3xl mb-6 text-[#33272a]">READY TO POWER UP?</h2>
          <p className="mb-8 text-[#594a4e] max-w-2xl mx-auto">
            Join the elite Z-fighters of AI developers who have already transformed their data analysis capabilities with Krilin.AI. Start your journey today!
          </p>
          <KrilinButton className="px-10 py-3 text-lg shadow-xl transform transition-all duration-300 hover:scale-110">
            POWER UP NOW
          </KrilinButton>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-[#33272a] to-[#594a4e] text-white p-6 text-center">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-6">
          <div className="text-left">
            <h3 className="font-pixel text-lg mb-4 text-[#ffc15e]">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">API Reference</a></li>
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">Tutorials</a></li>
            </ul>
          </div>
          <div className="text-left">
            <h3 className="font-pixel text-lg mb-4 text-[#ffc15e]">RESOURCES</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">Community</a></li>
              <li><a href="#" className="text-sm hover:text-[#ffc15e] transition-colors">Support</a></li>
            </ul>
          </div>
          <div className="text-left">
            <h3 className="font-pixel text-lg mb-4 text-[#ffc15e]">CONTACT</h3>
            <p className="text-sm mb-2">info@krilin.ai</p>
            <p className="text-sm">Capsule Corp HQ, West City</p>
          </div>
        </div>
        <div className="border-t border-[#ffffff20] pt-6">
          <p>© 2025 KRILIN.AI - POWER LEVEL ANALYZER</p>
          <p className="mt-2 text-xs text-[#ffffff80]">NOT AFFILIATED WITH DRAGON BALL Z</p>
        </div>
      </footer>
    </div>
  )
}
