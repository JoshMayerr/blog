"use client";
import { useEffect, useState } from "react";
import { BookOpen, Check, Users, RotateCcw } from "lucide-react";
import { request, time } from "../race/shared";
import type { PublicSession } from "@/lib/book-race/core";
import "./spectator.css";
const methods: Record<string, string> = {
  website: "Website",
  terminal: "Web terminal",
  cli: "CLI",
  webmcp: "Web terminal + WebMCP",
  discovered_cli: "Discovered CLI",
  preinstalled_cli: "Preinstalled CLI",
};
export function BookSpectator() {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const state = await request<PublicSession>("/func/race/api", {
          signal: controller.signal,
        });
        if (active) {
          setSession(state);
          setError("");
          setSelected((id) =>
            state.participants.some((p) => p.id === id) ? id : "",
          );
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) timer = setTimeout(poll, 1200);
      }
    }
    void poll();
    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);
  async function reset() {
    if (!session) return;
    setResetting(true);
    try {
      setSession(
        await request<PublicSession>("/func/race/api", {
          method: "POST",
          body: JSON.stringify({
            operation: "reset",
            sessionId: session.sessionId,
          }),
        }),
      );
      setConfirmReset(false);
      setSelected("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResetting(false);
    }
  }
  const players = session?.participants || [];
  const ranked = players.filter(p => p.submission?.grading === "correct")
    .sort((a,b) => (a.submission!.submittedAt-a.joinedAt) - (b.submission!.submittedAt-b.joinedAt));
  const events = (session?.events || [])
    .filter((e) => !selected || e.participantId === selected)
    .slice(-150)
    .reverse();
  const completed = players.filter((p) => p.submission).length;
  return (
    <div className="book-spectator">
      <div className="book-party-shape book-party-circle" aria-hidden />
      <div className="book-party-shape book-party-square" aria-hidden />
      <div className="book-board-content">
        <div className="book-roster-heading">
          <h1>Loaded agents</h1>
          <span>
            <Users size={18} />
            {players.length} {players.length === 1 ? "agent" : "agents"}
            {completed > 0 && ` · ${completed} submitted`}
          </span>
        </div>
        {!players.length ? (
          <div className="book-empty">
            <div className="book-empty-icons" aria-hidden>
              <span>▲</span>
              <span>◆</span>
              <span>●</span>
              <span>■</span>
            </div>
            <h2>Ready when you are</h2>
            <p>
              Agents appear here as soon as they register.
              <br />
              Each agent’s timer starts when they join.
            </p>
          </div>
        ) : (
          <section className="book-agent-grid" aria-label="Agents">
            {players.map((p, i) => (
              <article
                key={p.id}
                className={`book-agent-card book-color-${i % 4} ${selected === p.id ? "book-agent-selected" : ""}`}
              >
                <button
                  className="book-agent-heading"
                  onClick={() => setSelected(selected === p.id ? "" : p.id)}
                  aria-pressed={selected === p.id}
                  aria-label={`Filter activity for ${p.name}`}
                >
                  <span className="book-avatar" aria-hidden>
                    {["▲", "◆", "●", "■"][i % 4]}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{methods[p.interface] || p.interface}</small>
                  </span>
                </button>
                <div className="book-agent-status">
                  <span>
                    {p.submission ? (
                      <>
                        <Check size={16} />
                        {p.submission.grading === "correct" ? "Success" : "Incorrect"}
                      </>
                    ) : (
                      <>
                        <BookOpen size={16} />
                        Page {p.currentPage}
                      </>
                    )}
                  </span>
                  <strong>
                    {time(
                      (p.submission?.submittedAt || now || p.joinedAt) -
                        p.joinedAt,
                    )}
                  </strong>
                </div>
                <p className="book-last-action">{p.lastAction}</p>
                {p.submission && "answer" in p.submission && (
                  <div className="book-submission">
                    <strong>{p.submission.answer}</strong>
                    <small>Answer {p.submission.grading}</small>
                    {p.submission.grading === "correct" && <p>Successful finish #{ranked.findIndex(x => x.id === p.id) + 1}</p>}
                  </div>
                )}
                {p.findings.length > 0 && (
                  <details className="book-findings">
                    <summary>
                      {p.findings.length} saved{" "}
                      {p.findings.length === 1 ? "note" : "notes"}
                    </summary>
                    <ul>
                      {p.findings.map((f) => (
                        <li key={f.id}>
                          {f.label}:{" "}
                          <strong>
                            {f.value} {f.unit}
                          </strong>{" "}
                          <small>· p. {f.page}</small>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            ))}
          </section>
        )}
        <section className="book-log" aria-labelledby="book-log-title">
          <div className="book-log-header">
            <h2 id="book-log-title">Live activity</h2>
            <select
              aria-label="Agent"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">All agents</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="book-log-scroll">
            {events.length ? (
              <ol>
                {events.map((e) => {
                  const p = players.find((p) => p.id === e.participantId);
                  return (
                    <li key={e.id}>
                      <time>+{time(e.at - (p?.joinedAt || e.at))}</time>
                      <strong>{p?.name || "Agent"}</strong>
                      <span>{e.message}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="book-log-empty">
                The first page turn starts the story.
              </p>
            )}
          </div>
        </section>
        {error && (
          <p role="alert" className="book-alert">
            {error}
          </p>
        )}
        <footer className="book-board-footer">
          <button onClick={() => setConfirmReset(!confirmReset)}>
            <RotateCcw size={15} />
            Reset
          </button>
        </footer>
        {confirmReset && (
          <div
            className="book-reset-confirm"
            role="dialog"
            aria-label="Reset the race"
          >
            <p>Clear the board and let everyone register again?</p>
            <button disabled={resetting} onClick={() => void reset()}>
              Confirm reset
            </button>
            <button onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
