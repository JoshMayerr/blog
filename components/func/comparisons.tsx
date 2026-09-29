"use client";

import { useCallback, useState } from "react";
import {
  comparePosts,
  dimensions,
  type BlogPost,
  type ComparisonResult,
  type Dimension,
} from "@/lib/func/core";
import { download, PostPicker, Steps } from "./common";
const labels: Record<Dimension, [string, string]> = {
  overview: [
    "At a glance",
    "Publication date, length, reading time, and link count.",
  ],
  terms: ["Shared words", "Frequent words found in every selected post."],
  links: [
    "Shared references",
    "The same URLs linked from two or more selected posts.",
  ],
  text: [
    "Side-by-side text",
    "Read the full plain text of each post alongside the others.",
  ],
};
export function Comparisons({ posts }: { posts: BlogPost[] }) {
  const [step, setStep] = useState(0);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [fields, setFields] = useState<Dimension[]>(["overview"]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState("");
  const execute = useCallback(
    (input: unknown) => {
      const compared = comparePosts(input, posts);
      setSlugs(compared.input.slugs);
      setFields(compared.input.dimensions);
      setResult(compared);
      setStep(3);
      setError("");
      return compared;
    },
    [posts],
  );
  return (
    <>
      <Steps
        labels={["Choose", "Configure", "Review", "Comparison"]}
        current={step}
      />
      {error && (
        <p role="alert" className="func-error">
          {error}
        </p>
      )}
      {step === 0 && (
        <>
          <h2>Pick a few to put side by side.</h2>
          <p className="func-muted">
            Review and add 2–4 posts. Selection order becomes column order.
          </p>
          <PostPicker
            posts={posts}
            selected={slugs}
            max={4}
            onToggle={(slug) =>
              setSlugs(
                slugs.includes(slug)
                  ? slugs.filter((value) => value !== slug)
                  : [...slugs, slug],
              )
            }
          />
          <div className="func-actions end">
            <button
              className="primary"
              disabled={slugs.length < 2}
              onClick={() => setStep(1)}
            >
              Configure comparison →
            </button>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <h2>What would you like to compare?</h2>
          <p className="func-muted">
            Choose the sections to include in your report.
          </p>
          <fieldset>
            <legend className="sr-only">Comparison sections</legend>
            {dimensions.map((field) => (
              <label className="func-option" key={field}>
                <input
                  type="checkbox"
                  checked={fields.includes(field)}
                  onChange={() =>
                    setFields(
                      fields.includes(field)
                        ? fields.filter((value) => value !== field)
                        : [...fields, field],
                    )
                  }
                />
                <span>
                  <strong>{labels[field][0]}</strong>
                  <small>{labels[field][1]}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="func-actions">
            <button onClick={() => setStep(0)}>← Choose posts</button>
            <button
              className="primary"
              disabled={!fields.length}
              onClick={() => setStep(2)}
            >
              Review choices →
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h2>Ready to compare.</h2>
          <ol className="func-review">
            {slugs.map((slug) => (
              <li key={slug}>
                {posts.find((post) => post.slug === slug)?.title}
              </li>
            ))}
          </ol>
          <p className="func-muted">
            Include: {fields.map((field) => labels[field][0]).join(", ")}.
          </p>
          <div className="func-actions">
            <button onClick={() => setStep(1)}>← Edit sections</button>
            <button
              className="primary"
              onClick={() => {
                try {
                  execute({ slugs, dimensions: fields });
                } catch (error) {
                  setError((error as Error).message);
                }
              }}
            >
              Build comparison →
            </button>
          </div>
        </>
      )}
      {step === 3 && result && (
        <section aria-label="Completed comparison">
          <p className="func-kicker">Your comparison</p>
          <h2>{result.posts.length} posts, side by side.</h2>
          <div className="func-inline">
            <button onClick={() => setStep(0)}>Edit comparison</button>
            <button
              onClick={() =>
                download(
                  JSON.stringify(result, null, 2),
                  "post-comparison.json",
                  "application/json",
                )
              }
            >
              Download report ↓
            </button>
          </div>
          <div className="func-report-posts">
            {result.posts.map((post, i) => (
              <p key={post.slug}>
                <span className="func-number">0{i + 1}</span>{" "}
                <a href={post.slug}>{post.title} ↗</a>
              </p>
            ))}
          </div>
          {result.input.dimensions.includes("overview") && (
            <section className="func-report-section">
              <h3>At a glance</h3>
              <div
                className="func-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Post overview"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Measure</th>
                      {result.posts.map((post, i) => (
                        <th scope="col" key={post.slug}>
                          Post 0{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Published", "date"],
                        ["Words", "words"],
                        ["Minutes to read", "minutes"],
                        ["Unique links", "linkCount"],
                      ] as const
                    ).map(([label, key]) => (
                      <tr key={key}>
                        <th scope="row">{label}</th>
                        {result.posts.map((post) => (
                          <td key={post.slug}>
                            {key === "date"
                              ? post.date?.slice(0, 10)
                              : post[key]?.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {result.input.dimensions.includes("terms") && (
            <section className="func-report-section">
              <h3>Shared words</h3>
              <p className="func-caption">
                Up to 20 words present in every post, ranked by total
                occurrences.
              </p>
              {result.sharedTerms.length ? (
                <div
                  className="func-table-wrap"
                  tabIndex={0}
                  role="region"
                  aria-label="Shared word counts"
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Word</th>
                        {result.posts.map((post, i) => (
                          <th scope="col" key={post.slug}>
                            Post 0{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.sharedTerms.map((row) => (
                        <tr key={row.term}>
                          <th scope="row">{row.term}</th>
                          {row.counts.map((count, i) => (
                            <td key={i}>{count}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="func-empty">
                  No shared words after removing common words.
                </p>
              )}
            </section>
          )}
          {result.input.dimensions.includes("links") && (
            <section className="func-report-section">
              <h3>Shared references</h3>
              {result.sharedLinks.length ? (
                <ul className="func-links">
                  {result.sharedLinks.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.url} ↗
                      </a>
                      <p className="func-caption">
                        In posts{" "}
                        {link.slugs
                          .map(
                            (slug) =>
                              `0${result.input.slugs.indexOf(slug) + 1}`,
                          )
                          .join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="func-empty">No shared URLs among these posts.</p>
              )}
            </section>
          )}
          {result.input.dimensions.includes("text") && (
            <section className="func-report-section">
              <h3>Side-by-side text</h3>
              <div className="func-text-columns">
                {result.posts.map((post, i) => (
                  <article key={post.slug}>
                    <h4>
                      0{i + 1} · {post.title}
                    </h4>
                    <div>{post.text}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
          <p className="func-methodology">{result.methodology}</p>
        </section>
      )}
    </>
  );
}
