# Iced Coffee Calculator

**[Open the live calculator →](https://christopherrbrown3.github.io/iced-coffee-ratio/)**

A colorful, mobile-first iced coffee ratio calculator and guided brew timer. Choose a researched recipe and compatible brewer, adjust the batch, ratio, or ice split, and get exact coffee, hot-water, and ice quantities immediately.

The app is a static React PWA: no account, API, database, or backend.

## Recipes and brewers

The curated presets each have their own defaults, compatible brewer list, and timer flow:

| Recipe | Starting recipe | Guided method |
| --- | --- | --- |
| [James Hoffmann iced immersion](https://www.youtube.com/watch?v=8uGGeV8A-BM) | 75 g/L total water; 34% ice | 4–5 minute steep, ice cue, release |
| [Counter Culture flash brew](https://counterculturecoffee.com/pages/flash-brew) | 30 g coffee; 335 g hot water; 165 g ice | Bloom and pulse-pour cues |
| [AeroPress Japanese flash](https://aeropress.com/blogs/aeropress-recipes/japanese-coffee) | 20 g coffee; 170 g hot water; 150 g ice | 1:30 steep, then press |

Supported brewers include the Hario Switch 02/03, Clever Dripper, [NextLevel Pulsar](https://nextlevelbrewer.com/shop/nextlevel-pulsar-brewer/), Hario V60 02, and AeroPress Original. Numeric capacity warnings are used only for brewers that retain the full hot-water dose; the flow-through V60 intentionally has no fabricated capacity limit.

## Features

- Coffee in grams, liquid water in millilitres, and ice in grams
- Live total-water ratio and 20–50% ice adjustment
- Comic-styled steppers, quick batch sizes, and a custom accessible range control
- Recipe-aware immersion, pulse-pour, and AeroPress timers
- Pause/resume, optional sound and vibration cues, and best-effort screen wake lock
- Brewer-capacity warnings with one-tap scaling
- Saved settings, installable PWA, and offline support after first load
- Responsive 1950s-advertisement art direction with custom ice-mascot artwork

## Run locally

```bash
npm install
npm run dev
```

Verify the project with:

```bash
npm test
npm run build
```

## Recipe math

For total recipe water `W`, ratio denominator `R`, and ice fraction `I`:

- coffee: `W ÷ R`
- ice: `W × I`
- hot water: `W − ice`

Water uses the kitchen-friendly approximation `1 mL ≈ 1 g`. Presets are starting points, not universal prescriptions; grind, water temperature, agitation, and coffee all affect extraction.

## Deployment

Pushes to `main` are tested, built, and published to GitHub Pages by [the deployment workflow](.github/workflows/deploy.yml). Vite is configured for the `/iced-coffee-ratio/` base path.

Product intent is documented in [PRODUCT.md](PRODUCT.md), and the visual system is documented in [DESIGN.md](DESIGN.md).
