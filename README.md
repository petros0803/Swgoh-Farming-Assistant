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

Until those keys are present, the tracker still runs and the header keeps the built-in ally codes. After sign-in, that menu lists the accounts stored for the login instead. `supabase-js` is pinned to 2.109.0 so it stays compatible with this repo's Node 20 engine.

## Build and preview

```bash
npm run lint
npm test
npm run build
npm run preview
```

Production assets are built with the GitHub Pages base path `/Swgoh-Farming-Assistant/`. Character and ship portraits live in `public/assets/`. Maintenance scrapers live in `scripts/`.

Styling uses Sass for document reset (`src/styles/`) and styled-components for UI, all reading from `src/theme/`. Colors, spacing, type, and radii live in the theme object so additional palettes and type scales can be added without rewriting components. `useThemeSettings()` is the switcher API for later.

