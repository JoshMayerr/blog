import { allPosts } from "@/.contentlayer/generated";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { NextResponse } from "next/server";

export default function Home() {
  const allPostsSorted = allPosts.sort((a, b) => {
    const dateA = new Date(b.date).getTime();
    const dateB = new Date(a.date).getTime();
    return dateA - dateB;
  });
  return (
    <div className="prose dark:prose-invert">
      {/* <h3 className="mt-16">
        Hello, my name is Josh and here are some of my thoughts.
      </h3> */}
      {allPostsSorted.map((post) => (
        <article key={post._id}>
          <Link className="flex items-end space-x-4" href={post.slug}>
            <h2 className="mb-0">{post.title}</h2>
          </Link>
          {post.description && <p className="mt-2 mb-1">{post.description}</p>}
          {post.date && (
            <p className="my-0 no-underline">{formatDate(post.date)}</p>
          )}
        </article>
      ))}
    </div>
  );
}
