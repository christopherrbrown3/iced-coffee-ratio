# Ratio Hero

Ratio Hero is a mobile-first iced coffee ratio calculator and guided brew timer for immersion brewers. It turns a total-water recipe into coffee, hot-water, and ice quantities, then walks through the brew with audible/vibration cues.

The visual direction is a colorful three-panel comic inspired by 1950s appliance advertising. The interface and custom artwork remain readable, touch-friendly, and useful at the counter.

## Features

- Hoffmann-style iced immersion starting point: 75 g/L total water with a 66% hot-water / 34% ice split
- Hario Switch 02, Hario Switch 03, and Clever Dripper capacity checks
- Adjustable total water, coffee ratio, ice split, roast, and quick batch sizes
- Timestamp-based steep timer with pause/resume, ice cue, drawdown stage, optional sound/vibration, and best-effort screen wake lock
- Saved settings, installable PWA, and offline use after the first visit
- Static React/Vite build with no account, API, or backend

## Run locally

```bash
npm install
npm run dev
```

Run the verification suite with:

```bash
npm test
npm run build
```

## Recipe math

For total recipe water `W`, ratio denominator `R`, and ice percentage `I`:

- coffee: `W / R`
- ice: `W × I`
- hot water: `W − ice`

Water uses the kitchen-friendly approximation `1 mL ≈ 1 g`.

The default is based on [James Hoffmann's immersion iced coffee technique](https://www.youtube.com/watch?v=8uGGeV8A-BM). Brewer capacities are treated as guardrails, not promises about headroom; always follow the brewer's own safe-use instructions.

## Deployment

Pushes to `main` are tested, built, and deployed to GitHub Pages by [the Pages workflow](.github/workflows/deploy.yml). Vite's base path is configured for the `iced-coffee-ratio` repository.

Product intent lives in [PRODUCT.md](PRODUCT.md), and the approved visual system lives in [DESIGN.md](DESIGN.md).
