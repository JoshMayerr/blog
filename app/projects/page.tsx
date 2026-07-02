import { Metadata } from "next";
import { ProjectItem } from "@/components/project-item";

export const metadata: Metadata = {
  title: "All Projects",
  description: "A running log of things I've built.",
};

const projectsByYear = [
  {
    year: "2026",
    projects: [
      {
        title: "OP",
        href: "https://op.inc",
        description:
          "A Python SDK and CLI for OP auth, SMS, phone numbers, webhooks, and setup.",
      },
      {
        title: "Fade for Mac",
        href: "https://github.com/JoshMayerr/fade-mac",
        meta: "github",
        description:
          "A macOS menu bar app that blocks distracting websites on a schedule by managing hosts rules.",
      },
      {
        title: "Fade",
        href: "https://fade.cool",
        description:
          "An iOS app that blocks distracting apps with Screen Time APIs and tracks time since starting a digital detox.",
      },
      {
        title: "Delegated authorization for agents",
        href: "https://www.bu.edu/cs/profiles/sharon-goldberg/",
        description:
          "Research with Professor Sharon Goldberg at BU on delegated authorization for agents.",
        meta: "research",
      },
    ],
  },
  {
    year: "2025",
    projects: [
      {
        title: "Open Interview Coder",
        href: "https://openinterviewcoder.com",
        description:
          "An AI-powered coding assistant overlay for screen sharing sessions.",
      },
      {
        title: "PassportMCP",
        href: "https://github.com/JoshMayerr/passport-mcp",
        meta: "github",
        description:
          "A framework for building MCP servers for websites by syncing local browser auth into requests.",
      },
      {
        title: "mcp-x",
        href: "https://github.com/JoshMayerr/mcp-x",
        meta: "github",
        description:
          "An MCP server for automating an X account through the real browser API.",
      },
      {
        title: "cfg-neuralese",
        href: "https://github.com/JoshMayerr/cfg-neuralese",
        meta: "github",
        description:
          "A Python project exploring neuralese and context-free grammar style representations.",
      },
      {
        title: "rps-mcp",
        href: "https://github.com/JoshMayerr/rps-mcp",
        meta: "github",
        description: "A small MCP experiment around rock-paper-scissors.",
      },
      {
        title: "402error",
        href: "https://github.com/JoshMayerr/402error",
        meta: "github",
        description: "A tiny web experiment around payment-required errors.",
      },
    ],
  },
  {
    year: "2024",
    projects: [
      {
        title: "Agentication",
        href: "https://github.com/JoshMayerr/agentication",
        meta: "github",
        description:
          "A prototype for turning session-based APIs into OAuth-like APIs for delegated agent authorization.",
      },
      {
        title: "Supatool",
        href: "https://github.com/JoshMayerr/supatool",
        meta: "github",
        description:
          "An open-source registry of public APIs and OpenAPI specs designed to be used as tools for agents.",
      },
      {
        title: "Spray and Pray",
        href: "https://github.com/JoshMayerr/sprayandpray",
        meta: "github",
        description:
          "A bot for applying to hundreds of job and internship applications quickly.",
      },
    ],
  },
  {
    year: "2023",
    projects: [
      {
        title: "This site",
        href: "https://joshmayer.net",
        description:
          "My personal website and place for writing, built with Next.js and MDX.",
      },
      {
        title: "TollBit",
        href: "https://tollbit.com",
        description:
          "Infrastructure for agents to access data and take actions at scale.",
      },
      {
        title: "Sunflowers.dev",
        href: "https://sunflowers.dev",
        description:
          "An internship application spray and pray bot for over 8,000 students in two months.",
      },
      {
        title: "Beme",
        description:
          "An updated phone to phone contact sharing service like Bump, built with BLE and location services in Flutter.",
        meta: "mobile app",
      },
      {
        title: "Oint",
        href: "https://ointapp.vercel.app",
        description: "NFC tags for replacing business cards.",
      },
      {
        title: "Bix",
        href: "https://bix-web.vercel.app",
        description:
          "A web app experiment for imagining a different interface to the internet.",
      },
    ],
  },
  {
    year: "2022",
    projects: [
      {
        title: "Sideline HD volleyball scoring",
        href: "https://sidelinehd.com",
        description:
          "Built Sideline HD's volleyball scoring application, which serves over 100,000 high school teams.",
      },
      {
        title: "Better Sonder",
        href: "https://bettersonder.vercel.app",
        description: "A later iteration of the Sonder website.",
      },
    ],
  },
  {
    year: "2020",
    projects: [
      {
        title: "Swapdme",
        meta: "private",
        description: "An early Laravel marketplace-style project.",
      },
    ],
  },
  {
    year: "2018",
    projects: [
      {
        title: "Scrimius Bot",
        href: "https://top.gg/bot/516340661247541248",
        description:
          "A Discord bot I built when I was 14 that paired Fortnite players together in the same match.",
        meta: "top.gg",
      },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <article className="py-6 prose dark:prose-invert">
      <h3>All Projects</h3>
      <p className="text-md">A running log of things I&apos;ve built.</p>
      <div className="not-prose grid gap-10">
        {projectsByYear.map(({ year, projects }) => (
          <section key={year} className="grid gap-4">
            <div className="flex items-center gap-3">
              <h2 className="my-0 text-sm font-bold tabular-nums">{year}</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <ul className="grid gap-5">
              {projects.map((project) => (
                <ProjectItem key={project.title} {...project} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
