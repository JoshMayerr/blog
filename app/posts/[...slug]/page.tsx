import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";

import { Metadata } from "next";
import { Mdx } from "@/components/mdx-components";
import { formatDate } from "@/lib/utils";

interface PostProps {
  params: {
    slug: string[];
  };
}

async function getPostFromParams(params: PostProps["params"]) {
  const slug = params?.slug?.join("/");
  const post = allPosts.find((post) => post.slugAsParams === slug);

  if (!post) {
    null;
  }

  return post;
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const post = await getPostFromParams(params);

  if (!post) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Create dynamic OG image URL with post content
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", post.title);
  if (post.description) {
    ogImageUrl.searchParams.set("description", post.description);
  }

  const metadata: Metadata = {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [
        {
          url: ogImageUrl.toString(),
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
      images: [ogImageUrl.toString()],
    },
  };

  return metadata;
}

export async function generateStaticParams(): Promise<PostProps["params"][]> {
  return allPosts.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }));
}

export default async function PostPage({ params }: PostProps) {
  const post = await getPostFromParams(params);

  if (!post) {
    notFound();
  }

  return (
    <article className="mb-16 prose dark:prose-invert ">
      <div className="flex flex-col">
        <span>
          <h2 className="mb-2">{post.title}</h2>
          {post.description && (
            <p className="text-md my-1 text-slate-700 dark:text-slate-200">
              {post.description}
            </p>
          )}
        </span>
        {post.date && (
          <p className="text-md my-0 text-slate-700 dark:text-slate-200">
            {formatDate(post.date)}
          </p>
        )}
      </div>

      {/* <hr className="" /> */}
      <Mdx code={post.body.code} />
    </article>
  );
}
