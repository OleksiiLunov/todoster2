# AGENTS.md

## Project context

ToDoster is a production-oriented learning pet project.

Goals:

- learn modern full-stack engineering;
- learn production architecture thinking;
- learn AI-assisted development workflows;
- build a realistic todo application.

---

## Read before changing code

Always read:

- docs/ARCHITECTURE.md

Treat that document as the architectural source of truth.

---

## Architecture constraints

Current architecture is browser-first / local-first sync.

Rules:

- browser owns live application state;
- database is durable persisted truth;
- server bootstrap is authoritative on application startup;
- localStorage must not override server bootstrap on startup;
- after bootstrap, browser state owns interaction flow;
- localStorage stores browser snapshot + sync queue;
- server actions are persistence commands;
- no revalidatePath for browser-first interactions;
- desired-state operations only;
- last write wins;
- multi-tab sync uses storage event.

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

## Validation rules

Browser validates user/domain input before writing to browser state.

Server re-validates persistence operations at the trust boundary.

Never assume browser input is trusted.

---

## Coding rules

Prefer:

- small focused changes
- minimal surface area
- explicit naming
- simple composable modules
- server/client separation
- strongly typed interfaces

Avoid:

- architectural rewrites unless explicitly requested
- speculative abstractions
- premature complexity
- introducing libraries without clear need

---

## Persistence semantics

Interactive UI updates must be browser-first.

Pattern:

```txt
user action
→ browser validation
→ browser state update
→ snapshot persistence
→ sync queue append
→ server persistence
```

NOT:

```txt
user action
→ server mutation
→ revalidation-driven UI refresh
```

---

## Server Actions

Server Actions are persistence commands.

They:

- validate
- persist
- return persistence results if needed

They do NOT:

- own UI state
- revalidate browser-first interactions
- act as rendering orchestration

---

## Development workflow

Required workflow:

```txt
define → design → implement → review → build → commit
```

After every implementation:

```bash
npm run build
```

---

## Change scope discipline

Prefer one vertical slice at a time.

Good:

- bootstrap loading
- local snapshot persistence
- create todo flow
- complete todo flow
- sync queue implementation

Bad:

implement full sync engine + mutations + retries + conflict handling in one change

---

## If architecture ambiguity exists

Prefer alignment with docs/ARCHITECTURE.md.

Do not silently revert toward server-first architecture.