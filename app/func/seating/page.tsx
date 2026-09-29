import type { Metadata } from "next";
import { SeatingPlanner } from "@/components/func/seating";
export const metadata: Metadata = {
  title: "Event seating planner",
  description: "Plan your guest list, tables, and seating arrangements.",
  alternates: { canonical: "/func/seating" },
};
export default function SeatingPage() {
  return (
    <>
      <p className="func-kicker">Event planning</p>
      <h1>A place for everyone.</h1>
      <p className="func-intro">
        Bring the guest list. Plan the room. Work out who sits where.
      </p>
      <SeatingPlanner />
    </>
  );
}
