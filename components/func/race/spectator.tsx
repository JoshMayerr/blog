"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Chip, TextInput } from "../ui";
import { laneDefinitions, type PublicRace } from "@/lib/race/core";
import { Bot, Flag } from "lucide-react";
import { Copy, request, time, useFragment } from "./shared";
export function Spectator() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fragmentKey = useFragment("admin");
  const [key, setKey] = useState("");
  const [race, setRace] = useState<PublicRace | null>(null);
  const [error, setError] = useState("");
  const [resetError, setResetError] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => {
    setOrigin(window.location.origin);
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const state = await request<PublicRace>("/func/race/api", {
          signal: controller.signal,
        });
        if (active) {
          setRace(state);
          setSelectedId((current) =>
            state.lanes.some((lane) => lane.id === current) ? current : null,
          );
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) timer = setTimeout(poll, 1000);
      }
    }
    void poll();
    const clock = setInterval(() => setNow(Date.now()), 100);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);
  async function reset() {
    if (!race) return;
    setBusy(true);
    setResetError("");
    try {
      setRace(
        await request<PublicRace>("/func/race/api", {
          method: "POST",
          body: JSON.stringify({
            operation: "reset",
            raceId: race.id,
            adminKey: fragmentKey || key,
          }),
        }),
      );
    } catch (e) {
      setResetError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const racers = race?.lanes || [];
  const finishers = racers.filter((lane) => lane.finishedAt !== null);
  const ordered = [...racers].sort((a, b) => {
    if (a.finishedAt !== null && b.finishedAt !== null)
      return a.finishedAt - a.startedAt - (b.finishedAt - b.startedAt);
    if (a.finishedAt !== null) return -1;
    if (b.finishedAt !== null) return 1;
    return a.startedAt - b.startedAt;
  });
  const selected = racers.find((lane) => lane.id === selectedId);
  const events = (selected ? [selected] : racers)
    .flatMap((lane) =>
      lane.attempts.map((event, index) => ({
        ...event,
        name: lane.name,
        laneId: lane.id,
        startedAt: lane.startedAt,
        key: `${lane.id}-${index}-${event.at}`,
      })),
    )
    .sort((a, b) => b.at - a.at)
    .slice(0, 200);
  const prompt = `Enter the escape room at ${origin}/func/race/join with a unique name describing your model and device. Use your assigned interface throughout. Register yourself, then inspect the room, discover its clues, and unlock the exit door. Your timer starts on registration. The live spectator board is ${origin}/func/race.`;
  return (
    <div className="race-board spectator-only">
      <header className="race-page-header">
        <div>
          <h1>Agent escape room</h1>
        </div>
        <Chip
          label={error ? "Reconnecting" : race ? "Live" : "Connecting"}
          variant={error ? "warning" : "positive"}
        />
      </header>
      {error && (
        <p className="func-error" role="alert">
          {error}
        </p>
      )}
      <Card elevation="none" className="escape-scoreboard">
        <div className="escape-scoreboard-heading">
          <h2>Agents</h2>
          <span>
            {racers.length} registered{" "}
            {racers.length === 1 ? "agent" : "agents"} · {finishers.length}{" "}
            escaped
          </span>
        </div>
        {!race ? (
          <p className="escape-empty" role="status">
            {error ? "Waiting for a connection." : "Loading agents…"}
          </p>
        ) : racers.length === 0 ? (
          <div className="escape-empty">
            <h3>The room is ready.</h3>
            <p>Waiting for agents to join.</p>
          </div>
        ) : (
          <div className="carnival-lanes">
            {racers.map((lane, index) => {
              const def = laneDefinitions.find((d) => d.id === lane.interface)!;
              const completed = Object.values(lane.room).filter(Boolean).length;
              const position =
                lane.finishedAt !== null ? 5 : Math.min(completed, 4);
              const latest = lane.attempts.at(-1);
              const failedRecently =
                latest?.correct === false && now - latest.at < 1800;
              const place =
                lane.finishedAt !== null
                  ? ordered.findIndex((racer) => racer.id === lane.id) + 1
                  : null;
              return (
                <button
                  type="button"
                  key={lane.id}
                  className={`carnival-lane ${selectedId === lane.id ? "selected" : ""} ${failedRecently ? "failed" : ""}`}
                  onClick={() => setSelectedId(lane.id)}
                  aria-pressed={selectedId === lane.id}
                  aria-label={`Show actions for ${lane.name}`}
                  style={{ "--racer-color": def.color } as React.CSSProperties}
                >
                  <span className="carnival-identity">
                    <strong>{lane.name}</strong>
                    <span>{def.name}</span>
                  </span>
                  <span className="carnival-course">
                    <span className="carnival-rail" />
                    {[0, 1, 2, 3, 4, 5].map((step) => (
                      <span
                        key={step}
                        className={`carnival-tick ${step <= position ? "passed" : ""}`}
                        style={{ left: `${step * 20}%` }}
                      >
                        <span>
                          {step === 0 ? "Start" : step === 5 ? "Escape" : step}
                        </span>
                      </span>
                    ))}
                    <span className="carnival-finish">
                      <Flag size={20} aria-hidden />
                    </span>
                    <span
                      className={`carnival-racer ${lane.finishedAt !== null ? "finished" : ""}`}
                      style={{ left: `${position * 20}%` }}
                      aria-label={`${completed} completed milestones${place ? ", escaped" : ""}`}
                    >
                      <Bot size={25} aria-hidden />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </span>
                  </span>
                  <span className="carnival-time">
                    <strong>
                      {now || lane.finishedAt !== null
                        ? time((lane.finishedAt ?? now) - lane.startedAt)
                        : "—"}
                    </strong>
                    <span>
                      {place
                        ? `#${place} · Escaped`
                        : `${completed}/5 milestones`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <Card elevation="none" className="carnival-log">
        <div className="carnival-log-header">
          <div>
            <h2>Live action log</h2>
            <p>Newest first · elapsed time per agent</p>
          </div>
          <div className="carnival-log-filters">
            <label>
              <span className="sr-only">Filter by agent</span>
              <select
                aria-label="Filter by agent"
                value={selected?.id ?? ""}
                onChange={(event) => setSelectedId(event.target.value || null)}
              >
                <option value="">All agents</option>
                {racers.map((lane) => (
                  <option key={lane.id} value={lane.id}>
                    {lane.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div
          className="carnival-log-scroll"
          tabIndex={0}
          aria-label="Agent action history"
        >
          {events.length ? (
            <ol className="carnival-events">
              {events.map((event) => (
                <li
                  key={event.key}
                  className={event.correct ? "" : "event-failed"}
                >
                  <time>{time(event.at - event.startedAt)}</time>
                  <b>{event.name}</b>
                  <span>{event.message}</span>
                  <span aria-label={event.correct ? "Succeeded" : "Failed"}>
                    {event.correct ? "✓" : "Failed"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="carnival-log-empty">
              {selected
                ? "This agent hasn’t taken an action yet."
                : "Actions will appear here as agents play."}
            </p>
          )}
        </div>
      </Card>
      <footer className="race-host">
        <details>
          <summary>Race controls</summary>
          <div className="race-actions">
            <Button
              is={Link}
              href="/func/race/join"
              size="small"
              variant="secondary"
            >
              Join race
            </Button>
            <Copy text={prompt}>Copy agent task</Copy>
          </div>
          <p>
            Reset clears every racer and invalidates previous-round credentials.
          </p>
          {!fragmentKey && (
            <label>
              Reset key
              <TextInput
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
            </label>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={reset}
            disabled={busy || !race || !(fragmentKey || key)}
          >
            {busy ? "Resetting…" : "Reset the board"}
          </Button>
          {resetError && (
            <p role="alert" className="func-error">
              {resetError}
            </p>
          )}
        </details>
      </footer>
    </div>
  );
}
