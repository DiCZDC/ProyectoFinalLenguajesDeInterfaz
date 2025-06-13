import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radar ASM',
  description: 'Radar ASM - Un radar diseñado con lenguaje ensamblador',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
