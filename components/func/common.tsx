"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/func/core";

export function Steps({
  labels,
  current,
}: {
  labels: string[];
  current: number;
}) {
  return (
    <ol className="func-steps" aria-label="Progress">
      {labels.map((label, index) => (
        <li key={label} aria-current={current === index ? "step" : undefined}>
          <span>{index < current ? "✓" : `0${index + 1}`}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export function PostPicker({
  posts,
  selected,
  max,
  onToggle,
}: {
  posts: BlogPost[];
  selected: string[];
  max: number;
  onToggle: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [length, setLength] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const filtered = posts
    .filter(
      (post) =>
        (!year || post.date.startsWith(year)) &&
        (!selectedOnly || selected.includes(post.slug)) &&
        (!length ||
          (length === "short"
            ? post.minutes <= 5
            : length === "medium"
              ? post.minutes > 5 && post.minutes <= 10
              : post.minutes > 10)) &&
        `${post.title} ${post.description} ${post.text}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.date.localeCompare(b.date)
        : sort === "shortest"
          ? a.minutes - b.minutes
          : sort === "title"
            ? a.title.localeCompare(b.title)
            : b.date.localeCompare(a.date),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, pages - 1);
  const selectedPosts = selected.flatMap(
    (slug) => posts.find((post) => post.slug === slug) ?? [],
  );
  function resetFilters() {
    setQuery("");
    setYear("");
    setLength("");
    setSelectedOnly(false);
    setSort("newest");
    setPage(0);
  }
  return (
    <div className="func-library">
      <div className="func-library-main">
        <div className="func-library-toolbar">
          <label className="func-grow">
            Search the archive
            <input
              value={query}
              maxLength={200}
              placeholder="Search titles and post content"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <button
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            Filters{year || length ? " •" : ""}
          </button>
        </div>
        {filtersOpen && (
          <div className="func-filter-panel">
            <div className="func-filters">
              <label>
                Published
                <select
                  value={year}
                  onChange={(event) => {
                    setYear(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">All years</option>
                  {Array.from(
                    new Set(posts.map((post) => post.date.slice(0, 4))),
                  ).map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select>
              </label>
              <label>
                Reading time
                <select
                  value={length}
                  onChange={(event) => {
                    setLength(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Any length</option>
                  <option value="short">5 minutes or less</option>
                  <option value="medium">6–10 minutes</option>
                  <option value="long">Over 10 minutes</option>
                </select>
              </label>
            </div>
            <button className="func-text-button" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        )}
        <div className="func-result-toolbar">
          <div className="func-inline">
            <button
              aria-pressed={!selectedOnly}
              onClick={() => {
                setSelectedOnly(false);
                setPage(0);
              }}
            >
              All posts
            </button>
            <button
              aria-pressed={selectedOnly}
              onClick={() => {
                setSelectedOnly(true);
                setPage(0);
              }}
            >
              Selected ({selected.length})
            </button>
          </div>
          <label>
            Sort by
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(0);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="shortest">Shortest read</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
        <p className="func-caption" role="status">
          {filtered.length} posts found
        </p>
        <div className="func-posts">
          {filtered
            .slice(currentPage * 5, (currentPage + 1) * 5)
            .map((post) => (
              <article
                key={post.slug}
                className={selected.includes(post.slug) ? "is-selected" : ""}
              >
                <div className="func-post-heading">
                  <div>
                    <p className="func-kicker">
                      {post.date.slice(0, 10)} · {post.minutes} min read
                    </p>
                    <h3>{post.title}</h3>
                  </div>
                  {selected.includes(post.slug) && (
                    <span className="func-selected-badge">Added</span>
                  )}
                </div>
                <p className="func-post-description">
                  {post.description || post.text.slice(0, 120)}
                </p>
                <button
                  className="func-text-button"
                  aria-expanded={open === post.slug}
                  onClick={() => setOpen(open === post.slug ? null : post.slug)}
                >
                  {open === post.slug ? "Close details" : "Review post"}
                </button>
                {open === post.slug && (
                  <div className="func-post-detail">
                    <p className="func-kicker">From the post</p>
                    <p>
                      {post.text.slice(0, 500)}
                      {post.text.length > 500 ? "…" : ""}
                    </p>
                    <p className="func-caption">
                      {post.words.toLocaleString()} words ·{" "}
                      <a href={post.slug} target="_blank" rel="noreferrer">
                        Read original ↗
                      </a>
                    </p>
                    <button
                      disabled={
                        !selected.includes(post.slug) && selected.length >= max
                      }
                      onClick={() => onToggle(post.slug)}
                    >
                      {selected.includes(post.slug)
                        ? "Remove from selection"
                        : "Add to selection"}
                    </button>
                  </div>
                )}
              </article>
            ))}
        </div>
        {filtered.length === 0 && (
          <div className="func-empty">
            <p>No posts match. Try another search or year.</p>
            <button className="func-text-button" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )}
        <div className="func-actions">
          <button
            disabled={currentPage === 0}
            onClick={() => {
              setPage(currentPage - 1);
              setOpen(null);
            }}
          >
            Previous page
          </button>
          <span className="func-caption">
            Page {currentPage + 1} of {pages}
          </span>
          <button
            disabled={currentPage + 1 >= pages}
            onClick={() => {
              setPage(currentPage + 1);
              setOpen(null);
            }}
          >
            Next page
          </button>
        </div>
      </div>
      <aside className="func-selection">
        <p className="func-kicker">Current selection</p>
        <h3>
          {selected.length} of {max} posts
        </h3>
        {selected.length ? (
          <>
            <p className="func-caption">
              {selectedPosts.reduce((sum, post) => sum + post.minutes, 0)}{" "}
              minutes total reading time
            </p>
            <ol>
              {selectedPosts.map((post) => (
                <li key={post.slug}>
                  <strong>{post.title}</strong>
                  <p className="func-caption">{post.minutes} min read</p>
                  <button
                    className="func-text-button"
                    aria-label={`Remove ${post.title}`}
                    onClick={() => onToggle(post.slug)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="func-muted">
            Your selected posts will appear here. Open a post to review it and
            add it to your workspace.
          </p>
        )}
      </aside>
    </div>
  );
}

export function download(content: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: `${mimeType};charset=utf-8` }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
