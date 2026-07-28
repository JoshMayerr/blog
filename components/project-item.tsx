import Link from "next/link";

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
        <h3 className="my-0 text-lg font-bold">
          {href ? <Link href={href}>{title}</Link> : title}
        </h3>
        {href ? (
          <Link
            href={href}
            className="text-sm tabular-nums underline decoration-1 underline-offset-2"
          >
            {linkLabel}
          </Link>
        ) : (
          meta && <span className="text-sm opacity-70">{meta}</span>
        )}
      </div>
      <p className="my-0 text-base text-slate-700 dark:text-slate-200">
        {description}
      </p>
    </li>
  );
}
