"use client";

import { useCallback, useState } from "react";
import {
  createCollection,
  type BlogPost,
  type CollectionInput,
  type CollectionResult,
} from "@/lib/func/core";
import { download, PostPicker, Steps } from "./common";

export function Collections({ posts }: { posts: BlogPost[] }) {
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<CollectionInput["items"]>([]);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<CollectionInput["format"]>("markdown");
  const [includeText, setIncludeText] = useState(false);
  const [result, setResult] = useState<CollectionResult | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const execute = useCallback(
    (input: unknown) => {
      const created = createCollection(input, posts);
      setItems(created.input.items);
      setTitle(created.input.title);
      setFormat(created.input.format);
      setIncludeText(created.input.includeText);
      setResult(created);
      setStep(4);
      setError("");
      setNotice("");
      return created;
    },
    [posts],
  );
  const input = { title, items, format, includeText };
  function move(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setItems(next);
  }
  function generate() {
    try {
      execute(input);
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function restore() {
    try {
      const saved = localStorage.getItem("blog:collection:v1");
      if (!saved) {
        setNotice("No saved collection in this browser yet.");
        return;
      }
      execute(JSON.parse(saved));
      setNotice("Loaded your saved collection.");
    } catch {
      setError(
        "Could not load the saved collection. It may contain posts that are no longer available.",
      );
    }
  }
  return (
    <>
      <Steps
        labels={["Choose", "Arrange", "Format", "Review", "Collection"]}
        current={step}
      />
      {error && (
        <p role="alert" className="func-error">
          {error}
        </p>
      )}
      <p role="status" className="func-caption">
        {notice}
      </p>
      {step === 0 && (
        <>
          <div className="func-section-heading">
            <h2>Start with the archive.</h2>
            <button className="func-text-button" onClick={restore}>
              Load saved collection
            </button>
          </div>
          <p className="func-muted">
            Open a post to review it, then add it to your reading list. Choose
            up to 20.
          </p>
          <PostPicker
            posts={posts}
            selected={items.map((item) => item.slug)}
            max={20}
            onToggle={(slug) =>
              setItems(
                items.some((item) => item.slug === slug)
                  ? items.filter((item) => item.slug !== slug)
                  : [...items, { slug, note: "" }],
              )
            }
          />
          <div className="func-actions end">
            <button
              className="primary"
              disabled={!items.length}
              onClick={() => setStep(1)}
            >
              Arrange {items.length || "your"} posts →
            </button>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <h2>Put things in order.</h2>
          <p className="func-muted">
            Move each post into place and add a note for the reader.
          </p>
          <ol className="func-arrange">
            {items.map((item, index) => (
              <li key={item.slug}>
                <span className="func-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="func-grow">
                  <h3>
                    {posts.find((post) => post.slug === item.slug)?.title}
                  </h3>
                  {item.note && editing !== item.slug && <p>{item.note}</p>}
                  <div className="func-inline">
                    <button
                      aria-label={`Move post ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move post ${index + 1} down`}
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() =>
                        setEditing(editing === item.slug ? null : item.slug)
                      }
                    >
                      {editing === item.slug
                        ? "Done with note"
                        : item.note
                          ? "Edit note"
                          : "Add note"}
                    </button>
                    <button
                      onClick={() =>
                        setItems(
                          items.filter((entry) => entry.slug !== item.slug),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                  {editing === item.slug && (
                    <label>
                      Reader note
                      <textarea
                        maxLength={1000}
                        value={item.note}
                        onChange={(event) =>
                          setItems(
                            items.map((entry) =>
                              entry.slug === item.slug
                                ? { ...entry, note: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="func-actions">
            <button onClick={() => setStep(0)}>← Choose posts</button>
            <button
              className="primary"
              disabled={!items.length}
              onClick={() => setStep(2)}
            >
              Choose format →
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h2>Make it your collection.</h2>
          <label className="func-field">
            Collection title
            <input
              maxLength={120}
              value={title}
              placeholder="A few things worth reading"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>Export format</legend>
            {(["markdown", "json"] as const).map((value) => (
              <label className="func-option" key={value}>
                <input
                  type="radio"
                  name="format"
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                <span>
                  <strong>
                    {value === "markdown"
                      ? "Markdown reading packet"
                      : "JSON collection"}
                  </strong>
                  <small>
                    {value === "markdown"
                      ? "For reading, notes, and sharing as a file."
                      : "Structured post metadata, notes, and ordered items."}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="func-option">
            <input
              type="checkbox"
              checked={includeText}
              onChange={(event) => setIncludeText(event.target.checked)}
            />
            <span>
              <strong>Include full post text</strong>
              <small>Plain text without images or rich MDX formatting.</small>
            </span>
          </label>
          <div className="func-actions">
            <button onClick={() => setStep(1)}>← Arrange posts</button>
            <button
              className="primary"
              disabled={!title.trim()}
              onClick={() => setStep(3)}
            >
              Review collection →
            </button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className="func-kicker">Ready to assemble</p>
          <h2>{title}</h2>
          <p className="func-muted">
            {items.length} posts · {format === "json" ? "JSON" : "Markdown"} ·{" "}
            {includeText ? "Full post text" : "Links and notes"}
          </p>
          <ol className="func-review">
            {items.map((item) => (
              <li key={item.slug}>
                <strong>
                  {posts.find((post) => post.slug === item.slug)?.title}
                </strong>
                {item.note && <p>{item.note}</p>}
              </li>
            ))}
          </ol>
          <div className="func-actions">
            <button onClick={() => setStep(2)}>← Edit format</button>
            <button className="primary" onClick={generate}>
              Create collection →
            </button>
          </div>
        </>
      )}
      {step === 4 && result && (
        <section aria-label="Completed collection">
          <p className="func-kicker">Your collection</p>
          <h2>{result.title}</h2>
          <p className="func-muted">
            {result.items.length} posts · approximately {result.totalMinutes}{" "}
            minutes
          </p>
          <ol className="func-review">
            {result.items.map((item) => (
              <li key={item.slug}>
                <a href={item.slug}>{item.title} ↗</a>
                <p className="func-caption">{item.minutes} min read</p>
                {item.note && <p>{item.note}</p>}
              </li>
            ))}
          </ol>
          <div className="func-inline">
            <button
              className="primary"
              onClick={() =>
                download(result.content, result.filename, result.mimeType)
              }
            >
              Download {result.input.format === "json" ? "JSON" : "Markdown"} ↓
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.setItem(
                    "blog:collection:v1",
                    JSON.stringify(result.input),
                  );
                  setNotice(
                    "Saved in this browser. This replaces the previously saved collection.",
                  );
                } catch {
                  setError(
                    "Browser storage is unavailable. Download the collection to keep it.",
                  );
                }
              }}
            >
              Save in this browser
            </button>
            <button
              onClick={() => {
                setStep(0);
                setNotice("");
              }}
            >
              Edit collection
            </button>
          </div>
          <details className="func-export">
            <summary>Preview export</summary>
            <pre>{result.content}</pre>
          </details>
        </section>
      )}
    </>
  );
}
