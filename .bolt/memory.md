# Project memory

## Product intent & audience

- Frontend app served from `frontend/` folder; specific product/audience not yet identified.

## Brand personality & voice

- Not yet inferred from available context.

## Visual design & UX direction

- Not yet inferred from available context.

## Decisions, constraints & rationale

- Real app lives in `frontend/` with its own `package.json`; project root has no `package.json` (only an empty placeholder lockfile).
- Dependencies must be installed inside `frontend/`, not at root.
- Running `npm install` at root is a no-op and breaks the preview.
- Frontend build compiles successfully once dependencies are installed in `frontend/`.

## Open questions & assumptions

- Framework/build tool (e.g. Vite, CRA) not confirmed — inferred only that a build step exists.
- App purpose, features, and target audience still unknown.
- Whether a backend exists or is needed is unknown.