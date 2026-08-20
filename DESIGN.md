---
name: Iced Coffee Calculator
description: A 1950s-advertising-inspired iced coffee calculator and guided brew timer.
colors:
  cool-paper: "oklch(0.975 0.008 200)"
  ink: "oklch(0.180 0.020 230)"
  mineral-teal: "oklch(0.450 0.090 200)"
  refrigerator-aqua: "oklch(0.790 0.105 200)"
  cherry-red: "oklch(0.530 0.205 28)"
  mustard-yellow: "oklch(0.840 0.160 95)"
  coffee-brown: "oklch(0.360 0.080 50)"
typography:
  display:
    fontFamily: "Bowlby One SC, Impact, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Atkinson Hyperlegible, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  control: "10px"
  control-inner: "7px"
  panel: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.cherry-red}"
    textColor: "{colors.cool-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  input-stepper:
    backgroundColor: "{colors.cool-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px"
  panel-pick:
    backgroundColor: "{colors.mineral-teal}"
    textColor: "{colors.cool-paper}"
    padding: "24px"
  panel-tune:
    backgroundColor: "{colors.refrigerator-aqua}"
    textColor: "{colors.ink}"
    padding: "24px"
  panel-brew:
    backgroundColor: "{colors.mustard-yellow}"
    textColor: "{colors.ink}"
    padding: "24px"
---

# Design System: Iced Coffee Calculator

## Overview

**Creative North Star: "The Countertop Comic"**

Iced Coffee Calculator feels like a cheerful 1950s appliance advertisement that has become a dependable modern tool. Pick, Tune, and Brew share one connected comic frame, while thick ink dividers, flat spot colors, slight print misregistration, and a recurring ice-cube mascot carry the period character.

The app is used with occupied hands in a bright kitchen. Controls therefore remain conventional, large, and unambiguous. The period styling frames the task; it never obscures values, labels, focus, or state.

**Key Characteristics:**

- Three-panel vertical story on mobile; two-column working surface on tablet; three-column comic strip on wide screens, always inside one shared poster frame.
- Flat spot colors with near-black dividers and one crisp outer-frame shadow.
- Generated raster illustration for the mascot and drink; semantic HTML for all UI text.
- The ice mascot is the sole visual protagonist: large in the masthead, prominent beside the primary action, and repeated in timer focus mode.
- Dense enough to avoid scrolling during adjustment, spacious enough for 44px touch targets.

## Colors

The palette uses appliance-era aqua and teal for structure, mustard for the calculated payoff, and cherry red only for the primary action and urgent timer moments.

### Primary

- **Mineral Teal:** Owns selection surfaces and quiet structural color.
- **Cherry Red:** Reserved for the primary action, timer completion, and errors.

### Secondary

- **Refrigerator Aqua:** Carries the adjustment panel and selected secondary controls.
- **Mustard Yellow:** Carries the calculated recipe and celebratory completion state.
- **Coffee Brown:** Grounds coffee-specific quantities and illustration details.

### Neutral

- **Cool Paper:** The printed-sheet canvas and input surface.
- **Near-Black Ink:** All body text, outlines, and hard shadows.

**The Spot-Ink Rule.** Every color has a job. Do not add one-off hues, gradients, or translucent overlays.

**The Red Means Act Rule.** Cherry red appears on the primary action, error, or completed timer—not as ambient decoration.

## Typography

**Display Font:** Bowlby One SC (with Impact fallback)
**Body Font:** Atkinson Hyperlegible (with Arial fallback)

**Character:** The display face has the compressed confidence of hand-lettered mid-century advertising. The body family is quiet and highly legible so recipe values and timer instructions stay useful.

### Hierarchy

- **Display** (400, 2.5rem, 0.95): Wordmark and rare panel numerals only.
- **Headline** (700, 1.5rem, 1.1): Panel headings and active timer stage.
- **Title** (700, 1.125rem, 1.2): Output quantities and grouped controls.
- **Body** (400, 1rem, 1.5): Instructions and supporting copy, capped at 65ch.
- **Label** (700, 0.875rem, 0.02em): Buttons, fields, and short quantity labels.

