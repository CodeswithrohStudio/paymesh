import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PayMesh — Advanced API Protocols',
  description: 'The x402 payment layer for APIs. Built for AI agents and developers on Base.',
  keywords: ['x402', 'API payments', 'crypto', 'USDC', 'Base', 'AI agents', 'web3'],
  openGraph: {
    title: 'PayMesh — Advanced API Protocols',
    description: 'The x402 payment layer for APIs. Add per-call USDC payments in 3 lines of code.',
    type: 'website',
  },
}

import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen selection:bg-cyan-500/30 selection:text-slate-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
