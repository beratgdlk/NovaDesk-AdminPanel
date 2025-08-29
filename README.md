# NovaDesk

A modern, customizable admin dashboard starter that runs without a backend using an in‑memory mock API.

NovaDesk is a flexible admin template built for internal dashboards and data‑driven applications. It ships with an in‑memory mock API for a backend‑free demo; switching to a real API is straightforward. It includes theming (light/dark), data tables with filtering, form validation, a role/permission model, and a minimal chat experience.

## Highlights

- React 19, Vite, Tailwind CSS v4, TanStack Router/Query, Zustand
- Fully customizable theming and components (Shadcn‑style UI)
- In‑memory mock API; easily replaceable with your own backend
- Example modules: roles/permissions, users/agents, domains, chatbot integration
- Fast setup and DX with Bun

## Structure

- `apps/web`: The entire application (frontend + in‑memory mock API)

## Setup

Prerequisites: Bun 1.2+, Node 18+

```bash
bun install
cd apps/web
bun install
```

Development:

```bash
cd apps/web
bun run dev
# Open the Local URL from Vite output (e.g. http://localhost:5173)
```

Build/Preview:

```bash
cd apps/web
bun run build
bun run preview
```

## Environment Variables

`apps/web` runs with the mock API by default. Optionally, you can add a `.env` under `config/apps/web/.env`.

Example:

```env
VITE_API_URL=http://localhost:3000
```

> Note: With the mock API enabled, no real backend is required. To connect a real backend, adapt `src/lib/api.ts` to your endpoints.

## Scripts (apps/web)

- `bun run dev`: Vite dev server
- `bun run build`: Production build
- `bun run preview`: Preview the build

## License

MIT
