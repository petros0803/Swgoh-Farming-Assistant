# SWGoH Farming Assistant

React + Vite tracker for Executor, GL Leia, C-3PO, Jedi Knight Luke, and GL Jabba farms.

## Develop

```bash
npm install
npm run dev
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

