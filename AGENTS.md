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
- browser snapshot is authoritative within an active browser session
- server bootstrap is authoritative on new browser session startup
- stale browser snapshots must not override newer persisted truth across sessions
- database is durable shared truth
- localStorage stores browser snapshot + sync queue
- sessionStorage tracks browser session state
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

- authentication
- IndexedDB
- service workers
- zod
- cache libraries
- global state libraries
- realtime sync
- collaborative editing
- drag-and-drop

Temporary identity:

```ts
TEMP_USER_ID = "test-user"
```

---

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
- browser snapshot restore
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