
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import ConditionalFooter from '@/components/ConditionalFooter'; // Import the conditional footer
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Bookify — All-in-One Service Booking App',
  description: 'Bookify lets you discover and schedule a wide range of services — from salons to repairs, wellness, and more — in one place.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Bookify — All-in-One Service Booking App',
    description: 'Effortlessly book services like haircuts, massages, repairs, and more with Bookify — your go-to booking platform.',
    url: 'https://bookify-2h66.onrender.com', // replace with your actual domain
    siteName: 'Bookify',
    images: [
      {
        url: 'https://bookify-2h66.onrender.com/og-image.png', // replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'Bookify Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookify — Book Any Service Instantly',
    description: 'From salons to handymen — find and book trusted services with Bookify.',
    images: ['https://bookify-2h66.onrender.com/og-image.png'],
  },
  // Making environment variables available to the client if needed by including them in metadata,
  // though for Cloudinary preset, it's better to access directly via process.env.NEXT_PUBLIC_... in the component.
  // This is more for demonstration or if a specific setup requires it.
  // It's generally not recommended to expose sensitive keys this way.
  // For NEXT_PUBLIC_ variables, direct access in client components is fine.
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-dark-background`}>
        {children}
        <ConditionalFooter /> {/* Use the conditional footer */}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}

