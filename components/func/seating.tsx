"use client";

import { useState } from "react";
import {
  planSeating,
  type Guest,
  type SeatingTable,
  type SeatingRule,
  type SeatingResult,
} from "@/lib/func/seating";
import { Steps, download } from "./common";

const sampleNames = [
  "Alex Morgan",
  "Sam Rivera",
  "Jamie Chen",
  "Taylor Brooks",
  "Casey Patel",
  "Jordan Kim",
  "Riley James",
  "Morgan Lee",
  "Avery Davis",
  "Quinn Ellis",
  "Cameron Bell",
  "Drew Parker",
];
export function SeatingPlanner() {
  const [step, setStep] = useState(0);
  const [event, setEvent] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [rules, setRules] = useState<SeatingRule[]>([]);
  const [guestEditor, setGuestEditor] = useState<Guest | null>(null);
  const [tableEditor, setTableEditor] = useState<SeatingTable | null>(null);
  const [ruleEditor, setRuleEditor] = useState<SeatingRule | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SeatingResult | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"tables" | "guests">("tables");
  const [notice, setNotice] = useState("");
  const seats = tables.reduce((sum, table) => sum + table.capacity, 0);
  const name = (id: string) =>
    guests.find((guest) => guest.id === id)?.name ?? id;
  const input = { event, guests, tables, rules };
  function loadExample() {
    setEvent("Friends & neighbors dinner");
    setGuests(sampleNames.map((name, i) => ({ id: `guest-${i + 1}`, name })));
    setTables(
      ["Garden", "Terrace", "Courtyard"].map((name, i) => ({
        id: `table-${i + 1}`,
        name,
        capacity: 4,
      })),
    );
    setRules([
      { type: "together", guestA: "guest-1", guestB: "guest-2" },
      { type: "apart", guestA: "guest-3", guestB: "guest-4" },
    ]);
    setNotice(
      "Example loaded with 12 fictional guests, three tables, and two seating rules.",
    );
    setError("");
  }
  function build() {
    try {
      setResult(planSeating(input));
      setStep(4);
      setError("");
      setNotice("");
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function advance(next: number) {
    setStep(next);
    setError("");
    setNotice("");
    setQuery("");
  }
  return (
    <>
      <Steps
        labels={[
          "Guest list",
          "Tables",
          "Seating rules",
          "Review",
          "Seating plan",
        ]}
        current={step}
      />
      {error && (
        <p role="alert" className="func-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="func-notice">
          {notice}
        </p>
      )}
      {step < 4 && (
        <div className="seating-summary">
          <span>
            <strong>{guests.length}</strong> guests
          </span>
          <span>
            <strong>{tables.length}</strong> tables
          </span>
          <span>
            <strong>{seats}</strong> seats
          </span>
          <span>
            <strong>{rules.length}</strong> rules
          </span>
        </div>
      )}
      {step === 0 && (
        <section>
          <div className="func-section-heading">
            <div>
              <h2>Who’s coming?</h2>
              <p className="func-muted">
                Build your guest list before setting up the room.
              </p>
            </div>
            {!guests.length && (
              <button onClick={loadExample}>Load example event</button>
            )}
          </div>
          <label className="func-field">
            Event name
            <input
              value={event}
              maxLength={120}
              placeholder="e.g. Neighborhood dinner"
              onChange={(e) => setEvent(e.target.value)}
            />
          </label>
          <div className="func-library-toolbar">
            <label className="func-grow">
              Find a guest
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
              />
            </label>
            <button
              disabled={guests.length >= 40}
              onClick={() => {
                setGuestEditor({ id: crypto.randomUUID(), name: "" });
                setError("");
              }}
            >
              Add guest
            </button>
          </div>
          {guestEditor && (
            <form
              className="seating-editor"
              onSubmit={(e) => {
                e.preventDefault();
                const saved = { ...guestEditor, name: guestEditor.name.trim() };
                if (!saved.name) {
                  setError("Enter a guest name.");
                  return;
                }
                setGuests(
                  guests.some((g) => g.id === saved.id)
                    ? guests.map((g) => (g.id === saved.id ? saved : g))
                    : [...guests, saved],
                );
                setGuestEditor(null);
                setError("");
              }}
            >
              <h3>
                {guests.some((g) => g.id === guestEditor.id)
                  ? "Edit guest"
                  : "New guest"}
              </h3>
              <label>
                Guest name
                <input
                  autoFocus
                  required
                  maxLength={80}
                  value={guestEditor.name}
                  onChange={(e) =>
                    setGuestEditor({ ...guestEditor, name: e.target.value })
                  }
                />
              </label>
              <div className="func-inline">
                <button className="primary" type="submit">
                  Save guest
                </button>
                <button type="button" onClick={() => setGuestEditor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="seating-roster">
            {guests
              .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
              .map((guest, i) => (
                <div key={guest.id} className="seating-roster-row">
                  <span className="func-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="func-grow">
                    <strong>{guest.name}</strong>
                    <p className="func-caption">
                      {
                        rules.filter(
                          (r) => r.guestA === guest.id || r.guestB === guest.id,
                        ).length
                      }{" "}
                      seating rules
                    </p>
                  </div>
                  <button
                    aria-label={`Edit ${guest.name}`}
                    onClick={() => setGuestEditor({ ...guest })}
                  >
                    Edit
                  </button>
                  <button
                    aria-label={`Remove ${guest.name}`}
                    onClick={() => {
                      setGuests(guests.filter((g) => g.id !== guest.id));
                      setRules(
                        rules.filter(
                          (r) => r.guestA !== guest.id && r.guestB !== guest.id,
                        ),
                      );
                      if (guestEditor?.id === guest.id) setGuestEditor(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
          {!guests.length && (
            <p className="func-empty">
              No guests yet. Add your first guest or start with the example
              event.
            </p>
          )}
          {!!guests.length &&
            !guests.some((g) =>
              g.name.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="func-empty">No guests match this search.</p>}
          <p className="func-caption">
            Up to 40 guests. Removing a guest also removes their seating rules.
          </p>
          <div className="func-actions end">
            <button
              className="primary"
              disabled={!event.trim() || !guests.length || !!guestEditor}
              onClick={() => advance(1)}
            >
              Set up tables →
            </button>
          </div>
        </section>
      )}
      {step === 1 && (
        <section>
          <div className="func-section-heading">
            <div>
              <h2>Set up the room.</h2>
              <p className="func-muted">
                Name each table and choose how many seats it has.
              </p>
            </div>
            <button
              disabled={tables.length >= 12}
              onClick={() =>
                setTableEditor({
                  id: crypto.randomUUID(),
                  name: `Table ${tables.length + 1}`,
                  capacity: 4,
                })
              }
            >
              Add table
            </button>
          </div>
          {tableEditor && (
            <form
              className="seating-editor"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !tableEditor.name.trim() ||
                  !Number.isInteger(tableEditor.capacity) ||
                  tableEditor.capacity < 1 ||
                  tableEditor.capacity > 20
                ) {
                  setError("Enter a table name and a capacity from 1 to 20.");
                  return;
                }
                const saved = { ...tableEditor, name: tableEditor.name.trim() };
                setTables(
                  tables.some((t) => t.id === saved.id)
                    ? tables.map((t) => (t.id === saved.id ? saved : t))
                    : [...tables, saved],
                );
                setTableEditor(null);
                setError("");
              }}
            >
              <h3>Table details</h3>
              <div className="func-filters">
                <label>
                  Table name
                  <input
                    required
                    maxLength={80}
                    value={tableEditor.name}
                    onChange={(e) =>
                      setTableEditor({ ...tableEditor, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Seats
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={tableEditor.capacity || ""}
                    onChange={(e) =>
                      setTableEditor({
                        ...tableEditor,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="func-inline">
                <button className="primary" type="submit">
                  Save table
                </button>
                <button type="button" onClick={() => setTableEditor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="seating-table-grid">
            {tables.map((table) => (
              <article className="seating-table" key={table.id}>
                <div className="seating-table-icon" aria-hidden="true">
                  {table.capacity}
                </div>
                <h3>{table.name}</h3>
                <p className="func-muted">{table.capacity} seats</p>
                <div className="func-inline">
                  <button
                    aria-label={`Edit ${table.name}`}
                    onClick={() => setTableEditor({ ...table })}
                  >
                    Edit table
                  </button>
                  <button
                    aria-label={`Remove ${table.name}`}
                    onClick={() => {
                      setTables(tables.filter((t) => t.id !== table.id));
                      if (tableEditor?.id === table.id) setTableEditor(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!tables.length && (
            <p className="func-empty">
              Add a table to start planning the room.
            </p>
          )}
          <p role="status" className="func-notice">
            {seats < guests.length
              ? `${guests.length - seats} more seats needed for your guest list.`
              : `${seats - guests.length} spare seats across ${tables.length} tables.`}
          </p>
          <div className="func-actions">
            <button onClick={() => advance(0)}>← Guest list</button>
            <button
              className="primary"
              disabled={
                !tables.length || !!tableEditor || seats < guests.length
              }
              onClick={() => advance(2)}
            >
              Add seating rules →
            </button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section>
          <div className="func-section-heading">
            <div>
              <h2>A little seating etiquette.</h2>
              <p className="func-muted">
                Keep pairs at the same table, or make sure they sit at different
                tables.
              </p>
            </div>
            <button
              disabled={guests.length < 2 || rules.length >= 100}
              onClick={() =>
                setRuleEditor({
                  type: "together",
                  guestA: guests[0].id,
                  guestB: guests[1].id,
                })
              }
            >
              Add rule
            </button>
          </div>
          {ruleEditor && (
            <form
              className="seating-editor"
              onSubmit={(e) => {
                e.preventDefault();
                if (ruleEditor.guestA === ruleEditor.guestB) {
                  setError("Choose two different guests.");
                  return;
                }
                if (
                  rules.some(
                    (r) =>
                      r.type === ruleEditor.type &&
                      [r.guestA, r.guestB].includes(ruleEditor.guestA) &&
                      [r.guestA, r.guestB].includes(ruleEditor.guestB),
                  )
                ) {
                  setError("That rule already exists.");
                  return;
                }
                setRules([...rules, ruleEditor]);
                setRuleEditor(null);
                setError("");
              }}
            >
              <label>
                Seating preference
                <select
                  value={ruleEditor.type}
                  onChange={(e) =>
                    setRuleEditor({
                      ...ruleEditor,
                      type: e.target.value as SeatingRule["type"],
                    })
                  }
                >
                  <option value="together">Keep together</option>
                  <option value="apart">Keep apart</option>
                </select>
              </label>
              <div className="func-filters">
                {(["guestA", "guestB"] as const).map((field, i) => (
                  <label key={field}>
                    {i === 0 ? "First guest" : "Second guest"}
                    <select
                      value={ruleEditor[field]}
                      onChange={(e) =>
                        setRuleEditor({
                          ...ruleEditor,
                          [field]: e.target.value,
                        })
                      }
                    >
                      {guests.map((guest) => (
                        <option value={guest.id} key={guest.id}>
                          {guest.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="func-inline">
                <button className="primary" type="submit">
                  Save rule
                </button>
                <button type="button" onClick={() => setRuleEditor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="seating-roster">
            {rules.map((rule, i) => (
              <div
                className="seating-roster-row"
                key={`${rule.type}-${rule.guestA}-${rule.guestB}-${i}`}
              >
                <span className="seating-rule-label">
                  {rule.type === "together" ? "Together" : "Apart"}
                </span>
                <div className="func-grow">
                  <strong>
                    {name(rule.guestA)} &amp; {name(rule.guestB)}
                  </strong>
                  <p className="func-caption">
                    {rule.type === "together"
                      ? "Same table"
                      : "Different tables"}
                  </p>
                </div>
                <button
                  aria-label={`Remove rule ${i + 1}`}
                  onClick={() =>
                    setRules(rules.filter((_, index) => index !== i))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {!rules.length && (
            <p className="func-empty">
              No seating preferences. You can continue without adding rules.
            </p>
          )}
          <p className="func-caption">
            Keep-together rules are linked: if Alex sits with Sam and Sam sits
            with Jamie, all three need the same table.
          </p>
          <div className="func-actions">
            <button onClick={() => advance(1)}>← Tables</button>
            <button
              className="primary"
              disabled={!!ruleEditor}
              onClick={() => advance(3)}
            >
              Review event →
            </button>
          </div>
        </section>
      )}
      {step === 3 && (
        <section>
          <h2>{event}</h2>
          <p className="func-muted">
            Review the details before creating the seating plan.
          </p>
          <div className="seating-review-grid">
            <section className="seating-editor">
              <div className="func-section-heading">
                <h3>Guest list</h3>
                <button className="func-text-button" onClick={() => advance(0)}>
                  Edit guests
                </button>
              </div>
              <ul>
                {guests.map((g) => (
                  <li key={g.id}>{g.name}</li>
                ))}
              </ul>
            </section>
            <div>
              <section className="seating-editor">
                <div className="func-section-heading">
                  <h3>Tables</h3>
                  <button
                    className="func-text-button"
                    onClick={() => advance(1)}
                  >
                    Edit tables
                  </button>
                </div>
                <ul>
                  {tables.map((t) => (
                    <li key={t.id}>
                      {t.name} · {t.capacity} seats
                    </li>
                  ))}
                </ul>
              </section>
              <section className="seating-editor">
                <div className="func-section-heading">
                  <h3>Seating rules</h3>
                  <button
                    className="func-text-button"
                    onClick={() => advance(2)}
                  >
                    Edit rules
                  </button>
                </div>
                <ul>
                  {rules.map((r, i) => (
                    <li key={i}>
                      {name(r.guestA)} + {name(r.guestB)}: {r.type}
                    </li>
                  ))}
                </ul>
                {!rules.length && <p>No restrictions.</p>}
              </section>
            </div>
          </div>
          <div className="func-actions">
            <button onClick={() => advance(2)}>← Seating rules</button>
            <button className="primary" onClick={build}>
              Create seating plan →
            </button>
          </div>
        </section>
      )}
      {step === 4 && result && (
        <section aria-label="Seating plan">
          <p className="func-kicker">
            {result.status === "complete"
              ? "Ready for your event"
              : "Arrangement needs attention"}
          </p>
          <h2>{result.event}</h2>
          <p
            role="status"
            className={
              result.status === "complete" ? "func-notice" : "func-error"
            }
          >
            {result.message}
          </p>
          <div className="func-inline">
            <button onClick={() => advance(3)}>Edit event</button>
            {result.status === "complete" && (
              <button
                className="primary"
                onClick={() =>
                  download(
                    JSON.stringify(result, null, 2),
                    "seating-plan.json",
                    "application/json",
                  )
                }
              >
                Download seating plan ↓
              </button>
            )}
          </div>
          {result.status === "complete" && (
            <>
              <div className="func-result-toolbar">
                <div className="func-inline">
                  <button
                    aria-pressed={view === "tables"}
                    onClick={() => setView("tables")}
                  >
                    By table
                  </button>
                  <button
                    aria-pressed={view === "guests"}
                    onClick={() => setView("guests")}
                  >
                    Guest directory
                  </button>
                </div>
                <label>
                  Find a guest
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search guests"
                  />
                </label>
              </div>
              {view === "tables" ? (
                <div className="seating-table-grid">
                  {result.tables
                    .filter(
                      (t) =>
                        !query ||
                        t.guests.some((g) =>
                          g.name.toLowerCase().includes(query.toLowerCase()),
                        ),
                    )
                    .map((table) => (
                      <article className="seating-table" key={table.id}>
                        <div className="seating-table-icon" aria-hidden="true">
                          {table.guests.length}/{table.capacity}
                        </div>
                        <h3>{table.name}</h3>
                        <ol>
                          {table.guests.map((g) => (
                            <li key={g.id}>{g.name}</li>
                          ))}
                        </ol>
                        <p className="func-caption">
                          {table.remaining} open seats
                        </p>
                      </article>
                    ))}
                </div>
              ) : (
                <div className="func-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.tables
                        .flatMap((t) =>
                          t.guests.map((g) => ({ ...g, table: t.name })),
                        )
                        .filter((g) =>
                          g.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((g) => (
                          <tr key={g.id}>
                            <td>{g.name}</td>
                            <td>{g.table}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {query &&
                !result.tables.some((t) =>
                  t.guests.some((g) =>
                    g.name.toLowerCase().includes(query.toLowerCase()),
                  ),
                ) && <p className="func-empty">No guests match this search.</p>}
              <p className="func-methodology">
                All guests are assigned once. Table capacities and all{" "}
                {rules.length} seating rules are satisfied. This is a feasible
                arrangement, not a ranking of social compatibility.
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}
