import { Mdx } from "@/components/mdx-components";
import { JsonLd } from "@/components/json-ld";
import { formatDate, getBaseUrl } from "@/lib/utils";
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

  const socialImage = `/api/og/learning/${essay.slugAsParams}`;

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
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: essay.title,
        },
      ],
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

  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: essay.title,
    description: essay.description,
    datePublished: essay.date,
    image: `${baseUrl}/api/og/learning/${essay.slugAsParams}`,
    mainEntityOfPage: new URL(essay.slug, baseUrl).toString(),
    author: {
      "@type": "Person",
      name: "Josh Mayer",
      url: baseUrl,
    },
  };

  return (
    <article className="mt-6 mb-16">
      <JsonLd data={jsonLd} />
      <Link
        href="/learning"
        className="text-sm underline text-slate-600 dark:text-slate-300"
      >
        Back
      </Link>
      <header className="flex flex-col mt-5 mb-6">
        <h1 className="font-bold text-2xl mb-3 underline">{essay.title}</h1>
        {essay.description && (
          <p className="text-base mt-0 mb-1 text-slate-700 dark:text-slate-200">
            {essay.description}
          </p>
        )}
        <p className="text-base my-0 text-slate-700 dark:text-slate-200">
          {formatDate(essay.date)}
        </p>
      </header>
      <div className="prose dark:prose-invert">
        <Mdx code={essay.body.code} />
      </div>
    </article>
  );
}
