# web — WarAunty enterprise portal

Next.js 15 (App Router) + TypeScript (strict) + Tailwind v4 + shadcn/ui (radix-nova style),
pnpm. Dark-first, no light theme is implemented.

## Stack notes

- **Next.js**: pinned to `^15.5.4` (not 16 — `create-next-app@latest` currently scaffolds 16;
  if you re-scaffold anything, re-pin `next` and `eslint-config-next` back to `^15.5.x` in
  `package.json` and re-run `pnpm install`).
- **shadcn/ui**: initialized with the `radix-nova` preset (`components.json`). This CLI
  generation is newer than the classic shadcn convention — components import `cn` from the
  `cn` package (not a local `lib/utils.ts` definition) and `Slot`/other primitives from the
  `radix-ui` meta-package, not individual `@radix-ui/react-*` imports. Follow that convention
  when adding new components by hand instead of mixing it with the older pattern.
- **ESLint**: flat config via `FlatCompat` + `next/core-web-vitals` + `next/typescript`
  (`eslint.config.mjs`). The installed `eslint-config-next` version does not export flat
  configs directly — don't revert to `import nextVitals from "eslint-config-next/core-web-vitals"`
  without the FlatCompat wrapper, it breaks lint.
- `next.config.ts` must stay minimal (`{}`). Next 16-only options (`cacheComponents`,
  `partialPrefetching`, the turbopack CSS loader rule) will build but warn/fail on Next 15.

## Design tokens

Source of truth: `../GuaranteeHai2/WarAunty_Design_System.md` (also check for an updated copy
if branding changes). Hex values are wired into `app/globals.css` as CSS variables inside
`:root`, then aliased through `@theme inline` into Tailwind utilities:

