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
    <article className="py-6 prose dark:prose-invert">
      <h3>{page.title}</h3>
      {page.description && <p className="text-md">{page.description}</p>}
      <hr />
      <Mdx code={page.body.code} />
    </article>
  );
}
