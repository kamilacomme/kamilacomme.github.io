---
name: Kamila Comme — Portfolio
description: A neutral frame with one soft pink accent, so the work on the wall carries the colour.
colors:
  primary: "#FDB4F5"
  primary-deep: "#821C78"
  primary-dark: "#330F2F"
  secondary: "#3ABAF3"
  secondary-deep: "#1C6D92"
  accent: "#CAE56C"
  accent-deep: "#687E15"
  page: "#FFFFFF"
  page-warm: "#FFFAFE"
  surface-muted: "#F6F4F6"
  surface-panel: "#F2EEF2"
  border-subtle: "#E6E0E6"
  border-functional: "#5C575C"
  ink: "#222022"
  ink-muted: "#5C575C"
  on-dark: "#FFFFFF"
typography:
  display:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.67
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  ticket: "8px"
  round: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  xxl: "96px"
components:
  button-hire:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "44px"
  nav-availability-pill:
    backgroundColor: "#F8F7F8"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
    height: "44px"
  language-switch:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "44px"
  language-switch-hover:
    backgroundColor: "{colors.ink-muted}"
    textColor: "{colors.on-dark}"
  ticket:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "20px"
  case-prompt:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "16px"
---

# Design System: Kamila Comme — Portfolio

## Overview

**Creative North Star: "The Frame and the Wall"**

The site is a frame; the work is the wall. The frame (navigation, text, panels, footer) stays neutral and quiet, with exactly one soft accent, so that the colour on the page is the colour of the projects: the burgundy of a leather bag, the moss of a campaign, the pink of a wellness brand. This is the system's own founding principle, written into its colour tokens ("the frame stays neutral plus one accent; the wall carries the real colour"), and everything below follows from it.

The mood is calm, exact and a little playful. Figtree Bold gives short, tightly tracked statements; Inter keeps everything else small and plain. Space is generous and structural: a 12-column grid, a 32px page margin, large vertical gaps between chapters. The interface recedes in front of the images and never competes with them. It is bilingual by structure: French and English carry the same weight and the same layout.

**Key Characteristics:**
- Neutral surfaces (white, off-white, two pale greys) with ink-black text; one pink accent, used for the single call to action and for focus.
- Two typefaces only: Figtree Bold for display, Inter Regular for everything else.
- Almost flat: no shadows except one on the floating language switch; depth comes from pale tonal panels laid over images.
- Small radius (4px) everywhere, 8px only on the layered project ticket.
- Images are cropped, never decorated: no frames, borders or filters of the interface's own.

## Colors

A restrained neutral palette with one pink accent and two rarely used supporting hues; the projects' imagery supplies all other colour.