| Token | Hex | Tailwind utility |
|---|---|---|
| Background | `#0B1020` | `bg-background` |
| Surface | `#171B2E` | `bg-surface` |
| Surface variant | `#24283B` | `bg-surface-variant` |
| Card | `#1F2435` | `bg-card` |
| Border/divider | `#2E3345` | `border-border` |
| Primary | `#7C3AED` | `bg-primary` / `text-primary` |
| Primary secondary | `#A855F7` | `bg-primary-secondary` |
| Success | `#22C55E` | `bg-success` / `text-success` |
| Warning | `#F59E0B` | `bg-warning` / `text-warning` |
| Danger | `#EF4444` | `bg-danger` / `text-danger` (also mapped to shadcn's `destructive`) |
| Primary text | `#FFFFFF` | `text-text` / `text-foreground` |
| Secondary text | `#BFC3D6` | `text-muted` / `text-muted-foreground` |

Gradient: `.bg-gradient-primary` utility (135deg, primary → primary-secondary).

Radius scale (design system's dp values, converted to rem): `rounded-card` (20px),
`rounded-button` (18px), `rounded-input` (16px), `rounded-dialog` (22px), `rounded-sheet` (28px).

When the palette changes, edit only the hex values in the `:root` block at the top of
`app/globals.css` — everything else (shadcn tokens, sidebar tokens, chart tokens) derives from
those via `var()`, so it propagates automatically.

## App shell

- `app/(portal)/layout.tsx` — collapsible sidebar (`components/portal/sidebar.tsx`, client
  component, local `useState` only — no persisted collapse state yet) + topbar
  (`components/portal/topbar.tsx`: global search via cmdk `CommandDialog`
  (`components/portal/global-search.tsx`, ⌘K/Ctrl+K), notifications bell placeholder, company
  dropdown menu placeholder).
- Nav items are defined once in `lib/nav.ts` (`NAV_ITEMS`) — add new portal routes there, not
  by hand-editing the sidebar.
- Every route under `app/(portal)/*` is currently a placeholder rendering
  `components/portal/page-placeholder.tsx`. Replace the placeholder body per page as real
  data/UI lands; keep using the same route segment names (`assets`, `import`, `claims`,
  `customers`, `renewals`, `analytics`, `audit-log`, `team`, `settings`).
- `(portal)/layout.tsx` is wrapped in `components/portal/portal-gate.tsx`, which blocks on
  `useAuth().status` and bounces to `/login` client-side if the session turns out to be invalid
  (see Auth section below for why this exists alongside middleware).
- `Topbar` reads `enterpriseProfile` from `useAuth()` and wires "Sign out" to `logout()`.

## Auth

Mirrors the Android app's `EnterpriseLoginActivity` / `EnterpriseStatusActivity` flow, adapted
to: access token in memory only, refresh token in an httpOnly cookie, exchanged via a Next.js
route handler (the Android app instead persists both tokens in plain `SharedPreferences` and
refreshes directly against Cognito — don't follow that part).

- **Login**: `components/auth/login-form.tsx` → `useAuth().login()` → `POST /api/auth/login`
  (`app/api/auth/login/route.ts`) → proxies to backend `/enterprise/auth/login`, strips
  `refreshToken` out of the JSON before it reaches the browser, sets it as an httpOnly cookie
  (`lib/auth/cookies.ts`, name `wa_rt`, `path: "/"` — must stay `"/"` or middleware can't see it
  on portal routes). The access token + `enterpriseProfile` go to the client and into
  `AuthProvider`'s in-memory state.
- **Routing after login**: per spec, the login form does *not* trust the login response's status
  fields — it explicitly calls `GET /enterprise/me` right after and routes off that
  (`accessAllowed || approvalStatus === "ACTIVE"` → `/dashboard`, else → `/enterprise/status`).
  This also lets the backend's self-healing reconciliation (see `getEnterpriseMe` in the Lambda)
  run before routing.
- **Status page**: `components/auth/enterprise-status-view.tsx` is the one page for
  EMAIL_PENDING / PENDING_APPROVAL / REJECTED / SUSPENDED, switching copy by `approvalStatus`
  (mirrors Android's single `EnterpriseStatusActivity` rather than separate screens per status).
  Shows the rejection reason when present, has a manual "Check status" refresh and "Sign out",
  and self-redirects to `/dashboard` if a refresh reveals the account became `ACTIVE`.
- **Refresh**: `lib/auth/auth-context.tsx`'s `AuthProvider` schedules a proactive refresh ~60s
  before the access token's decoded `exp` (`lib/auth/jwt.ts` — decode only, no verification
  happens client-side), and `authFetch()` does a reactive single-retry refresh on any `401`. Both
  paths call `POST /api/auth/refresh` (reads the `wa_rt` cookie server-side, calls the backend's
  shared `/auth/refresh`, returns a fresh `accessToken`). If refresh fails, the cookie is cleared
  and the user is logged out.
- **Why two layers of protection**: `middleware.ts` can only check whether the `wa_rt` cookie is
  *present* (access tokens are memory-only, so there's nothing else to check pre-render) — it
  can't tell if the refresh token is still valid. `PortalGate` catches the case where the cookie
  exists but is expired/revoked, by waiting for `AuthProvider`'s mount-time silent-refresh attempt
  to resolve before rendering portal content.
- Add any new top-level protected route to **three** places: `middleware.ts`'s `matcher`, the
  `(portal)` route group (gets `PortalGate` for free), and `lib/nav.ts` if it belongs in the
  sidebar.
- `lib/auth/errors.ts` classifies login failures into the same taxonomy the Android app uses
  (`AuthException`: invalid credentials / not confirmed / too many requests / network / server) —
  extend this rather than inventing new error shapes if new auth-adjacent flows are added.
- No signup/email-verification UI exists yet — `EMAIL_PENDING` on the status page just displays
  copy, it doesn't let the user submit a confirmation code.

## API client

- `lib/types.ts` — TypeScript types mirrored from `docs/API_MAP.md`. Keep both in sync with
  `GuaranteeHai2/backend/lambda/index.js` when the enterprise API surface changes; the map doc
  is the human-readable source, this file is the importable source.
- `lib/api.ts`:
  - `apiRequest<T>()` / `api.get|post|put|patch|delete` — fetch wrapper reading
    `NEXT_PUBLIC_API_BASE_URL`, throws `ApiError` (`status`, `code?`, `details?`) on non-2xx.
  - `normalizeListResponse<T>()` — the backend returns two different paginated-list shapes
    depending on which handler produced them (some include `total`, some don't — see
    "Notes for frontend implementation" in `docs/API_MAP.md`). Always pass raw list responses
    through this before using them, so calling code never has to branch on `total` presence.
  - No auth/session handling yet — `accessToken` is an optional per-call param on
    `RequestOptions`, not sourced from any session store.

## Commands

```
pnpm dev         # http://localhost:3000, redirects "/" -> /dashboard
pnpm build
pnpm lint
pnpm typecheck   # tsc --noEmit
```
