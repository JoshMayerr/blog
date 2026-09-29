import { allLearnings } from "contentlayer2/generated";
import { formatDate, getBaseUrl } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

const description = "Notes and essays organized by what Josh Mayer is learning.";
const socialImage = `${getBaseUrl()}/og-images/home.png`;

export const metadata: Metadata = {
  title: "Learning",
  description,
  alternates: { canonical: "/learning" },
  openGraph: {
    title: "Learning",
    description,
    url: "/learning",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Learning notes from Josh Mayer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learning",
    description,
    images: [socialImage],
  },
};

export default function LearningPage() {
  const learningsByDate = [...allLearnings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latestLearningDate = learningsByDate[0]?.date;
  const sections = learningsByDate
    .reduce<Record<string, (typeof allLearnings)[number][]>>(
      (grouped, essay) => {
        (grouped[essay.section] ??= []).push(essay);
        return grouped;
      },
      {},
    );

  return (
    <div className="mt-6 mb-16">
      <header className="mb-14">
        <h1 className="font-bold text-2xl mb-3 underline">Learning</h1>
        <p className="text-base my-1 text-slate-700 dark:text-slate-200">
          Notes and essays organized by what I am learning.
        </p>
        {latestLearningDate && (
          <p className="text-base mt-2 text-slate-700 dark:text-slate-200">
            Last updated {formatDate(latestLearningDate)}
          </p>
        )}
      </header>

      {Object.entries(sections).map(([section, essays]) => (
        <section key={section} className="mb-12">
          <h2 className="font-bold text-xl mb-5">{section}</h2>
          <div className="space-y-6 border-l border-slate-200 dark:border-slate-800 pl-5">
            {essays.map((essay) => (
              <article key={essay._id}>
                <Link href={essay.slug} className="underline">
                  <h3 className="font-bold text-lg mb-1">{essay.title}</h3>
                </Link>
                {essay.description && (
                  <p className="text-slate-700 dark:text-slate-200">
                    {essay.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
