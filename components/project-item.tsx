import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ProjectItemProps {
  title: string;
  description: string;
  href?: string;
  meta?: string;
}

export function ProjectItem({
  title,
  description,
  href,
  meta,
}: ProjectItemProps) {
  const linkLabel = href
    ? href.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "")
    : "";

  return (
    <li className="grid gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="my-0 text-base font-bold">
          {href ? <Link href={href}>{title}</Link> : title}
        </h3>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-baseline gap-1 text-sm tabular-nums underline decoration-1 underline-offset-2"
          >
            <span>{linkLabel}</span>
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </Link>
        ) : (
          meta && <span className="text-sm opacity-70">{meta}</span>
        )}
      </div>
      <p className="my-0">{description}</p>
    </li>
  );
}
