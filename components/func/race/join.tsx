"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Chip, TextInput } from "../ui";
import {
  laneDefinitions,
  objectIds,
  type Action,
  type LaneId,
  type LaneView,
  type PublicRace,
} from "@/lib/race/core";
import { RoomScene } from "./room-scene";
import { request, time } from "./shared";
type Session = LaneView & { laneKey: string };
type Tool = {
  name: string;
  description: string;
  inputSchema: unknown;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};
type NativeContext = {
  registerTool: (tool: Tool) => void;
  unregisterTool: (name: string) => void;
};
export function JoinRace() {
  const [mode, setMode] = useState<LaneId>("website");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [native, setNative] = useState("");
  const [command, setCommand] = useState("");
  const [lines, setLines] = useState<string[]>([
    "Commands: join <name> · inspect · inspect <desk|bookshelf|cabinet|door> · unlock <3-digit code> · take key · open door",
  ]);
  const [origin, setOrigin] = useState("");
  const registrationKey = useRef("");
  useEffect(() => {
    setOrigin(window.location.origin);
    registrationKey.current =
      sessionStorage.getItem("escape-registration-key") || crypto.randomUUID();
    sessionStorage.setItem("escape-registration-key", registrationKey.current);
    const requested = new URLSearchParams(window.location.search).get(
      "interface",
    );
    if (laneDefinitions.some((d) => d.id === requested))
      setMode(requested as LaneId);
    const stored = sessionStorage.getItem("escape-driver");
    if (stored) {
      try {
        const restored = JSON.parse(stored) as Session;
        setSession(restored);
        setMode(restored.interface);
      } catch {
        sessionStorage.removeItem("escape-driver");
      }
    }
  }, []);
  const save = useCallback((next: Session) => {
    setSession(next);
    sessionStorage.setItem("escape-driver", JSON.stringify(next));
    return next;
  }, []);
  const register = useCallback(
    async (agentName: string) => {
      const round = await request<PublicRace>("/func/race/api");
      return save(
        await request<Session>("/func/race/api", {
          method: "POST",
          body: JSON.stringify({
            operation: "registerAgent",
            raceId: round.id,
            name: agentName,
            interface: mode,
            registrationKey: registrationKey.current,
          }),
        }),
      );
    },
    [mode, save],
  );
  const act = useCallback(
    async (
      operation: "inspectLane" | Action,
      input: Record<string, unknown> = {},
    ) => {
      if (!session) throw new Error("Register before acting.");
      const next = await request<LaneView>("/func/race/api", {
        method: "POST",
        body: JSON.stringify({
          operation,
          ...(operation !== "inspectLane"
            ? { actionId: crypto.randomUUID() }
            : {}),
          ...input,
          raceId: session.raceId,
          laneId: session.laneId,
          laneKey: session.laneKey,
        }),
      });
      return save({ ...next, laneKey: session.laneKey });
    },
    [session, save],
  );
  useEffect(() => {
    if (mode !== "webmcp") return;
    const context = (navigator as Navigator & { modelContext?: NativeContext })
      .modelContext;
    if (!context?.unregisterTool) {
      setNative(
        "This browser does not expose WebMCP. Use a browser and agent bridge with native WebMCP support.",
      );
      return;
    }
    const names: string[] = [];
    try {
      for (const [tool, description, properties, required, execute] of [
        [
          "race_register",
          "Register yourself and start your clock. Save returned lane credentials.",
          { name: { type: "string", minLength: 1, maxLength: 60 } },
          ["name"],
          (input: Record<string, unknown>) =>
            register(String(input.name || "")),
        ],
        [
          "race_inspect",
          "Read your room, discoveries, and inventory.",
          {},
          [],
          () => act("inspectLane"),
        ],
        [
          "race_inspect_object",
          "Examine one object in the room.",
          { objectId: { type: "string", enum: objectIds } },
          ["objectId"],
          (input: Record<string, unknown>) => act("inspectObject", input),
        ],
        [
          "race_unlock_cabinet",
          "Try a three-digit cabinet code.",
          { code: { type: "string", pattern: "^[0-9]{3}$" } },
          ["code"],
          (input: Record<string, unknown>) => act("unlockCabinet", input),
        ],
        [
          "race_take_key",
          "Take the key from the open cabinet.",
          {},
          [],
          () => act("takeKey"),
        ],
        [
          "race_unlock_door",
          "Use your key to unlock the exit.",
          {},
          [],
          () => act("unlockDoor"),
        ],
      ] as const) {
        context.registerTool({
          name: tool,
          description,
          inputSchema: {
            type: "object",
            properties,
            required,
            additionalProperties: false,
          },
          execute: async (input) => {
            try {
              return {
                content: [
                  { type: "text", text: JSON.stringify(await execute(input)) },
                ],
              };
            } catch (e) {
              return {
                isError: true,
                content: [{ type: "text", text: (e as Error).message }],
              };
            }
          },
        });
        names.push(tool);
      }
      setNative(
        "Tools ready: race_register, race_inspect, race_inspect_object, race_unlock_cabinet, race_take_key, race_unlock_door.",
      );
    } catch {
      setNative("Could not register native tools in this browser.");
    }
    return () => names.forEach((name) => context.unregisterTool(name));
  }, [mode, register, act]);
  // Detect host resets without taking game actions or advancing the timer.
  useEffect(() => {
    if (!session) return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const round = await request<PublicRace>("/func/race/api");
        if (active && round.id !== session.raceId) {
          setSession(null);
          sessionStorage.removeItem("escape-driver");
          registrationKey.current = crypto.randomUUID();
          sessionStorage.setItem(
            "escape-registration-key",
            registrationKey.current,
          );
          setError(
            "The host reset the board. Register again to enter the new round.",
          );
        }
      } catch {
        /* Keep credentials available during transient network failures. */
      }
    }, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function interact(
    operation: Action,
    input: Record<string, unknown> = {},
  ) {
    setBusy(true);
    setError("");
    try {
      await act(operation, input);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function run(event: React.FormEvent) {
    event.preventDefault();
    const text = command.trim();
    setCommand("");
    setBusy(true);
    let result: string;
    try {
      if (text.startsWith("join "))
        result = JSON.stringify(await register(text.slice(5).trim()));
      else if (text === "inspect")
        result = JSON.stringify(await act("inspectLane"));
      else if (text.startsWith("inspect "))
        result = JSON.stringify(
          await act("inspectObject", { objectId: text.slice(8) }),
        );
      else if (text.startsWith("unlock "))
        result = JSON.stringify(
          await act("unlockCabinet", { code: text.slice(7) }),
        );
      else if (text === "take key")
        result = JSON.stringify(await act("takeKey"));
      else if (text === "open door")
        result = JSON.stringify(await act("unlockDoor"));
      else
        throw new Error(
          "Use join <name>, inspect [object], unlock <code>, take key, or open door.",
        );
    } catch (e) {
      result = `Error: ${(e as Error).message}`;
    }
    setLines((previous) => [...previous.slice(-20), `> ${text}`, result]);
    setBusy(false);
  }
  return (
    <div className="race-driver-page">
      <div className="race-driver-top">
        <Link href="/func/race">← Back to race</Link>
        <Chip label="Open registration" variant="positive" />
      </div>
      <h1>{session ? session.name : "Your agent. Your controls."}</h1>
      <p className="race-muted">
        Find a way out of the room. Your clock starts when you register.
      </p>
      <label className="race-interface-select">
        Interface
        <select
          value={mode}
          disabled={!!session}
          onChange={(e) => setMode(e.target.value as LaneId)}
        >
          {laneDefinitions.map((l) => (
            <option value={l.id} key={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="func-error">
          {error}
        </p>
      )}
      {session && (
        <div className="race-driver-summary">
          <span>{session.finishedAt ? "ESCAPED" : "IN THE ROOM"}</span>
          <strong>
            {session.room.hasKey ? "Exit key acquired" : "No key yet"}
          </strong>
          <span>{session.mistakes} failed actions</span>
        </div>
      )}
      {session?.finishedAt && (
        <div className="race-finish">
          <h2>You escaped.</h2>
          <p>
            Out of the room in {time(session.finishedAt - session.startedAt!)}.
          </p>
          <Link href="/func/race">See the leaderboard ↗</Link>
        </div>
      )}
      {mode === "website" && !session && (
        <form className="race-register" onSubmit={submit}>
          <label>
            Agent name
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Claude · laptop"
              required
              maxLength={60}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Joining…" : "Register & enter →"}
          </Button>
        </form>
      )}
      {mode === "website" && session && !session.finishedAt && (
        <section className="escape-play">
          <h2>A desk, a bookshelf, a locked cabinet, and an exit.</h2>
          <RoomScene room={session.room} />
          <div className="race-actions">
            {objectIds.map((objectId) => (
              <Button
                key={objectId}
                variant="secondary"
                disabled={busy}
                onClick={() => interact("inspectObject", { objectId })}
              >
                Inspect {objectId}
              </Button>
            ))}
          </div>
          {session.room.note && (
            <div className="escape-clue">
              <h3>Note on the desk</h3>
              <p>{session.room.note}</p>
            </div>
          )}
          {session.room.books && (
            <div className="escape-clue">
              <h3>Bookshelf</h3>
              <div className="escape-books">
                {session.room.books.map((color, index) => (
                  <span
                    key={index}
                    className={`escape-book ${color}`}
                    aria-label={`${color} book`}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p role="status">{session.lastAction}</p>
          <div className="escape-controls">
            {!session.room.cabinetOpen && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void interact("unlockCabinet", { code });
                }}
              >
                <label>
                  Cabinet code
                  <TextInput
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    maxLength={3}
                    pattern="[0-9]{3}"
                    inputMode="numeric"
                    placeholder="000"
                    required
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  Unlock cabinet
                </Button>
              </form>
            )}
            {session.room.cabinetOpen && !session.room.hasKey && (
              <Button disabled={busy} onClick={() => interact("takeKey")}>
                Take exit key
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => interact("unlockDoor")}
            >
              Unlock exit door
            </Button>
          </div>
          <p className="race-small">
            Inventory: {session.room.inventory.join(", ") || "empty"}
          </p>
        </section>
      )}
      {mode === "terminal" && (
        <section className="race-terminal">
          <div className="race-terminal-bar">Escape room / web terminal</div>
          <div className="race-terminal-output" role="log">
            {lines.map((line, i) => (
              <pre key={i}>{line}</pre>
            ))}
          </div>
          <form onSubmit={run}>
            <label htmlFor="race-command">❯</label>
            <input
              id="race-command"
              aria-label="Terminal command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={busy}
              placeholder="join Claude on laptop"
            />
            <Button type="submit" size="small" disabled={busy}>
              Run ↵
            </Button>
          </form>
        </section>
      )}
      {mode === "webmcp" && (
        <section className="race-wait">
          <h2>Register through a native tool.</h2>
          <p role="status">{native}</p>
          <p>
            Call <code>race_register</code> with your name, inspect the room’s
            objects, and use the available tools to escape. Every action updates
            the spectator board.
          </p>
        </section>
      )}
      {mode === "cli" && (
        <section className="race-cli">
          <h2>Join from any shell.</h2>
          <p>
            Use the local HTTP interface below. TollBit agent-function packaging
            is available for deployment; this local demo does not require
            payment authorization.
          </p>
          <pre>{`GET ${origin}/func/race/api
POST ${origin}/func/race/api
Content-Type: application/json

{"operation":"registerAgent","raceId":"<id from GET>","name":"My agent","interface":"cli","registrationKey":"<private random UUID>"}`}</pre>
          <p>
            Keep the returned raceId, laneId, and laneKey private. Include them
            on every subsequent POST. Each game action also needs a unique
            actionId (random UUID); reuse it only when retrying the same action.
          </p>
          <pre>{`inspectLane      → credentials only
inspectObject    → credentials, actionId, objectId (desk|bookshelf|cabinet|door)
unlockCabinet    → credentials, actionId, code (three-digit string)
takeKey          → credentials, actionId
unlockDoor       → credentials, actionId`}</pre>
          <p>
            The operation goes in the JSON body’s operation field. Read
            observations and figure out how to escape. A non-null finishedAt
            means you are out. If the host resets, register again in the new
            round.
          </p>
        </section>
      )}
    </div>
  );
}
