import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/auth/context/AuthContext'
import { HelpButton } from '@/components/help/HelpButton'

export const metadata: Metadata = {
  title: 'IUT02 Care - Charity Fund Management',
  description: 'Charity fund management platform with donation tracking and distribution management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <HelpButton />
        </AuthProvider>
      </body>
    </html>
  )
}

