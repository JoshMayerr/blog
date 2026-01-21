import { notFound } from "next/navigation";
import { allPosts } from "contentlayer2/generated";

import { Metadata } from "next";
import { Mdx } from "@/components/mdx-components";
import { formatDate, getBaseUrl } from "@/lib/utils";

interface PostProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getPostFromParams(slug: string[]) {
  const slugPath = slug?.join("/");
  const post = allPosts.find((post) => post.slugAsParams === slugPath);

  if (!post) {
    null;
  }

  return post;
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostFromParams(slug);

  if (!post) {
    return {};
  }

  const baseUrl = getBaseUrl();
  const ogImageUrl = `${baseUrl}/og-images/posts-${post.slugAsParams}.png`;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
    },
  };
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }));
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params;
  const post = await getPostFromParams(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mt-6 mb-16">
      <div className="flex flex-col mb-6">
        <h2 className="font-bold text-2xl mb-3 underline">{post.title}</h2>
        {post.description && (
          <p className="text-md mt-0 mb-1 text-slate-700 dark:text-slate-200">
            {post.description}
          </p>
        )}
        {post.date && (
          <p className="text-md my-0 text-slate-700 dark:text-slate-200">
            {formatDate(post.date)}
          </p>
        )}
      </div>

      <div className="prose dark:prose-invert">
        <Mdx code={post.body.code} />
      </div>
    </article>
  );
}
