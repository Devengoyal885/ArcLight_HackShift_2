---
name: ui-ux-expert
description: Full UI/UX decision framework for CapAble. Use before implementing any new screen, component, or redesign. Covers design tokens, spacing, motion, component patterns, and anti-patterns.
---

# UI/UX Expert Skill — CapAble Design System

## Step 1: Read Tokens First

ALWAYS open `src/styles/tokens.css` before writing any CSS.
All colors, spacing, radii, shadows, and typography live there.

Key token namespaces:
- `--color-*` — semantic colors (primary, surface, text, border)
- `--space-*` — spacing scale (4px base unit)
- `--radius-*` — border radii (sm, md, lg, xl, full)
- `--shadow-*` — elevation shadows
- `--font-*` — typography (Inter font family)
- `--transition-*` — animation durations

## Step 2: Design Language Reference

### Visual Style
- Dark-first interface with glassmorphism panels
- Primary accent: `var(--color-primary)` (blue/indigo spectrum)
- Surfaces use `var(--color-surface)` with `backdrop-filter: blur()`
- All cards have `border: 1px solid var(--color-border)` + `border-radius: var(--radius-xl)`

### Typography Scale
```
h1: 2.5rem / 700 weight
h2: 1.75rem / 600 weight
h3: 1.25rem / 600 weight
body: 1rem / 400 weight
caption: 0.875rem / 400 weight
label: 0.75rem / 600 weight / uppercase / letter-spacing: 0.05em
```

### Spacing System
Use multiples of 4px. Token reference:
```
--space-1:  4px
--space-2:  8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
```

## Step 3: Motion Principles

Use Framer Motion for ALL animations. Never use CSS keyframes for page elements.

Standard patterns:
```tsx
// Page entry
initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}

// Card stagger
initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.04 }}

// Modal
initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
```

## Step 4: Component Patterns

### Buttons
- Primary: filled `var(--color-primary)` background
- Secondary: `border: 1px solid var(--color-border)`, transparent bg
- Ghost: no border, hover reveals background
- All buttons: `border-radius: var(--radius-md)`, `transition: all 0.2s`

### Cards
- Background: `var(--color-surface)` or glassmorphism
- Hover: `transform: translateY(-2px)`, elevated shadow
- Internal padding: `var(--space-6)`

### Form Inputs
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-border)` → focus: `var(--color-primary)`
- Border-radius: `var(--radius-md)`
- Transition on focus border color

### Status / Tags
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)
- Always use colored background at 10-15% opacity + full-color text

## Step 5: Anti-Patterns (Never Do)

- ❌ Never hardcode hex colors in components — use CSS tokens
- ❌ Never use inline styles for layout — use CSS classes
- ❌ Never use CSS transitions for mount/unmount — use Framer Motion AnimatePresence
- ❌ Never use Tailwind — always vanilla CSS with tokens
- ❌ Never use absolute font-sizes in px — use rem
- ❌ Never recreate an existing component from src/components/ui/

## Step 6: Existing Component Inventory

Read `COMPONENT_CATALOG.md` to see all available reusable components before building new ones.
Key available components:
- `<EmptyState>` — empty state with icon + message
- `<FloatingNavbar>` — role-aware navigation
- `<CompanyReviewsModal>` — company reviews popup
- `<SkillGapModal>` — skill gap analysis modal
- `<JobFilters>` — sidebar job filter panel
- `<JobMapView>` — map-based job discovery

## Step 7: Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (max-width: 1024px) { }

/* Desktop (default) */
```

Always design mobile-first. Ensure the FloatingNavbar is not overlapped by content.
