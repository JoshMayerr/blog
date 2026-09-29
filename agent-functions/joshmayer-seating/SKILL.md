---
name: joshmayer-seating
description: Plan event seating with table capacities and guest pairing constraints.
---

# Event seating planner

Use plan-seating to replace manual guest entry, table setup, rule configuration, and seating review. Supply an event name, guests with unique id and name, tables with unique id, name and capacity, and optional rules. Each rule has type together or apart and references two guest IDs through guestA and guestB. Keep-together chains form a single group.

Limits: 1–40 guests, 1–12 tables, 1–20 seats per table, and up to 100 rules. Each guest is assigned exactly once in a successful plan. Duplicate names are allowed; reference guests by unique ID.

Inspect status before presenting a plan. complete means all rules and capacities are satisfied; tables contains each table's guests and remaining seats. infeasible means no plan can meet the supplied constraints. search_limit means the bounded search stopped without deciding feasibility; never describe this as proof of impossibility. Failed plans return no partial assignments. The planner finds a feasible arrangement, not a guaranteed optimal or socially balanced one.

The result is a planning artifact only: no invitations, bookings, persistent saves, or downloads happen automatically. The function uses only supplied event data, not the blog archive. It is zero-priced but requires a TollBit payment token.
