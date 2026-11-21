<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dfcf8161-18e5-48b0-96d7-9157af19cccd

## Run Locally

**Prerequisites:** Node.js 24 LTS and npm.


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

Open http://localhost:3000. The current app runs entirely in the browser;
no Gemini API key or backend is required.

## Verify and build

```sh
npm run lint
npm run build
npm run preview
```

`lint` checks TypeScript types. The production build is written to `dist/`.
Use `npm ci` for subsequent installs from `package-lock.json`; `bun.lock`
is retained from the original AI Studio export and is not the npm lockfile.

## Project overview

- React, TypeScript, Vite, Tailwind CSS and an installable PWA.
- HSK 1–6 vocabulary in `public/data`, FSRS review scheduling, writing practice,
  tone training and ten mini-games.
- Progress and settings use localStorage; vocabulary and stroke data use IndexedDB.
- Speech uses browser/system voices. Stroke data and web fonts need an initial
  network connection before they can be cached for offline use.
- `src/App.tsx` coordinates screens; `src/components` contains the UI;
  `src/services` contains storage, vocabulary loading, speech and review scheduling.
