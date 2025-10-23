import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { DialogProvider } from "@/providers/DialogProvider"
import { ScrollArea } from '@/components/ui/scroll-area'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vyom Logistics',
  description: 'Your Community Gathered!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DialogProvider>
          <ScrollArea className='h-screen'>
            {children}
          </ScrollArea>
          <Toaster />
        </DialogProvider>
      </body>
    </html>
  )
}
