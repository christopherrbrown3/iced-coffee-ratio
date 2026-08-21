# Iced Coffee Calculator

**[Open the live calculator →](https://christopherrbrown3.github.io/iced-coffee-ratio/)**

A colorful, mobile-first iced coffee ratio calculator and guided brew timer. Choose a researched recipe and compatible brewer, adjust the batch, ratio, or ice split, and get exact coffee, hot-water, and ice quantities immediately.

The app is a static React PWA: no account, API, database, or backend.

## Recipes and brewers

The curated presets each have their source ratios, compatible brewer list, and timer flow:

| Recipe | Starting recipe | Guided method |
| --- | --- | --- |
| [James Hoffmann iced immersion](https://www.youtube.com/watch?v=8uGGeV8A-BM) | 75 g/L total water; 34% ice | 4–5 minute steep, ice cue, release |
| [Counter Culture flash brew](https://counterculturecoffee.com/pages/flash-brew) | 30 g coffee; 335 g hot water; 165 g ice | Bloom and pulse-pour cues |
| [April high-ice pour-over](https://www.youtube.com/watch?v=6B0lRF3kG4s) | 20 g coffee; 200 g hot water; 200 g ice | Fast circle pour, then center pour |
| [Kurasu Japanese iced V60](https://kurasu.kyoto/blogs/kurasu-journal/brew-guide-on-iced-pour-over-coffee) | 16 g coffee; 150 g hot water; 70 g ice | Three pours with agitation cues |
| [Lance Hedrick low-ice flash brew](https://www.youtube.com/watch?v=qwvnQcojq9Q) | 20 g coffee; 240 g hot water; about 60 g ice | Long bloom, two pours, then active cooling |
| [AeroPress Japanese flash](https://aeropress.com/blogs/aeropress-recipes/japanese-coffee) | 20 g coffee; 170 g hot water; 150 g ice | 1:30 steep, then press |

Supported brewers include the Hario Switch 02/03, Clever Dripper, [NextLevel Pulsar](https://nextlevelbrewer.com/shop/nextlevel-pulsar-brewer/), Hario V60 02, April Brewer, and AeroPress with the Flow Control cap used by the selected recipe. Numeric capacity warnings are used only for brewers that retain the full hot-water dose; flow-through pour-over brewers intentionally have no fabricated capacity limit.

## Features

- Coffee in grams, liquid water in millilitres, and ice in grams
- Live total-water ratio and 20–50% ice adjustment
- Stable starting recipes with an explicit Adjusted state and one-tap reset
- Comic-styled steppers, quick batch sizes, and a custom accessible range control
- Recipe-owned, batch-scaled timer cues for all six recipes
- Pause/resume, optional sound and vibration cues, and best-effort screen wake lock
- Brewer-capacity warnings with one-tap scaling
- Saved settings, installable PWA, and offline support after first load
- Responsive 1950s-advertisement art direction with a custom ice cube, coffee bean, and iced-cup mascot cast

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

Kurasu's source ratio is 1:13.75; the preset uses 1:13.8 to match the calculator's tenth-step control while still reproducing the 16 g / 150 g / 70 g source batch after kitchen rounding.

Pour targets scale with the batch, while source cue times remain practical guidance. Lance's timer switches to an elapsed final-pour and chilling stage at 1:45 because the original recipe deliberately leaves drawdown time variable.

## Deployment

Pushes to `main` are tested, built, and published to GitHub Pages by [the deployment workflow](.github/workflows/deploy.yml). Vite is configured for the `/iced-coffee-ratio/` base path.

Product intent is documented in [PRODUCT.md](PRODUCT.md), and the visual system is documented in [DESIGN.md](DESIGN.md).
