# Design rationale

**Concept:** the tax ledger. Rather than a generic fintech look (dark
navy, neon accent, rounded SaaS cards), the whole site is built around the
actual object at the center of the business — a tax return: ruled lines,
line-item codes, a form that gets checked off and stamped.

- **Line-item codes** (`T1`, `T2125`, `T2`, `GL`, `GST34`) next to each
  service are real Canada Revenue Agency form numbers matched to what that
  service actually files — not decorative numbering. T1 is the personal
  return, T2125 is the self-employment statement filed with it, T2 is the
  corporate return, GST34 is the GST/HST return, and GL (general ledger)
  stands in for bookkeeping, which has no CRA form of its own.
- **Hero illustration** — a mock intake ledger that checks itself off once
  on page load and ends with a "READY TO FILE" stamp. It's the one
  animated moment on the site; nothing else moves on scroll.
- **Palette** — pulled from the business card itself: the pale
  blue-grey background echoes the card stock, the brick red comes from the
  logo's bars, and a muted green is reserved only for confirmations
  (checkmarks, success states) so it stays meaningful rather than decorative.
- **Type** — Source Serif 4 for headings (reads like a printed document,
  not a startup landing page), IBM Plex Sans for body text and UI, and IBM
  Plex Mono specifically for numbers — phone numbers, line-item codes,
  form references — because those are literally numerals and codes, not
  because monospace looks technical.
- **No cards-with-shadows.** Sections are separated by hairline rules
  (ledger lines) and itemized rows instead of the identical
  rounded-corner-plus-drop-shadow card pattern, which doesn't fit a
  document-driven business.
