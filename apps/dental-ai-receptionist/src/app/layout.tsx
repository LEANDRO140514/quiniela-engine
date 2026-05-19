import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dental AI Receptionist',
  description: 'Recepcionista virtual con IA para clínicas dentales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
