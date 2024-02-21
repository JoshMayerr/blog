import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";

import { Metadata } from "next";
import { Mdx } from "@/components/mdx-components";

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

  return {
    title: post.title,
    description: post.description,
  };
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
            {post.date.substring(0, 10)}
          </p>
        )}
      </div>

      {/* <hr className="" /> */}
      <Mdx code={post.body.code} />
    </article>
  );
}
