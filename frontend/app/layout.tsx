import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'

export const metadata: Metadata = {
  title: 'KRILIN.AI - Your Power-Up Sidekick',
  description: 'Level up your productivity and wellness with Krilin.AI - your personal AI assistant with Dragon Ball Z flair',
  generator: 'Krilin.AI',
  icons: {
    icon: '/krilin_logo.png',
    shortcut: '/krilin_logo.png',
    apple: '/krilin_logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-[#fffaeb] font-pixel">
        <AuthProvider>
          <div className="min-h-screen relative">
            <div className="fixed inset-0 pointer-events-none z-50 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            </div>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
