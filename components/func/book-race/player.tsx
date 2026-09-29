"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionView } from "@/lib/book-race/core";
import type { BookPage } from "@/lib/book-race/book";
import { BookReader } from "./book-reader";
import "./player.css";

type Credentials = { sessionId: string; participantId: string; token: string };
type Result = SessionView & {
  participantId?: string;
  token?: string;
  page?: BookPage;
  search?: {
    results: { page: number; label: string; title: string; excerpt: string }[];
    nextCursor: number | null;
    total: number;
  };
  matches?: { start: number; end: number; excerpt: string }[];
};
const storageKey = "book-race-player-martin-v1";
function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  return !query || index < 0 ? (
    <>{text}</>
  ) : (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      <Highlight text={text.slice(index + query.length)} query={query} />
    </>
  );
}
async function request(operation: string, input: object = {}): Promise<Result> {
  const response = await fetch("/func/race/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...input }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new RequestError(result.error || "Request failed.", response.status);
  return result;
}
export function BookRacePlayer() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [session, setSession] = useState<SessionView | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [search, setSearch] = useState<Result["search"]>();
  const [matches, setMatches] = useState<Result["matches"]>();
  const [findQuery, setFindQuery] = useState("");
  const [tool, setTool] = useState("");
  const [searchScope, setSearchScope] = useState("book");
  const [searchText, setSearchText] = useState("");
  const query = useRef("");
  const lastPage = useRef(0);
  const revision = useRef(0);
  const inFlight = useRef(0);
  const actionQueue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const participant = session?.participant;
  const active = Boolean(
    participant && session?.phase === "running" && !participant.submission,
  );
  const rejoin = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setCredentials(null);
    setImagesReady(false);
    lastPage.current = 0;
    setError("");
    setTool("");
    setSearch(undefined);
    setMatches(undefined);
    request("getSession")
      .then(setSession)
      .catch(() => setError("Could not load the race."));
  }, []);
  const run = useCallback(
    async (operation: string, input: object = {}) => {
      try {
        setError("");
        revision.current += 1;
        inFlight.current += 1;
        const result = await request(operation, {
          ...credentials,
          requestId: crypto.randomUUID(),
          ...input,
        });
        setSession(result);
        if (result.page) {
          lastPage.current = result.page.page;
        }
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed.");
        return null;
      } finally {
        inFlight.current -= 1;
        revision.current += 1;
      }
    },
    [credentials],
  );
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setCredentials(JSON.parse(saved));
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    request("getSession")
      .then(setSession)
      .catch(() => setError("Could not load the race."));
  }, []);
  useEffect(() => {
    if (!credentials) return;
    let canceled = false;
    const refresh = async () => {
      try {
        if (inFlight.current) return;
        const before = revision.current;
        const result = await request("getSession", credentials);
        if (!canceled && !inFlight.current && before === revision.current)
          setSession(result);
      } catch (e) {
        if (
          !canceled &&
          e instanceof RequestError &&
          [403, 409].includes(e.status)
        ) {
          rejoin();
          return;
        }
        if (!canceled)
          setError(
            e instanceof Error ? e.message : "Could not refresh session.",
          );
      }
    };
    void refresh();
    const timer = setInterval(refresh, 2000);
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }, [credentials, rejoin]);
  useEffect(() => {
    if (!credentials || session?.phase !== "running") return;
    let canceled = false;
    fetch("/func/race/book-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        if (!canceled) setImagesReady(true);
      })
      .catch((e) => {
        if (!canceled) setError(e.message);
      });
    return () => {
      canceled = true;
    };
  }, [credentials, session?.phase]);
  const navigate = useCallback(
    (number: number) => {
      if (!active || number === lastPage.current) return;
      actionQueue.current = actionQueue.current.then(async () => {
        const result = await run("readPage", { page: number });
        if (!result) lastPage.current = 0;
        else setMatches(undefined);
      });
    },
    [active, run],
  );
  async function join(form: FormData) {
    if (!session) return;
    setBusy(true);
    try {
      const result = await request("registerAgent", {
        sessionId: session.sessionId,
        name: form.get("name"),
        interface: "website",
        requestId: crypto.randomUUID(),
      });
      const auth = {
        sessionId: result.sessionId,
        participantId: result.participantId!,
        token: result.token!,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(auth));
      setCredentials(auth);
      setSession(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join.");
    } finally {
      setBusy(false);
    }
  }
  async function searchBook(form?: FormData, cursor?: number) {
    if (form) query.current = String(form.get("query") || "");
    const result = await run("searchBook", {
      query: query.current,
      ...(cursor === undefined ? {} : { cursor }),
    });
    if (result?.search) setSearch(result.search);
  }

  return (
    <div className="research-player research-reader-only">
      {!active && (
        <div className="research-empty-book" aria-hidden="true">
          <div />
        </div>
      )}
      {error && (
        <div role="alert" className="research-error">
          {error}
        </div>
      )}
      {!credentials ? (
        <div className="research-modal-backdrop">
          <section
            className="research-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-title"
          >
            <h1 id="registration-title">Open the book</h1>
            <p>
              Enter your name to begin. Your timer starts when you open the
              book.
            </p>
            <form action={join}>
              <label>
                Your name
                <input
                  name="name"
                  autoFocus
                  required
                  maxLength={60}
                  placeholder="Claude · browser"
                />
              </label>
              <button disabled={busy || !session}>
                {busy ? "Opening…" : "Open book"}
              </button>
            </form>
          </section>
        </div>
      ) : !participant ? (
        <div className="research-modal-backdrop">
          <p className="research-loading">Opening your book…</p>
        </div>
      ) : participant.submission ? (
        <div className="research-modal-backdrop">
          <section className="research-modal" role="status">
            <h1>Answer submitted</h1>
            <p className="research-submitted-time">
              {formatTime(
                participant.submission.submittedAt - participant.joinedAt,
              )}
            </p>
            <p>{participant.submission.answer}</p>
            <p>{participant.submission.grading === "correct" ? "Success! Correct answer." : "Incorrect answer."}</p>
          </section>
        </div>
      ) : (
        <div className="research-workspace">
          <section className="research-book">
            {imagesReady && session?.book ? (
              <BookReader
                title={session.book.title}
                pageCount={session.book.pageCount}
                page={participant.currentPage}
                onPage={navigate}
              />
            ) : (
              <p>Opening book…</p>
            )}
          </section>
          <aside className="research-tools">
            <div className="research-identity">
              <span>{participant.name}</span>
              <time aria-label="Elapsed time">
                {formatTime(clock - participant.joinedAt)}
              </time>
            </div>
            <div
              role="tablist"
              aria-label="Research tools"
              className="research-tabs"
            >
              {[
                ["search", "Search"],
                ["notes", "Notes"],
                ["answer", "Answer"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tool-${id}`}
                  aria-controls={`panel-${id}`}
                  aria-selected={tool === id}
                  onClick={() => setTool(tool === id ? "" : id)}
                >
                  {label}
                  {id === "notes" && participant.findings.length > 0
                    ? ` (${participant.findings.length})`
                    : ""}
                </button>
              ))}
            </div>
            <section
              className="research-card"
              role="tabpanel"
              id="panel-search"
              aria-labelledby="tool-search"
              hidden={tool !== "search"}
            >
              <form
                action={async (form) => {
                  if (searchScope === "book") await searchBook(form);
                  else {
                    const result = await run("findOnPage", {
                      query: searchText,
                    });
                    if (result) {
                      setMatches(result.matches);
                      setFindQuery(searchText);
                    }
                  }
                }}
              >
                <label>
                  Search query
                  <input
                    name="query"
                    required
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Find a phrase or number"
                  />
                </label>
                <div className="research-search-options">
                  <label>
                    Search scope
                    <select
                      aria-label="Search scope"
                      value={searchScope}
                      onChange={(e) => setSearchScope(e.target.value)}
                    >
                      <option value="book">Whole book</option>
                      <option value="page">Current page</option>
                    </select>
                  </label>
                  <button>Search</button>
                </div>
              </form>
              {searchScope === "book" && search && (
                <div aria-live="polite">
                  <p>{search.total} matching pages</p>
                  {search.results.map((item) => (
                    <button
                      className="research-result"
                      key={item.page}
                      onClick={() => navigate(item.page)}
                    >
                      <strong>
                        Page {item.page} · {item.title}
                      </strong>
                      <span>{item.excerpt}</span>
                    </button>
                  ))}
                  {search.nextCursor !== null && (
                    <button
                      onClick={() =>
                        void searchBook(undefined, search.nextCursor!)
                      }
                    >
                      More results
                    </button>
                  )}
                </div>
              )}
              {searchScope === "page" && matches && (
                <div aria-live="polite">
                  <p>{matches.length} matches on this page</p>
                  {matches.map((match, index) => (
                    <p key={index}>
                      <Highlight text={match.excerpt} query={findQuery} />
                    </p>
                  ))}
                </div>
              )}
            </section>
            <section
              className="research-card"
              role="tabpanel"
              id="panel-notes"
              aria-labelledby="tool-notes"
              hidden={tool !== "notes"}
            >
              <p>
                Optional notes. Findings are your claims, not verified facts.
              </p>
              {participant.findings.map((finding) => (
                <div className="research-finding" key={finding.id}>
                  <strong>
                    {finding.label}: {finding.value} {finding.unit}
                  </strong>
                  <button
                    className="research-text-button"
                    onClick={() => navigate(finding.page)}
                  >
                    Page {finding.page}
                  </button>
                  <button
                    onClick={() =>
                      void run("removeFinding", { findingId: finding.id })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <form
                action={async (form) => {
                  await run("saveFinding", {
                    label: form.get("label"),
                    value: form.get("value"),
                    unit: form.get("unit") || "",
                    page: Number(form.get("page")),
                    ...(form.get("excerpt")
                      ? { excerpt: form.get("excerpt") }
                      : {}),
                  });
                }}
              >
                <label>
                  Fact label
                  <input name="label" required maxLength={120} />
                </label>
                <div className="research-two">
                  <label>
                    Value
                    <input name="value" required maxLength={200} />
                  </label>
                  <label>
                    Unit
                    <input name="unit" maxLength={80} />
                  </label>
                </div>
                <label>
                  Source viewer page
                  <input
                    key={participant.currentPage}
                    name="page"
                    type="number"
                    min={1}
                    max={session?.book?.pageCount}
                    defaultValue={participant.currentPage}
                    required
                  />
                </label>
                <label>
                  Excerpt (optional)
                  <textarea name="excerpt" rows={2} />
                </label>
                <button>Save finding</button>
              </form>
            </section>
            <section
              className="research-card"
              role="tabpanel"
              id="panel-answer"
              aria-labelledby="tool-answer"
              hidden={tool !== "answer"}
            >
              <p>
                You can submit once. Submit your final number. A correct answer completes the race.
              </p>
              <form
                action={async (form) => {
                  setBusy(true);
                  await run("submitAnswer", {
                    answer: form.get("answer"),
                  });
                  setBusy(false);
                }}
              >
                <label>
                  Answer
                  <input name="answer" required />
                </label>
                <button disabled={busy}>Submit final answer</button>
              </form>
            </section>
          </aside>
        </div>
      )}
      {!active && (
        <footer>
          Reader powered by{" "}
          <a href="https://github.com/internetarchive/bookreader">
            Internet Archive BookReader
          </a>{" "}
          ·{" "}
          <a href="/vendor/bookreader/LICENSE" download>
            AGPL license
          </a>
        </footer>
      )}
    </div>
  );
}
