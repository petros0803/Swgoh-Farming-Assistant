# SWGoH Farming Assistant

React + Vite tracker for Executor, GL Leia, C-3PO, Jedi Knight Luke, and GL Jabba farms.

## Develop

```bash
npm install
npm run dev
```

## Accounts and sign-in

Saved player accounts live in Supabase and belong to the signed-in user. Each account has a name, a description, and a 9-digit ally code. The key in `.env` is the public anon or publishable key. It cannot run SQL, so it cannot drop tables or the database. After you run `supabase/player_accounts.sql`, each login can only read and change its own rows, and the database assigns the owner itself.

1. Create a Supabase project and turn on the Email auth provider.
2. In the SQL editor, run `supabase/player_accounts.sql`.
3. Copy `.env.example` to `.env` and set the project URL and the **anon** key (Project Settings → API). Leave the service role key out of this app.
4. In Authentication → Sign In / Providers → Email, turn off **Confirm email** and save. The publishable key cannot change this. Set the Site URL to `https://petros0803.github.io/Swgoh-Farming-Assistant/` and add that same address under Redirect URLs. Then restart `npm run dev`.
5. GitHub Pages does not read `.env`. In the repository, open Settings → Secrets and variables → Actions and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same two values. The Pages workflow bakes them into the site on the next deploy from `main`. Use the anon key only. Leave the secret key out of GitHub.

Until those keys are present, the tracker still runs and the header keeps the built-in ally codes. After sign-in, that menu lists the accounts stored for the login instead. `supabase-js` is pinned to 2.109.0 so it stays compatible with this repo's Node 20 engine.

## Game catalog

Characters, ships, farms, relic costs, assault battles, and the related lookup tables live in Supabase. The browser still does the farming math. Supabase turns each table into a REST API automatically, so a signed-in session is not required to read them.

1. In the SQL editor, run `supabase/game_catalog.sql`.
2. In Project Settings → API, copy the **secret** key (older projects call this the service_role key). Add it to `.env` as `SUPABASE_SECRET_KEY`. Do not prefix it with `VITE_`.
3. Load the current game files into the database:

```bash
npm run seed:catalog
```

`npm run seed:catalog -- --dry-run` prints the row counts without writing. Re-running the seed upserts the same ids.

The app reads `/rest/v1/units`, `/rest/v1/farms`, and the other catalog tables on startup. `characters` and `ships` are read-only views. If the tables are missing or the request fails, the tracker keeps using the copies in `src/data/` so the pages still open.

```bash
curl "$VITE_SUPABASE_URL/rest/v1/characters?select=id,name&order=name.asc&limit=5" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

## Build and preview

```bash
npm run lint
npm test
npm run build
npm run preview
```

Production assets are built with the GitHub Pages base path `/Swgoh-Farming-Assistant/`. Character and ship portraits live in `public/assets/`. Maintenance scrapers live in `scripts/`.

Styling uses Sass for document reset (`src/styles/`) and styled-components for UI, all reading from `src/theme/`. Colors, spacing, type, and radii live in the theme object so additional palettes and type scales can be added without rewriting components. `useThemeSettings()` is the switcher API for later.

