# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Nusavira
**Category:** RPG Gacha Game

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#FFD700` | `--primary` |
| Secondary | `#8B4513` | `--secondary` |
| Background | `#0a0a0a` | `--bg-dark` |
| Panel | `#1a1a1a` | `--panel-bg` |
| Text | `#ffffff` | `--text-light` |

**Color Notes:** Deep retro console dark mode with brilliant gold accents and warm wood/leather secondary colors.

### Typography

- **Heading Font:** Press Start 2P
- **Body Font:** VT323
- **Mood:** pixel, retro, gaming, 8-bit, nostalgic, arcade

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.5)` | Subtle lift |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.8)` | Cards, buttons |
| `--shadow-glow`| `0 0 10px rgba(255, 215, 0, 0.5)` | Gold glow for rare items/buttons |

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--primary);
  color: #000;
  padding: 10px 20px;
  border: 4px solid #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  text-transform: uppercase;
  transition: all 0.1s ease;
  cursor: pointer;
  box-shadow: 4px 4px 0 #000;
}

.btn-primary:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
  filter: brightness(1.2);
}
```

### Cards & Panels

```css
.panel-impeccable {
  background: var(--panel-bg);
  border: 4px solid var(--secondary);
  border-radius: 0; /* Strict pixel art uses blocky corners */
  padding: 20px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 6px 6px 0px rgba(0,0,0,0.5);
  color: var(--text-light);
}
```

---

## Style Guidelines

**Style:** Pixel Art / Retro RPG

**Keywords:** 16-bit, chunky borders, high contrast, CRT scanlines, arcade, nostalgic, game UI

**Best For:** Indie games, interactive storytelling

**Key Effects:** Blocky translations (no smooth anti-aliased curves), pixelated borders, hard drop shadows, scanline overlays, hover states that "push" down physically (`translate: 2px 2px`).

### Page Pattern

**Pattern Name:** Game Client Showcase
- **CTA Placement:** Centered or bottom navigation
- **Section Order:** Lobby > Menus > Overlay Modals

---

## Anti-Patterns (Do NOT Use)

- ❌ **Soft Shadows & Blurs** — Do not use modern iOS/Material soft shadows (`box-shadow: 0 10px 15px rgba(...)`). Use hard offsets (`4px 4px 0 #000`).
- ❌ **Border Radius** — Do not use rounded corners (`border-radius: 12px`). Everything must remain blocky or use pixel-step borders.
- ❌ **Thin Fonts** — Do not use Inter, Roboto, or thin fonts. Stick to VT323 or Press Start 2P.

### Additional UI/UX Requirements

- ✅ **cursor:pointer** — All clickable elements must have `cursor:pointer`.
- ✅ **Responsive** — Ensure mobile layout stacks vertically instead of squishing.
- ✅ **Touch Targets** — Minimum 44x44px for mobile action buttons.
- ✅ **Contrast** — Ensure text on dark backgrounds remains legible.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Does it look like a 16-bit retro game?
- [ ] Are hover states physically responsive (e.g. `transform: translate`)?
- [ ] Are colors consistent with the gold/black/leather palette?
- [ ] Are mobile screens supported (no horizontal overflow)?
- [ ] Is `cursor:pointer` present on all buttons?
- [ ] Are we using the custom generated pixel art images instead of OS emojis?
