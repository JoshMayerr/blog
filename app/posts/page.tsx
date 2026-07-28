import { allLearnings, allPosts } from "@/.contentlayer/generated";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes and essays from Josh Mayer.",
  alternates: { canonical: "/posts" },
  openGraph: {
    title: "Notes from Josh Mayer",
    description: "Notes and essays from Josh Mayer.",
    url: "/posts",
  },
};

export default function PostsPage() {
  const latestLearningDate = allLearnings.reduce<string | undefined>(
    (latest, essay) =>
      !latest || new Date(essay.date) > new Date(latest)
        ? essay.date
        : latest,
    undefined,
  );
  const notes = [
    ...allPosts.map((post) => ({
      kind: "post" as const,
      date: post.date,
      post,
    })),
    ...(latestLearningDate
      ? [{ kind: "learning" as const, date: latestLearningDate }]
      : []),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="mt-6">
      <h1 className="sr-only">Notes</h1>
      {notes.map((note) =>
        note.kind === "learning" ? (
          <article key="learning" className="mb-14">
            <div className="mb-3 flex items-baseline gap-1.5">
              <Link href="/learning" className="underline">
                <h2 className="font-bold text-2xl">Learning</h2>
              </Link>
              <span
                className="font-serif text-sm text-slate-500 dark:text-slate-400"
                aria-label={`${allLearnings.length} ${allLearnings.length === 1 ? "essay" : "essays"}`}
              >
                +{allLearnings.length}
              </span>
            </div>
            <p className="text-base my-1 text-slate-700 dark:text-slate-200">
              Notes and essays organized by what I am learning.
            </p>
            <p className="text-base mt-2 text-slate-700 dark:text-slate-200">
              Last updated {formatDate(note.date)}
            </p>
          </article>
        ) : (
          <article key={note.post._id} className="mb-14">
            <Link href={note.post.slug} className="underline">
              <h2 className="font-bold text-2xl mb-3">{note.post.title}</h2>
            </Link>
            {note.post.description && (
              <p className="text-base my-1 text-slate-700 dark:text-slate-200">
                {note.post.description}
              </p>
            )}
            {note.post.date && (
              <p className="text-base mt-2 text-slate-700 dark:text-slate-200">
                {formatDate(note.post.date)}
              </p>
            )}
          </article>
        ),
      )}
    </div>
  );
}
