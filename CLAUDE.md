# WebStudio CRM

CRM for a web studio (portfolio project): clients, deals with a kanban pipeline, tasks, activity log, analytics dashboard. Roles: ADMIN and MANAGER.

## Stack

- **Monorepo:** pnpm workspaces — `apps/api` + `apps/web` + `packages/shared` (shared TS types/enums)
- **Backend:** NestJS + TypeScript (strict), PostgreSQL 16 (Docker), Prisma ORM, JWT auth (access + refresh), class-validator DTOs, Swagger via `@nestjs/swagger`
- **Frontend:** Vite + React + TypeScript (strict), Tailwind CSS + shadcn/ui, React Router, TanStack Query (all server state), TanStack Table, react-hook-form + zod, Recharts, dnd-kit
- **Tooling:** ESLint + Prettier, Vitest + React Testing Library (web), Jest + supertest e2e (api), GitHub Actions

## Commands

- `docker compose up -d db` — start PostgreSQL
- `pnpm dev` — run api + web concurrently
- `pnpm --filter api prisma migrate dev` — create/apply migration
- `pnpm --filter api prisma db seed` — seed demo data
- `pnpm lint` / `pnpm build` / `pnpm test` — run for all workspaces
- `pnpm --filter api test:e2e` — API e2e tests

## Structure

```
apps/
  api/src/
    modules/<domain>/        # auth, users, clients, deals, tasks, activity, analytics
      *.controller.ts        # thin: validation + delegation only
      *.service.ts           # business logic
      dto/                   # class-validator DTOs for every input
    prisma/                  # schema.prisma, migrations, seed.ts
    common/                  # guards, decorators, filters, interceptors
  web/src/
    features/<domain>/       # components, hooks, api of one feature
    components/ui/           # shadcn components
    components/layout/       # sidebar, topbar, page shells
    lib/                     # axios instance, query client, utils
    pages/                   # route-level components only
packages/
  shared/                    # enums (DealStage, Role, TaskStatus), shared types
```

## Domain rules

- Deal pipeline stages: `LEAD → BRIEF → PROPOSAL → CONTRACT → IN_PROGRESS → DELIVERY → WON | LOST`
- Every deal creation, stage change, task completion and note writes an `Activity` record. Never skip this.
- MANAGER can view everything, but can edit/delete only entities where they are the owner (`ownerId`). ADMIN can edit everything and manage users.
- Money is stored as integer kopecks/cents (`Int`), never floats.

## Conventions

- TypeScript strict everywhere. `any` is forbidden — use `unknown` + narrowing or proper generics.
- Every list endpoint supports `page`, `limit`, `sortBy`, `sortOrder` and domain filters; response shape is `{ data: T[], meta: { page, limit, total, totalPages } }`.
- Unified API error shape: `{ statusCode, message, error }` (Nest defaults via a global exception filter).
- Frontend server state lives ONLY in TanStack Query (no API data in Context/useState). Query keys: `[domain, params]`, e.g. `['clients', { page, search }]`.
- Forms: react-hook-form + zodResolver. Zod schemas live next to the feature.
- Mutations that affect lists must invalidate the relevant query keys; kanban drag-and-drop uses optimistic updates with rollback on error.
- Accessibility is a requirement, not polish: semantic HTML, keyboard operability (incl. modals and kanban), visible focus states, `aria-*` where needed.
- UI text: Russian. Code, comments, commit messages: English.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`), one logical change per commit.

## Do NOT

- Do not add dependencies without asking first.
- Do not change `schema.prisma` without generating a migration.
- Do not disable ESLint rules or use `@ts-ignore` / `@ts-expect-error` to silence errors.
- Do not implement features beyond the current stage prompt — if you see something worth doing, list it as a suggestion at the end instead.
- Do not put secrets in code; use `.env` (with an up-to-date `.env.example`).

## Definition of done (every stage)

`pnpm lint` and `pnpm build` pass, the feature works end-to-end manually, seed data still works, and you finish with a short summary: what was done, what to verify by hand, suggested commit split.
