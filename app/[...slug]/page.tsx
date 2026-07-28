import { notFound } from "next/navigation";
import { Metadata } from "next";
import { allPages } from "contentlayer2/generated";

import { Mdx } from "@/components/mdx-components";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getPageFromParams(slug: string[]) {
  const slugPath = slug?.join("/");
  const page = allPages.find((page) => page.slugAsParams === slugPath);

  if (!page) {
    null;
  }

  return page;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageFromParams(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slugAsParams}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `/${page.slugAsParams}`,
    },
  };
}

export async function generateStaticParams() {
  return allPages.map((page) => ({
    slug: page.slugAsParams.split("/"),
  }));
}

export default async function PagePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageFromParams(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="py-6">
      <header className="flex flex-col mb-6">
        <h1 className="font-bold text-2xl mb-3 underline">{page.title}</h1>
        {page.description && (
          <p className="text-base mt-0 mb-1 text-slate-700 dark:text-slate-200">
            {page.description}
          </p>
        )}
      </header>
      <div className="prose dark:prose-invert">
        <Mdx code={page.body.code} />
      </div>
    </article>
  );
}
