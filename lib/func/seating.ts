export type Guest = { id: string; name: string };
export type SeatingTable = { id: string; name: string; capacity: number };
export type SeatingRule = {
  type: "together" | "apart";
  guestA: string;
  guestB: string;
};
export type SeatingInput = {
  event: string;
  guests: Guest[];
  tables: SeatingTable[];
  rules: SeatingRule[];
};
export type SeatingResult = {
  status: "complete" | "infeasible" | "search_limit";
  event: string;
  tables: (SeatingTable & { guests: Guest[]; remaining: number })[];
  totalGuests: number;
  totalSeats: number;
  message: string;
};
function record(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).some((key) => !allowed.includes(key)))
    throw new Error("Unknown input field.");
  return obj;
}
function text(value: unknown, label: string, max = 80): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`${label} must contain 1–${max} characters.`);
  return value.trim();
}
export function parseSeating(value: unknown): SeatingInput {
  const obj = record(value, ["event", "guests", "tables", "rules"]);
  const event = text(obj.event, "Event name", 120);
  if (
    !Array.isArray(obj.guests) ||
    !obj.guests.length ||
    obj.guests.length > 40
  )
    throw new Error("Add 1–40 guests.");
  if (
    !Array.isArray(obj.tables) ||
    !obj.tables.length ||
    obj.tables.length > 12
  )
    throw new Error("Add 1–12 tables.");
  const guests = obj.guests.map((value) => {
    const guest = record(value, ["id", "name"]);
    return {
      id: text(guest.id, "Guest ID"),
      name: text(guest.name, "Guest name"),
    };
  });
  const tables = obj.tables.map((value) => {
    const table = record(value, ["id", "name", "capacity"]);
    if (
      !Number.isInteger(table.capacity) ||
      (table.capacity as number) < 1 ||
      (table.capacity as number) > 20
    )
      throw new Error("Each table must have 1–20 seats.");
    return {
      id: text(table.id, "Table ID"),
      name: text(table.name, "Table name"),
      capacity: table.capacity as number,
    };
  });
  if (new Set(guests.map((g) => g.id)).size !== guests.length)
    throw new Error("Guest IDs must be unique.");
  if (new Set(tables.map((t) => t.id)).size !== tables.length)
    throw new Error("Table IDs must be unique.");
  const rawRules = obj.rules ?? [];
  if (!Array.isArray(rawRules) || rawRules.length > 100)
    throw new Error("Use at most 100 seating rules.");
  const rules = rawRules.map((value) => {
    const rule = record(value, ["type", "guestA", "guestB"]);
    if (rule.type !== "together" && rule.type !== "apart")
      throw new Error("Rule type must be together or apart.");
    if (
      !guests.some((g) => g.id === rule.guestA) ||
      !guests.some((g) => g.id === rule.guestB)
    )
      throw new Error("Each seating rule must reference existing guests.");
    if (rule.guestA === rule.guestB)
      throw new Error("Choose two different guests for a rule.");
    return {
      type: rule.type,
      guestA: rule.guestA as string,
      guestB: rule.guestB as string,
    } as SeatingRule;
  });
  return { event, guests, tables, rules };
}
export function planSeating(value: unknown, nodeLimit = 100000): SeatingResult {
  const input = parseSeating(value);
  const totalGuests = input.guests.length;
  const totalSeats = input.tables.reduce(
    (sum, table) => sum + table.capacity,
    0,
  );
  const base = { event: input.event, totalGuests, totalSeats };
  const failed = (
    message: string,
    status: SeatingResult["status"] = "infeasible",
  ): SeatingResult => ({ ...base, status, tables: [], message });
  if (totalGuests > totalSeats)
    return failed(
      `Add at least ${totalGuests - totalSeats} more seats before creating a plan.`,
    );
  const parent = new Map(input.guests.map((guest) => [guest.id, guest.id]));
  const root = (id: string): string => {
    let current = id;
    while (parent.get(current) !== current) current = parent.get(current)!;
    return current;
  };
  for (const rule of input.rules.filter((rule) => rule.type === "together"))
    parent.set(root(rule.guestA), root(rule.guestB));
  const groups = new Map<string, Guest[]>();
  for (const guest of input.guests) {
    const id = root(guest.id);
    groups.set(id, [...(groups.get(id) ?? []), guest]);
  }
  const conflicts = new Map(
    Array.from(groups.keys(), (id) => [id, new Set<string>()]),
  );
  for (const rule of input.rules.filter((rule) => rule.type === "apart")) {
    const a = root(rule.guestA),
      b = root(rule.guestB);
    if (a === b)
      return failed(
        "A keep-apart rule conflicts with guests linked by keep-together rules. Review those rules.",
      );
    conflicts.get(a)!.add(b);
    conflicts.get(b)!.add(a);
  }
  const ordered = Array.from(groups.entries()).sort(
    (a, b) =>
      b[1].length - a[1].length ||
      conflicts.get(b[0])!.size - conflicts.get(a[0])!.size,
  );
  if (
    ordered.some(
      ([, guests]) =>
        guests.length >
        Math.max(...input.tables.map((table) => table.capacity)),
    )
  )
    return failed(
      "A keep-together group is larger than every table. Increase a table's capacity or revise the rules.",
    );
  const placed = input.tables.map(() => [] as string[]);
  const used = input.tables.map(() => 0);
  let visits = 0;
  let exhausted = false;
  function search(index: number): boolean {
    if (++visits > nodeLimit) {
      exhausted = true;
      return false;
    }
    if (index === ordered.length) return true;
    const [group, guests] = ordered[index];
    const candidates = input.tables
      .map((_, i) => i)
      .sort((a, b) => used[a] - used[b] || a - b);
    const emptyCapacities = new Set<number>();
    for (const i of candidates) {
      if (
        used[i] + guests.length > input.tables[i].capacity ||
        placed[i].some((other) => conflicts.get(group)!.has(other))
      )
        continue;
      // Empty tables of equal capacity are interchangeable for these rules.
      if (!used[i] && emptyCapacities.has(input.tables[i].capacity)) continue;
      if (!used[i]) emptyCapacities.add(input.tables[i].capacity);
      placed[i].push(group);
      used[i] += guests.length;
      if (search(index + 1)) return true;
      placed[i].pop();
      used[i] -= guests.length;
      if (exhausted) return false;
    }
    return false;
  }
  if (!search(0))
    return exhausted
      ? failed(
          "The search limit was reached. Try fewer constraints or more tables; feasibility has not been determined.",
          "search_limit",
        )
      : failed(
          "No arrangement satisfies all rules within these table capacities. Add a table, increase capacity, or revise a rule.",
        );
  return {
    ...base,
    status: "complete",
    message: "Every guest is seated and all seating rules are satisfied.",
    tables: input.tables.map((table, i) => ({
      ...table,
      guests: placed[i].flatMap((group) => groups.get(group)!),
      remaining: table.capacity - used[i],
    })),
  };
}
const stringSchema = { type: "string", minLength: 1, maxLength: 80 };
const objSchema = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
export const seatingInputSchema = objSchema(
  {
    event: { type: "string", minLength: 1, maxLength: 120 },
    guests: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: objSchema({ id: stringSchema, name: stringSchema }),
    },
    tables: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: objSchema({
        id: stringSchema,
        name: stringSchema,
        capacity: { type: "integer", minimum: 1, maximum: 20 },
      }),
    },
    rules: {
      type: "array",
      maxItems: 100,
      default: [],
      items: objSchema({
        type: { type: "string", enum: ["together", "apart"] },
        guestA: stringSchema,
        guestB: stringSchema,
      }),
    },
  },
  ["event", "guests", "tables"],
);
export const seatingResultSchema = objSchema({
  status: { type: "string", enum: ["complete", "infeasible", "search_limit"] },
  event: { type: "string" },
  totalGuests: { type: "integer" },
  totalSeats: { type: "integer" },
  message: { type: "string" },
  tables: {
    type: "array",
    items: objSchema({
      id: stringSchema,
      name: stringSchema,
      capacity: { type: "integer" },
      remaining: { type: "integer" },
      guests: {
        type: "array",
        items: objSchema({ id: stringSchema, name: stringSchema }),
      },
    }),
  },
});
export const seatingDefinition = {
  name: "planSeating",
  description:
    "Assign 1–40 guests to 1–12 tables while respecting table capacities and keep-together/keep-apart rules. Returns a complete plan, proven infeasibility, or an explicit search-limit result. Does not contact guests or make reservations.",
  inputSchema: seatingInputSchema,
} as const;
export const seatingSkill = `---\nname: joshmayer-seating\ndescription: Plan event seating with table capacities and guest pairing constraints.\n---\n\n# Event seating planner\n\nUse plan-seating to replace manual guest entry, table setup, rule configuration, and seating review. Supply an event name, guests with unique id and name, tables with unique id, name and capacity, and optional rules. Each rule has type together or apart and references two guest IDs through guestA and guestB. Keep-together chains form a single group.\n\nLimits: 1–40 guests, 1–12 tables, 1–20 seats per table, and up to 100 rules. Each guest is assigned exactly once in a successful plan. Duplicate names are allowed; reference guests by unique ID.\n\nInspect status before presenting a plan. complete means all rules and capacities are satisfied; tables contains each table's guests and remaining seats. infeasible means no plan can meet the supplied constraints. search_limit means the bounded search stopped without deciding feasibility; never describe this as proof of impossibility. Failed plans return no partial assignments. The planner finds a feasible arrangement, not a guaranteed optimal or socially balanced one.\n\nThe result is a planning artifact only: no invitations, bookings, persistent saves, or downloads happen automatically. The function uses only supplied event data, not the blog archive. It is zero-priced but requires a TollBit payment token.\n`;
