# JanVoice AI

AI-powered civic engagement platform where Indian citizens can join campaigns, sign petitions, vote in polls, and use AI to generate letters and emails to government officials.

## Run & Operate

- `pnpm --filter @workspace/janvoice-ai run dev` — run the frontend (auto-assigned port)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, Framer Motion, Wouter, React Query, ShadCN UI
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (via SESSION_SECRET) + bcryptjs
- AI: OpenAI (optional, falls back to template drafts if OPENAI_API_KEY not set)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (single source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, campaigns, petitions, polls, comments, notifications, activity)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, campaigns, petitions, polls, comments, notifications, stats, users, ai)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/janvoice-ai/src/` — React frontend (pages, components, context)

## Architecture decisions

- JWT stored in localStorage under key `janvoice_token`; Authorization header sent as `Bearer <token>`
- Auth endpoints use `SESSION_SECRET` env var for signing; falls back to a dev default if not set
- AI email/letter generation uses OpenAI if `OPENAI_API_KEY` is set; falls back to a professional template otherwise
- Campaign progress % is computed from petition signatures vs targetSignatures
- Activity logs and notifications are created on join/sign/vote actions

## Product

- **Landing page** — hero, features, live stats, campaign highlights, how-it-works, testimonials, FAQ, CTA
- **Campaigns** — browse by category (education, infrastructure, healthcare, environment, etc.), search, join, bookmark
- **Petitions** — create and sign digital petitions with signature progress tracking
- **Polls** — public opinion polls with animated real-time results
- **Community** — threaded discussions with upvotes
- **AI Tools** — generate professional emails and official letters in English, Hindi, or Marathi
- **Dashboard** — personal stats (impact score, campaigns joined, petitions signed), activity feed
- **Notifications** — real-time in-app campaign updates, petition milestones, system alerts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before building
- `zod.email()` is not available in this workspace's Zod version — use plain `type: string` for email fields in the spec
- DB schema push: `pnpm --filter @workspace/db run push` (dev only; prod schema managed by Replit publish flow)
- Never run `pnpm dev` at the workspace root — use workflows or individual filter commands

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
