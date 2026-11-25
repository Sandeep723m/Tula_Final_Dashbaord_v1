# Project memory

## Product intent & audience

- Frontend app served from `frontend/` folder; specific product/audience not yet identified.

## Brand personality & voice

- Not yet inferred from available context.

## Visual design & UX direction

- Not yet inferred from available context.

## Decisions, constraints & rationale

- Real app lives in `frontend/` with its own `package.json` and Vite config.
- Project root originally had no `package.json`; a root launcher was added to forward preview and build commands to `frontend/` so Bolt can discover and start the app from the root.
- Dependencies are installed inside `frontend/`; root launcher delegates rather than duplicating deps.
- Root install now succeeds and the frontend production build passes.

## Open questions & assumptions

- App purpose, features, and target audience still unknown.
- Whether a backend exists or is needed is unknown.
- Whether the root launcher scripts cover dev, build, and preview uniformly is assumed but not fully verified.