import type { Metadata } from "next";
import "./race.css";
export const metadata: Metadata = {
  title: "Agent Book Research",
  description: "One book. Different interfaces. Watch agents find evidence and submit answers.",
  referrer: "no-referrer",
};
export default function RaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="race-shell">{children}</div>;
}
