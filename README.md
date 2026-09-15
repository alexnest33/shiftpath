# ShiftPath

ShiftPath is a full-stack application for people who work rotating shifts. It
combines a repeating work calendar with learning goals and planned study
sessions.

## Database architecture

The Supabase schema is stored as ordered SQL migrations in
`supabase/migrations`. Apply them in timestamp order:

1. `20260915000000_initial_schema.sql` creates the types, tables, indexes,
   triggers for `updated_at`, grants, and RLS policies.
2. `20260915010000_add_profile_creation_trigger.sql` adds automatic profile
   creation and safely backfills profiles for existing Auth users.
3. `20260915020000_add_schedule_presets.sql` adds the `5_2` and `1_3`
   schedule types and validates their exact preset arrays.

The schema contains four user-owned tables:

- `profiles` extends `auth.users`; its primary key is the authenticated user's
  UUID. An `after insert` trigger on `auth.users` creates the profile
  automatically.
- `schedules` stores a schedule anchor date and a repeating `boolean[]` cycle.
  `true` means a work day and `false` means a day off. Presets for 2/2, 3/3,
  the 14-day 2/2/3 cycle, 5/2, and сутки/трое are validated by database
  constraints; custom cycles may contain between 1 and 366 days.
- `goals` stores a user's learning goals and their status.
- `study_sessions` belongs to both a user and one of that user's goals. A
  composite foreign key prevents linking a session to another user's goal.

All primary keys are UUIDs. Foreign keys to `auth.users` use cascading deletes,
timestamps are stored as `timestamptz`, and `updated_at` is maintained by
database triggers. Row Level Security is enabled on every table. The `anon`
role has no table privileges; authenticated users receive CRUD privileges, with
separate policies restricting every operation to rows owned by `auth.uid()`.

## Apply migrations manually

The migrations are local only and are not applied automatically.

For a new, empty project, run all three files in timestamp order through the
Supabase SQL Editor. Never rerun a migration that has already been applied.
For a project where the first two migrations are already applied, run only
`20260915020000_add_schedule_presets.sql`. If only the initial migration has
been applied, do not rerun it: apply the second migration and then the third.

To apply a required migration:

1. Open the target project in the Supabase Dashboard.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of the required migration file into the editor.
4. Check that the selected project/environment is correct, then click **Run**.
5. Verify in **Table Editor** that the four tables exist and that RLS is enabled
   for each one. After the second migration, verify that a new Auth user gets a
   matching `profiles` row.

Do not put Supabase keys or other secrets in this README. Local credentials
belong in `.env.local`.

## Authentication

Authentication uses Supabase Auth with server-side cookie storage provided by
`@supabase/ssr`. The application exposes `/login`, `/sign-up`, and the protected
`/dashboard` route. Server Actions handle password sign-in, sign-up, and
sign-out. `src/proxy.ts` refreshes the session cookies, while the dashboard also
verifies the current user with Supabase Auth before rendering.

Email confirmation is completed by the server Route Handler at `/auth/confirm`.
The preferred email link sends `token_hash` and `type=email`; the handler verifies
the token with Supabase Auth, stores the returned session in cookies, and then
redirects to `/dashboard`. A PKCE `code` callback is also accepted for
compatibility. The optional `next` parameter is accepted only when it is a safe
internal path.

### Supabase Auth configuration

In **Authentication → URL Configuration** in the Supabase Dashboard:

1. Set the local Site URL to `http://localhost:3000` while testing locally, or
   use the canonical HTTPS application URL in production.
2. Add `http://localhost:3000/auth/confirm` to **Redirect URLs** for local
   testing.
3. Add `https://your-production-domain.example/auth/confirm` for production,
   replacing the example domain with the real application domain.

In **Authentication → Email Templates → Confirm signup**, make the confirmation
link target the server handler by using the following URL in the link's `href`:

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

The application passes `.RedirectTo` through `emailRedirectTo` during sign-up.
Both the local and production callback URLs must be present in the Supabase
redirect allow list.

### Environment variables

Copy the variable names from `.env.example` into `.env.local` for local
development. Do not commit their real values.

- `NEXT_PUBLIC_SUPABASE_URL` — project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable project key.
- `NEXT_PUBLIC_SITE_URL` — canonical application origin, without a trailing
  path. Use `http://localhost:3000` locally and the public HTTPS origin in
  production.

If `NEXT_PUBLIC_SITE_URL` is absent during local development, the sign-up action
uses the current request origin and finally falls back to
`http://localhost:3000`. Production deployments should always set it explicitly.

### Test email confirmation locally

1. Apply any outstanding migration, including
   `20260915010000_add_profile_creation_trigger.sql` when required.
2. Complete the Dashboard URL and email-template configuration above.
3. Set the three environment variables and run `npm run dev`.
4. Register a new email at `/sign-up` and open the confirmation email.
5. Follow the link and verify that it opens `/auth/confirm`, then redirects to
   `/dashboard` with the new user signed in.
6. Sign out and verify the redirect to `/login`.
7. Sign in again with the same email and password.
8. Reopen the used confirmation link and verify that the safe error page is
   shown without token or provider details.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
