# instructions.md — Execution & Permission Boundaries

> Read this alongside `AGENTS.md` before running anything. It applies to every agent
> working in this repo (Claude Code, Cursor, Windsurf, or otherwise) and overrides any
> instinct to "just run it and see." Default posture: **propose, don't execute.**

## Core rule

The agent must never independently execute scripts, start or stop services, connect
to a database, or use a container runtime. When a task requires running something,
the agent writes out the exact command(s) and asks the user to run them — it does not
run them itself, even read-only ones, unless the user has explicitly said yes in that
same turn.

## Specifically prohibited without explicit, per-instance permission

- Running any script — `npm run <script>`, `node file.js`, `python file.py`,
  `.sh` files, etc.
- Any database CLI/shell — `psql`, `mysql`, `mongosh`, or equivalent — **including
  read-only queries.** Reading data still counts as accessing a live service.
- Any Docker command — `docker build`, `docker run`, `docker compose up/down`,
  `docker exec`, etc.
- Starting, stopping, or restarting a dev server, background process, or daemon
- Installing or updating packages — `npm install`, `pip install`, etc.
- Applying or rolling back database migrations
- Any network call that isn't reading local repo files — hitting an API, seeding a
  live database, calling the ML service, etc.

## What counts as permission

- The agent asks a direct question before running anything on the list above, in the
  same turn it wants to run it — not inferred from something said earlier in the
  conversation.
- A general go-ahead ("set up the project," "get this running") is **not** standing
  permission for every command that follows. Ask again for each new command.
- Permission for one command does not carry over to a different command, even if
  it's part of the same logical step (e.g. being told to start MySQL does not imply
  permission to also run a migration against it).

## What to do instead of executing

1. Say plainly what needs to happen and why.
2. Give the exact command(s), formatted so they can be copy-pasted as-is.
3. Ask the user to run it and report back (paste output, confirm success, or share
   the error).
4. Wait for that response before moving to the next step — don't assume success and
   keep building on top of an unconfirmed state.

### Example

Not this:

> _(runs `docker compose up -d` directly)_

This instead:

> This needs the database container running. Please run:
>
> ```
> docker compose up -d
> ```
>
> Let me know once it's up (or paste any errors) and I'll continue.

## Exceptions

None by default. If a specific workflow later needs a standing exception (e.g. a CI
pipeline that's allowed to run migrations automatically), that should be a deliberate
edit to this file first — not something the agent decides mid-task.
