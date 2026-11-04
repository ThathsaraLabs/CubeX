# CubeX

CubeX is a browser based Rubik's Cube workspace built with React, TypeScript, Vite, and Three.js. It includes an interactive cube, a solver, a manual cube editor, an optional camera scanner, and hand gesture controls.

## Run locally

Requires Node.js 22 or a recent supported Node.js release.

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

Vite writes the production site to `dist/`. The site uses relative asset paths so it can be hosted at a GitHub Pages repository URL as well as a domain root.

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the site whenever code is pushed to `main`, and can also be started manually from the Actions tab.

1. Push this folder to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions** and wait for **Deploy to GitHub Pages** to finish. GitHub will show the published URL under the `github-pages` environment and in the Pages settings.

Camera and microphone browser APIs require a secure context. They work on the deployed HTTPS site and on `localhost`; they are not available on an ordinary HTTP address. Camera frames and hand tracking are processed in the browser.

## Available commands

- `npm run dev` — start the local development server
- `npm run build` — type-check and create the production site
- `npm run test` — run the Vitest suite
- `npm run lint` — run ESLint
