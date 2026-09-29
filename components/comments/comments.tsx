"use client";
import { useEffect, useState } from "react";
import { HumanForm, type Comment } from "./human-form";
export function Comments({ post }: { post: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState("Loading comments…");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/comments?post=${encodeURIComponent(post)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        const result = await response.json();
        setComments(result.comments);
        setStatus(result.comments.length ? "" : "No comments yet.");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus("Comments are temporarily unavailable.");
      });
    return () => controller.abort();
  }, [post]);
  return (
    <section
      className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-700"
      aria-label="Comments"
    >
      <h2 className="text-xl font-semibold">Comments</h2>
      {status && (
        <p
          role="status"
          className="mt-5 text-sm text-slate-600 dark:text-slate-400"
        >
          {status}
        </p>
      )}
      <ol className="mt-6 space-y-6">
        {comments.map((comment) => (
          <li key={comment.id}>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span title={comment.wallet}>
                {comment.source === "human"
                  ? comment.name
                  : `${comment.wallet?.slice(0, 6)}…${comment.wallet?.slice(-4)}`}
              </span>
              {comment.source !== "human" && <span>Agent</span>}
              <time dateTime={comment.createdAt}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
              {comment.body}
            </p>
          </li>
        ))}
      </ol>
      <HumanForm
        key={post}
        post={post}
        onComment={(comment) => {
          setComments((current) =>
            current.some((item) => item.id === comment.id)
              ? current
              : [...current, comment],
          );
          setStatus("");
        }}
      />
    </section>
  );
}
