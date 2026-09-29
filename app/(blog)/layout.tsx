import Link from "next/link";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://joshmayer.net"),
  title: {
    default: "Josh Mayer",
    template: "%s | Josh Mayer",
  },
  description: "Notes, essays, and projects from Josh Mayer.",
  authors: [{ name: "Josh Mayer", url: "https://joshmayer.net" }],
  creator: "Josh Mayer",
  publisher: "Josh Mayer",
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Josh Mayer",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="describedby" href="/llms.txt" type="text/plain" />
      </head>
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
      )}
      <body
        className={`antialiased min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50 font-serif tracking-tighter`}
      >
        <header className="">
          <div className="fixed top-0 flex justify-between w-full dark:mix-blend-difference px-4 sm:px-10 pt-8 font-bold">
            <nav className="text-base space-x-6 underline">
              <Link href="/">Home</Link>
              <Link href="/posts">Notes</Link>
              <Link href="/projects">Projects</Link>
            </nav>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <ModeToggle />
            </ThemeProvider>
          </div>
        </header>
        <div className="max-w-2xl mx-auto py-16 px-4">
          <main>{children}</main>
        </div>
        <Analytics />

        <footer>
          <div className="fixed bottom-0 w-full px-4 sm:px-10 pb-8 dark:mix-blend-difference font-bold">
            <nav className="text-sm flex justify-between space-x-6">
              <div className="">
                <h3 className="">
                  Josh Mayer, {new Date().getFullYear()}. San Francisco.
                </h3>
              </div>
              <div className="space-x-6 underline">
                <Link href="https://www.youtube.com/@jooshmayer">
                  Youtube
                </Link>
                <Link href="https://x.com/jooshmayer">X</Link>
                <Link href="https://github.com/joshmayerr">GitHub</Link>
                <Link href="https://linkedin.com/in/jooshmayer">
                  LinkedIn
                </Link>
              </div>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
