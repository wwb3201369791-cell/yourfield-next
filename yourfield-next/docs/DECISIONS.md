# DECISIONS - ADR Index

## D-001: CSS framework choice

**Decision**: Use Tailwind CSS v3.4 with the legacy site CSS variables bridged into
`theme.extend`.

**Date**: 2026-05-16

**Reasons**:

- Tailwind v3.4 is explicitly allowed by the implementation plan and avoids the Tailwind v4
  migration surface for this phase.
- The legacy color, radius, shadow, and transition tokens can stay as CSS variables, preserving
  the existing brand baseline while still allowing utility classes in React components.
- JIT output stays small because Tailwind scans only `src/**/*.{js,jsx,ts,tsx,mdx}`.
- Future maintainers can read styles directly in component markup without adding a separate
  CSS-in-JS runtime.

**Alternatives considered**:

- CSS Modules: lower conceptual overhead for plain CSS, but it would create more per-component
  boilerplate during the P1 visual migration.
- vanilla-extract: stronger typed styles, but it adds more setup and a smaller maintenance surface
  for the company IT handoff.

**Implementation notes**:

- `src/styles/variables.css` keeps the legacy `:root` brand tokens.
- `tailwind.config.js` maps those tokens into Tailwind colors, radii, shadows, font family, and
  transition defaults.
- The legacy site has no spacing variables, so Tailwind's default spacing scale remains the spacing
  baseline for now.

**Conditions for revisiting**:

- Payload rich text rendering or content migration exposes a concrete conflict with utility-first
  styling.
- The user or receiving IT team explicitly rejects Tailwind utility classes as the long-term style
  convention.
