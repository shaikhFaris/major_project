# Architecture Decisions

Short-form log — one entry per non-obvious choice, 2-3 sentences each. Not a full ADR
template; just enough so future-you (or the agent, in a fresh context) knows *why*
something is the way it is instead of re-litigating it.

## Separate Python ML service instead of doing ML in Node
Python's ecosystem (scikit-learn, XGBoost, Pandas) is far more mature for forecasting
work than anything available in Node. The backend stays Node/Express for CRUD and
orchestration; the ML service is a separate FastAPI app called internally over REST,
introduced in Phase 2.

## PostgreSQL over a document store
The data is fundamentally relational — users own businesses, businesses have market
configs and simulations, simulations have an ordered sequence of period results.
Joins and referential integrity matter more here than schema flexibility.

## Phased build, MVP-first
15 modules spanning simulation, ML, and analytics is too much to build in one pass
without something breaking silently. Phase 1 gets a real end-to-end loop working
(create business → configure market → run → view dashboard) with a deterministic
simulation engine before agents, ML, or advanced analytics are introduced. See
`ROADMAP.md`.

## Frontend design language (applied from design-taste skill)
The frontend was re-skinned per the `design-taste-frontend` skill (`.agents/skills/`),
keeping the Tailwind v4 stack: Geist Variable for UI, Geist Mono Variable for all
numerals, a zinc neutral palette with a single emerald accent, Phosphor icons (no
emoji/Lucide), self-hosted fonts via `@fontsource-variable`, and a shared UI kit in
`frontend/src/components/ui.tsx`. Dark-first was a deliberate read (cockpit-style
B2B tool, not a consumer site); the three chart series colors (emerald/amber/sky)
are the one documented exception to the single-accent rule, reserved for data viz.

---

## Template for new entries
```
## Short decision title
What was decided, and the one or two sentence reason. Link to the relevant module
in ROADMAP.md if useful.
```