Responsive display tokens cover the expressive exceptions: masthead `2.05–4.4rem`, recipe results `1.6–2.1rem`, timer heading `1.8–3.5rem`, and timer clock `4.5–9rem`. Compact unit labels may use `0.72rem` only inside the narrow wide-screen Brew panel.

**The One Loud Voice Rule.** Display lettering belongs to the masthead and numbered panel headings; never use it for form labels or instructions.

## Elevation

Depth is printed and structural rather than atmospheric. The connected poster frame and primary controls use a 3–4px near-black offset shadow with zero blur; internal panels stay flat and share ink dividers.

### Shadow Vocabulary

- **Ink Offset** (`4px 4px 0 oklch(0.180 0.020 230)`): Connected comic frame and primary action.
- **Pressed Offset** (`1px 1px 0 oklch(0.180 0.020 230)`): Active button state.

**The Printed Depth Rule.** Blur is forbidden. If a shadow looks soft, it does not belong in this system.

## Components

### Buttons

- **Shape:** Firmly curved rectangle (10px), never a bloated capsule unless the control is a compact chip.
- **Internal Segments:** Stepper buttons use the 7px control-inner radius so they nest cleanly inside the 10px shell.
- **Primary:** Cherry red, cool-white text, 3px ink outline, and Ink Offset shadow.
- **Hover / Focus:** Hover lifts 2px on fine pointers; focus uses a 3px mustard ring with 3px offset.
- **Active:** Translate into the shadow and switch to Pressed Offset.

### Chips

- **Style:** Cool Paper with a 2px ink perimeter; compact full-pill shape is allowed.
- **State:** Selected chips use Refrigerator Aqua plus a visible check or label change, never color alone.

### Cards / Containers

- **Corner Style:** The outer comic frame uses the 14px printed-panel curve; internal panels remain square and flush.
- **Background:** One deliberate spot color per Pick, Tune, and Brew panel.
- **Shadow Strategy:** Ink Offset belongs to the outer frame, not every panel.
- **Border:** One 3px near-black perimeter with 3px shared internal dividers.
- **Internal Padding:** 16px on phone, 24–32px when the container earns it.

### Inputs / Fields

- **Style:** Cool Paper, 3px ink outline, 10px corners, visible labels, tabular numerals.
- **Focus:** Mustard 3px exterior ring.
- **Error / Disabled:** Error pairs Cherry Red with an inline message; disabled reduces saturation but keeps readable ink.
- **Range:** A native range input sits over a 14px paper-and-ink track with flat teal progress, printed tick marks, and a 28px mustard thumb. The adjacent summary always translates the percentage into hot-water and ice quantities.

### Navigation

The single-purpose app has no persistent navigation. A compact masthead keeps context; timer focus mode provides an explicit back control.

### Brew Panel

The three calculated quantities are the visual payoff. They share one divided results tray and use consistent units: coffee and ice in grams, liquid water in millilitres.

## Do's and Don'ts

### Do:

- **Do** keep the Pick → Tune → Brew reading order intact on every viewport.
- **Do** use generated raster illustration for custom character art and HTML/CSS for controls and text.
- **Do** provide 44px minimum touch targets, visible focus, and reduced-motion behavior.
- **Do** use the defined spot inks and zero-blur offset shadows consistently.

### Don't:

- **Don't** drift into generic minimalist coffee branding or cream-and-brown café nostalgia.
- **Don't** use modern SaaS glassmorphism, gradients, translucent panels, or soft shadows.
- **Don't** make the interface a sterile laboratory dashboard or photorealistic luxury-coffee experience.
- **Don't** use hand-drawn SVG scenes, rasterized UI text, side-stripe accents, or identical nested cards.
