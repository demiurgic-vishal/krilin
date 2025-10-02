import type { Metadata } from 'next'
import { Space_Grotesk, Archivo_Black } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-head',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KRILIN - Retro AI Productivity',
  description: 'Your retro-styled AI productivity companion',
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
    <html lang="en" className={`${spaceGrotesk.variable} ${archivoBlack.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
