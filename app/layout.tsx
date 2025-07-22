import Link from "next/link";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@/components/analytics";
import { ModeToggle } from "@/components/mode-toggle";
import { NextResponse } from "next/server";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata = {
  title: "Some Thoughts From Josh Mayer",
  description: "just a simple repository of notes and others from Josh Mayer",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      {/* <Script src="https://tb-monitor.vercel.app/api/v1/1234-unique-id" /> */}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || ""} />
      <body
        className={`antialiased min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50 font-serif tracking-tighter`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="">
            <div className="fixed top-0 flex justify-between w-full dark:mix-blend-difference px-4 sm:px-10 pt-8 font-bold">
              <nav className="text-md space-x-6 underline">
                <Link href="/">Home</Link>
                <Link href="/posts">Notes</Link>
                {/* <Link href="/about">About</Link> */}
              </nav>
              <ModeToggle />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
