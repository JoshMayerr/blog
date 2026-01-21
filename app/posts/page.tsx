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
    <div className="mt-6">
      {allPostsSorted.map((post) => (
        <article key={post._id} className="mb-14">
          <Link href={post.slug} className="underline">
            <h2 className="font-bold text-2xl mb-3">{post.title}</h2>
          </Link>
          {post.description && (
            <p className="text-md my-1 text-slate-700 dark:text-slate-200">
              {post.description}
            </p>
          )}
          {post.date && (
            <p className="text-md mt-2 text-slate-700 dark:text-slate-200">
              {formatDate(post.date)}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
