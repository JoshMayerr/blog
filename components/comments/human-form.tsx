"use client";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
export type Comment = {
  id: string;
  source?: "human" | "agent";
  name?: string;
  wallet?: string;
  body: string;
  createdAt: string;
};
type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      cData: string;
      theme: string;
      size: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
    onBlogTurnstileReady?: () => void;
  }
}
export function HumanForm({
  post,
  onComment,
}: {
  post: string;
  onComment: (comment: Comment) => void;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [siteKey, setSiteKey] = useState("");
  const [ready, setReady] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [configStatus, setConfigStatus] = useState("Loading verification…");
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  // Retain the exact attempted content on ambiguous failures, so Retry cannot duplicate it.
  const pending = useRef<{
    post: string;
    name: string;
    body: string;
    requestId: string;
    captchaToken: string;
  } | null>(null);
  const [retry, setRetry] = useState(false);
  useEffect(() => {
    const loaded = () => setReady(true);
    window.onBlogTurnstileReady = loaded;
    const controller = new AbortController();
    fetch("/api/comments/config", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setSiteKey(data.siteKey);
        setRequestId(crypto.randomUUID());
        setConfigStatus(
          data.siteKey
            ? ""
            : "Human commenting is being set up. Please check back soon.",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setConfigStatus(
            "Verification could not load. Please refresh to try again.",
          );
      });
    return () => {
      controller.abort();
      if (window.onBlogTurnstileReady === loaded)
        delete window.onBlogTurnstileReady;
    };
  }, []);
  useEffect(() => {
    if (
      !ready ||
      !siteKey ||
      !requestId ||
      !container.current ||
      !window.turnstile
    )
      return;
    const id = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action: "blog-comment",
      cData: requestId,
      theme: "auto",
      size: "flexible",
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setMessage(
          "Verification could not complete. Please refresh and try again.",
        );
      },
    });
    widget.current = id;
    return () => {
      window.turnstile?.remove(id);
      widget.current = undefined;
    };
  }, [ready, siteKey, requestId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submission = pending.current || {
      post,
      name: name.trim(),
      body: body.trim(),
      requestId,
      captchaToken: token,
    };
    if (!submission.captchaToken) {
      setMessage("Complete the verification before posting.");
      return;
    }
    pending.current = submission;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/comments/human", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status < 500) {
          pending.current = null;
          setRetry(false);
          setToken("");
          setRequestId(crypto.randomUUID());
        } else setRetry(true);
        setMessage(
          data.error || "Could not post your comment. Please try again.",
        );
        return;
      }
      pending.current = null;
      setRetry(false);
      if (data.comment) onComment(data.comment);
      setBody("");
      setToken("");
      setRequestId(crypto.randomUUID());
      setMessage(
        data.deleted
          ? "This comment has been removed."
          : "Your comment is posted.",
      );
    } catch {
      setRetry(true);
      setMessage(
        "We couldn’t confirm your comment was posted. Retry to check safely.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fieldClass =
    "mt-2 block w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-slate-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100";
  return (
    <form
      onSubmit={submit}
      className="mt-6 space-y-4"
      aria-label="Leave a comment"
    >
      <div>
        <label htmlFor="comment-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="comment-name"
          autoComplete="nickname"
          required
          maxLength={80}
          value={name}
          disabled={busy || retry}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Public display name; not verified.
        </p>
      </div>
      <div>
        <label htmlFor="comment-body" className="text-sm font-medium">
          Comment
        </label>
        <textarea
          id="comment-body"
          required
          maxLength={4000}
          rows={3}
          value={body}
          disabled={busy || retry}
          onChange={(event) => setBody(event.target.value)}
          className={fieldClass}
        />
        {body.length > 3500 && (
          <p className="mt-1 text-right text-xs text-slate-500">
            {4000 - body.length} characters remaining
          </p>
        )}
      </div>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onBlogTurnstileReady"
          onReady={() => setReady(true)}
          onError={() =>
            setMessage(
              "Verification could not load. Please refresh and try again.",
            )
          }
        />
      )}
      <div ref={container} />
      {configStatus && <p className="text-sm text-slate-500">{configStatus}</p>}
      <button
        type="submit"
        disabled={
          busy ||
          (!retry && (!siteKey || !token || !name.trim() || !body.trim()))
        }
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
      >
        {busy ? "Posting…" : retry ? "Retry comment" : "Post comment"}
      </button>
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-slate-600 dark:text-slate-300"
        >
          {message}
        </p>
      )}
    </form>
  );
}
