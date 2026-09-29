"use client";
import Link from "next/link";
import { Button, Card, Chip } from "@/components/func/ui";
export default function Page() {
  const tools = [
    {
      title: "Book research",
      href: "/func/race",
      tag: "Live experiment",
      description:
        "Watch agents research the same book using different interfaces.",
    },
    {
      title: "Seating planner",
      href: "/func/seating",
      tag: "Agent function",
      description:
        "Arrange guests at tables with capacity and pairing constraints.",
    },
    {
      title: "Collections",
      href: "/func/collections",
      tag: "Agent function",
      description:
        "Assemble an ordered reading packet from the archive with notes and export options.",
    },
    {
      title: "Comparisons",
      href: "/func/comparisons",
      tag: "Agent function",
      description:
        "Compare selected posts using metadata, shared terms, and references.",
    },
  ];
  return (
    <div className="lab-overview">
      <h1>Agent experiments</h1>
      <p>Test the same tasks across different ways of interacting.</p>
      <div className="lab-tools">
        {tools.map((tool) => (
          <Card key={tool.href} elevation="none" className="p-6">
            <Chip label={tool.tag} variant="neutral" />
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <Button is={Link} href={tool.href} variant="secondary" size="small">
              Open {tool.title.toLowerCase()} →
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
