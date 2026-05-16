# AGENTS.md

## Project context

ToDoster is a production-oriented learning pet project.

Goals:

- learn modern full-stack engineering
- learn production architecture thinking
- learn AI-assisted development workflows
- build a realistic todo application incrementally

---

## Required reading

Always read before changing code:

- docs/ARCHITECTURE.md

Treat it as the architectural source of truth.

---

## Architecture constraints

Current architecture is browser-first / local-first sync.

Rules:

- browser owns live interactive application state
- browser snapshot is authoritative within a valid browser-profile session window
- server bootstrap is authoritative when the browser-profile session marker is missing or expired
- stale browser snapshots must not override newer persisted truth
- database is durable shared truth
- localStorage stores browser snapshot
- localStorage stores sync queue
- localStorage stores a TTL-based browser-profile session marker
- Server Actions are persistence commands
- no revalidatePath for browser-first interactions
- desired-state operations only
- conflict strategy is Last Write Wins
- multi-tab coordination uses storage event

---

## Validation rules

Browser validates domain/user input before state mutation.

Server re-validates persistence operations at the trust boundary.

Never trust browser input for persistence.

---

## Temporary constraints

Do NOT introduce yet:
- IndexedDB
- service workers
- zod
- cache libraries
- global state libraries
- realtime sync
- collaborative editing


## Coding rules

Prefer:

- small focused changes
- minimal surface area
- simple composable modules
- explicit naming
- strong typing
- clear browser/server separation

Avoid:

- speculative abstractions
- premature complexity
- architecture rewrites without explicit approval
- adding libraries without strong need

---

## Persistence semantics

Interactive updates are browser-first.

Expected pattern:

```txt
user action
→ browser validation
→ browser state mutation
→ browser snapshot persistence
→ sync queue append
→ persistence dispatch
→ server validation
→ database persistence
```

Not:

```txt
user action
→ server mutation
→ revalidation-driven UI refresh
```

---

## Server Actions

Server Actions are persistence commands.

Allowed:

- validate persistence payloads
- enforce user scope
- persist data
- return persistence results

Forbidden:

- owning UI state
- browser-state orchestration
- revalidation-driven browser refresh
- toggle-style domain semantics

---

## Development workflow

Required workflow:

```txt
define → design → implement → review → build → commit
```

Always after implementation:

```bash
npm run build
```

---

## Change scope discipline

Prefer one vertical slice at a time.

Good slices:

- bootstrap loading
- session continuity restore
- local create flow
- local update flow
- persistence commands
- sync queue
- retry handling

Bad slices:

- full sync engine + retries + persistence + conflict handling at once

---

## If ambiguity exists

Prefer alignment with docs/ARCHITECTURE.md.

Never silently drift back toward server-first architecture.
