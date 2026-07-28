import { Mdx } from "@/components/mdx-components";
import { formatDate } from "@/lib/utils";
import { allLearnings } from "contentlayer2/generated";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface LearningEssayProps {
  params: Promise<{ slug: string[] }>;
}

function getEssay(slug: string[]) {
  const slugPath = slug.join("/");
  return allLearnings.find((essay) => essay.slugAsParams === slugPath);
}

export async function generateMetadata({
  params,
}: LearningEssayProps): Promise<Metadata> {
  const essay = getEssay((await params).slug);
  if (!essay) return {};

  const socialImage = "/og-images/home.png";

  return {
    title: essay.title,
    description: essay.description,
    alternates: { canonical: essay.slug },
    openGraph: {
      title: essay.title,
      description: essay.description,
      url: essay.slug,
      type: "article",
      publishedTime: essay.date,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: essay.title,
      description: essay.description,
      images: [socialImage],
    },
  };
}

export function generateStaticParams() {
  return allLearnings.map((essay) => ({
    slug: essay.slugAsParams.split("/"),
  }));
}

export default async function LearningEssayPage({
  params,
}: LearningEssayProps) {
  const essay = getEssay((await params).slug);
  if (!essay) notFound();

  return (
    <article className="mt-6 mb-16">
      <Link
        href="/learning"
        className="text-sm underline text-slate-600 dark:text-slate-300"
      >
        Back
      </Link>
      <header className="flex flex-col mt-5 mb-6">
        <h1 className="font-bold text-2xl mb-3 underline">{essay.title}</h1>
        {essay.description && (
          <p className="text-md mt-0 mb-1 text-slate-700 dark:text-slate-200">
            {essay.description}
          </p>
        )}
        <p className="text-md my-0 text-slate-700 dark:text-slate-200">
          {formatDate(essay.date)}
        </p>
      </header>
      <div className="prose dark:prose-invert">
        <Mdx code={essay.body.code} />
      </div>
    </article>
  );
}
