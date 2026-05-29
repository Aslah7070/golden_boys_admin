import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ToastContainer from '@/components/ToastContainer';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Golden Boys – Admin Console',
  description: 'Administrative console for Golden Boys Football Lelam Vili.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${outfit.variable} font-sans bg-[#070b10] text-slate-100 antialiased min-h-screen flex flex-col relative`}>
        {/* Ambient background decoration */}
        <div className="absolute inset-0 -z-50 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px]" />
        </div>

        <Providers>
          <main className="flex-1 w-full relative">
            {children}
          </main>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
