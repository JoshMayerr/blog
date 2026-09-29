import type { Metadata } from "next";
import { FunctionShell } from "@/components/func/shell";
import "@fontsource-variable/plus-jakarta-sans";
import "./lab.css";
import "./style.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://joshmayer.net"),
  title: { default: "Agent Lab", template: "%s | Agent Lab" },
  description: "A workspace for agent experiments and functions.",
  robots: { index: false, follow: false, nocache: true },
};
export default function FunctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className="font-sans bg-bg-primary text-content-primary antialiased">
        <FunctionShell>{children}</FunctionShell>
      </body>
    </html>
  );
}