### Primary
- **Soft Orchid Pink** (#FDB4F5): the fill of the one call-to-action button ("Hire me") and the focus ring. Text on it is always ink (10.04:1).
- **Deep Plum** (#821C78): pink when it must be text on white (8.80:1). The only pink allowed as text.
- **Night Plum** (#330F2F): the dark section cover (Hero, Footer curtain).

### Secondary
- **Clear Sky Blue** (#3ABAF3) and **Harbour Blue** (#1C6D92): defined in the colour tokens but not used by any current page or stylesheet. Treat them as reserved until a case study needs them.

### Tertiary
- **Lemon Spark** (#CAE56C): the "available for work" dot and focus on dark project rails only. **Moss Lemon** (#687E15, 4.58:1) is its text-safe form.

### Neutral
- **White** (#FFFFFF): the page surface. **Off-white Bloom** (#FFFAFE): the warm brand background.
- **Mist** (#F6F4F6) and **Pale Lilac Grey** (#F2EEF2): quiet panels (prompt box, ticket panel).
- **Hairline Grey** (#E6E0E6): subtle borders and dividers.
- **Ink** (#222022): default text and the default dark. **Slate** (#5C575C): secondary text, functional borders and hover fills (7.06:1, the lightest grey allowed for text).

### Named Rules
**The One Accent Rule.** Pink marks the single action and the focus state. If a second thing on a screen is pink, one of them is wrong.
**The Real Colour Rule.** Interface colour never competes with project colour. Do not tint panels, captions or menus to match an image.
**The Text Grey Rule.** Text is Ink or Slate, never a lighter grey. Lighter greys (#D6D1D6, #BDB7BD, #9E9A9E) are for lines and fills only; a reduced-opacity Ink may stand in for Slate only where the result stays above 4.5:1.

## Typography

**Display Font:** Figtree (with system-ui)
**Body Font:** Inter (with system-ui)

**Character:** A binary hierarchy: a big, tight, bold Figtree against a small, plain Inter, with little in between. Tracking tightens as text grows (−0.03em) and opens as it shrinks (+0.04em on uppercase labels).

### Hierarchy
- **Display** (Figtree 700, 88px, 1.1, −0.03em): the largest statements. Rare.
- **Headline** (Figtree 700, 56px desktop, 48px tablet, 32px mobile, 1.1, −0.03em): section and chapter headings.
- **Title** (Figtree 700, 40px desktop, 32px tablet, 24px mobile, −0.03em): project and episode titles.
- **Body** (Inter 400, 16px, 1.6 in running text, −0.01em, Slate): descriptions and About text; keep lines to about 40rem.
- **Caption** (Inter 400, 14px, 1.5, Slate): captions, card descriptions, the prompt box.
- **Label** (Inter 400, 12px, +0.04em, uppercase, Slate): navigation links, tags, section labels.
- **Accent italic** (Figtree 400 italic): the one emphasised word inside a heading, and the case accent quote.

### Named Rules
**The Two Voices Rule.** Figtree for structure, Inter for everything else. No third family, and no Figtree in running text.
**The Unused Font Note.** The page head also requests Epilogue 500 from Google Fonts (`templates/page.html`, `templates/case.html`), but no stylesheet or page uses it. It is not part of the system; do not use it, and removing the request is a separate decision because it changes the shared head of every page.
**The No-Scaling Rule.** Text keeps its approved size per profile (desktop, tablet, mobile); layouts reflow around it instead of shrinking it.

## Layout

A 12-column grid with a 24px gutter on desktop and tablet, 4 columns and a 16px gutter on mobile, inside a 32px page margin (16px on mobile; on the homepage desktop the margin scales slightly with the scene, 23–35px). Content stops growing at 1584px. Spacing steps are 8, 16, 24, 32, 40, 48, 64, 80, 96 and 128px; chapters are separated by 64–96px.

Responsive behaviour follows the active profile (mobile under 500px; tablet up to 1080px or touch devices up to 1366px; otherwise desktop), not width alone. A composition that cannot fit grows and scrolls; it does not shrink its text. Case-study blocks are laid out from the width of their own container (one column, two, then one per frame), so they behave the same in any column; only the full-screen hero follows the screen.

A fixed navigation bar (72px) sits above everything, with a fixed 44px language switch at the bottom-right gutter. Tap targets are at least 44px.

## Elevation & Depth

Flat. Surfaces sit on the page without shadows; hierarchy comes from tone (white page, pale panels) and from imagery. The only shadow is on the floating language switch, because it sits over arbitrary content.

### Shadow Vocabulary
- **Floating control** (`box-shadow: 0 1px 5px rgba(8, 8, 10, 0.22)`): the language switch only.
- **Glass pill** (`backdrop-filter: blur(16px) saturate(1.4)`): the availability pill in the navigation, over imagery.

### Named Rules
**The Flat-By-Default Rule.** Nothing casts a shadow at rest except the language switch. New components stay flat; they do not borrow a shadow to look important.

## Shapes

Gently rounded: a 4px radius on buttons, pills, panels, images and prompt boxes; 8px on the outer edge of the layered project ticket; a full circle on the language switch. No borders as decoration, no thick lines, no numbered markers. Images are cropped to their cell with the subject kept in view (focus point), never distorted.

## Components

### Hire button
- **Shape:** 4px radius, 44px high, 12px 24px padding.
- **Primary:** Soft Orchid Pink fill, Ink Inter 14px label ("Hire me" / "Me recruter").
- **Hover / Focus:** reduced opacity on hover (links and buttons never change colour); 2px pink focus ring with 3px offset.

### Availability pill
- **Style:** pale grey fill with hairline border and glass blur, a pulsing Lemon Spark dot and a 12px uppercase Slate label. Hidden on narrow profiles.

### Navigation
- **Style:** Figtree Bold wordmark at the left, three 12px uppercase links centred, pill and button at the right. Link colour never changes; opacity drops to 0.7 on hover. Ink flips to white over dark surfaces.

### Language switch
- **Shape:** 44px white circle with a soft shadow, "FR"/"EN" in 12px Inter.
- **Hover / Focus:** Slate fill with white text; 3px pink focus ring.

### Layered project ticket
- **Corner Style:** 8px outer, 4px for the panel and image.
- **Background:** the project's own poster fills the ticket; a Pale Lilac Grey panel sits on it with the title (Figtree 700, 40px), a 14px description, uppercase tags and a barcode strip.
- **Shadow Strategy:** none.

### Case chapter menu
- **Style:** a sticky row under the navigation, on the page surface, label type; inactive chapters at 64% opacity, hover, focus and current at full. Compact on narrow screens: one row with the current chapter that opens a list. No lines, no numbers.

### Case frames and prompt box
- **Frames:** 4px radius, Mist placeholder while loading, image cropped with its focus point.
- **Prompt box:** 14px Inter on Mist, 16px padding, line breaks kept.

## Do's and Don'ts

### Do:
- **Do** keep the interface neutral (white, Mist, Pale Lilac Grey, Ink, Slate) and let the projects carry colour.
- **Do** use Soft Orchid Pink only for the one call to action and for focus.
- **Do** keep text at its approved size per profile and let layouts reflow around it.
- **Do** keep every tap target at 44px or more and every focus state visible.
- **Do** crop images with a focus point so faces stay in view, and keep readable text as text, never inside an image.
- **Do** give French and English the same facts, layout and visual weight.

### Don't:
- **Don't** introduce a third typeface or a new colour; extend the existing tokens or ask first.
- **Don't** use greys lighter than Slate for text.
- **Don't** change a link's colour on hover; weight or opacity is the signal.
- **Don't** add shadows, thick black lines, numbering or decorative borders to the interface.
- **Don't** scale text with the viewport to make a composition fit.
- **Don't** fabricate facts, figures, clients or quotes in case studies; leave the gap instead.
